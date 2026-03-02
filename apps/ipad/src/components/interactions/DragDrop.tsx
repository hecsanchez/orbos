import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  PanResponder,
  LayoutRectangle,
  TouchableOpacity,
} from 'react-native';
import { tts } from '../../services/tts.service';
import { AGE_THEME, type AgeGroup } from '../../utils/age-theme';

export interface DragDropItem {
  id: string;
  label: string;
}

export interface DragDropTarget {
  id: string;
  label: string;
  accepts: string; // item id
}

export interface DragDropProps {
  instruction: string;
  tts_text: string;
  items: DragDropItem[];
  targets: DragDropTarget[];
  hint_text?: string;
  ageGroup?: AgeGroup;
  onComplete: (result: {
    correct: boolean;
    hint_used: boolean;
    time_spent_seconds: number;
  }) => void;
}

interface Placement {
  itemId: string;
  targetId: string;
}

export function DragDrop({
  instruction,
  tts_text,
  items,
  targets,
  hint_text,
  ageGroup = 'middle',
  onComplete,
}: DragDropProps) {
  const theme = AGE_THEME[ageGroup ?? 'middle'];
  const [canInteract, setCanInteract] = useState(false);
  const [placements, setPlacements] = useState<Placement[]>([]);
  const [lockedItems, setLockedItems] = useState<Set<string>>(new Set());
  const [flashTargetId, setFlashTargetId] = useState<string | null>(null);
  const [hintUsed, setHintUsed] = useState(false);
  const [showHintButton, setShowHintButton] = useState(false);
  const timerStart = useRef<number>(0);
  const lastCorrectTime = useRef<number>(0);
  const hintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const targetLayouts = useRef<Record<string, LayoutRectangle>>({});
  const containerLayout = useRef<LayoutRectangle>({ x: 0, y: 0, width: 0, height: 0 });

  useEffect(() => {
    tts.speak(tts_text).then(() => {
      setCanInteract(true);
      timerStart.current = Date.now();
      lastCorrectTime.current = Date.now();
    });

    const safetyTimer = setTimeout(() => {
      setCanInteract(true);
      if (timerStart.current === 0) {
        timerStart.current = Date.now();
        lastCorrectTime.current = Date.now();
      }
    }, 3000);

    return () => {
      clearTimeout(safetyTimer);
      if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
      tts.stop();
    };
  }, [tts_text]);

  // Start hint timer when interaction begins
  useEffect(() => {
    if (canInteract && hint_text) {
      hintTimerRef.current = setTimeout(() => {
        setShowHintButton(true);
      }, 30000);
    }
    return () => {
      if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    };
  }, [canInteract, hint_text]);

  // Reset hint timer on correct placement
  useEffect(() => {
    if (lockedItems.size > 0 && hint_text && !showHintButton) {
      lastCorrectTime.current = Date.now();
      if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
      hintTimerRef.current = setTimeout(() => {
        setShowHintButton(true);
      }, 30000);
    }
  }, [lockedItems.size, hint_text, showHintButton]);

  // Check completion when all items placed
  useEffect(() => {
    if (lockedItems.size === items.length && items.length > 0) {
      const timeSpent = (Date.now() - timerStart.current) / 1000;
      const allCorrect = placements.every((p) => {
        const target = targets.find((t) => t.id === p.targetId);
        return target?.accepts === p.itemId;
      });

      setTimeout(() => {
        onComplete({
          correct: allCorrect,
          hint_used: hintUsed,
          time_spent_seconds: Math.round(timeSpent * 10) / 10,
        });
      }, 800);
    }
  }, [lockedItems, items.length, placements, targets, hintUsed, onComplete]);

  const handleHint = useCallback(() => {
    if (!hint_text) return;
    setHintUsed(true);
    tts.speak(hint_text);
  }, [hint_text]);

  const findTargetAtPosition = useCallback(
    (pageX: number, pageY: number): DragDropTarget | null => {
      for (const target of targets) {
        const layout = targetLayouts.current[target.id];
        if (!layout) continue;

        const absX = containerLayout.current.x + layout.x;
        const absY = containerLayout.current.y + layout.y;

        if (
          pageX >= absX &&
          pageX <= absX + layout.width &&
          pageY >= absY &&
          pageY <= absY + layout.height
        ) {
          return target;
        }
      }
      return null;
    },
    [targets],
  );

  return (
    <View
      style={styles.container}
      onLayout={(e) => {
        containerLayout.current = e.nativeEvent.layout;
      }}
    >
      <Text style={[styles.instruction, { fontSize: theme.fontSize.instruction }]}>{instruction}</Text>

      <View style={styles.columns}>
        {/* Items column */}
        <View style={styles.column}>
          <Text style={styles.columnHeader}>ELEMENTOS</Text>
          {items.map((item) =>
            lockedItems.has(item.id) ? (
              <View key={item.id} style={[styles.itemSlot, styles.itemPlaced]}>
                <Text style={styles.itemPlacedText}>{item.label}</Text>
              </View>
            ) : (
              <DraggableItem
                key={item.id}
                item={item}
                canInteract={canInteract}
                findTarget={findTargetAtPosition}
                onDrop={(targetFound) => {
                  if (!targetFound) return;

                  const isCorrect = targetFound.accepts === item.id;

                  if (isCorrect) {
                    setPlacements((prev) => [
                      ...prev.filter((p) => p.targetId !== targetFound.id),
                      { itemId: item.id, targetId: targetFound.id },
                    ]);
                    setLockedItems((prev) => new Set([...prev, item.id]));
                    setFlashTargetId(targetFound.id);
                    setTimeout(() => setFlashTargetId(null), 600);
                  }
                  // Wrong drop: item just snaps back (handled by DraggableItem spring).
                  // No color change on the target, no negative feedback.
                }}
              />
            ),
          )}
        </View>

        {/* Targets column */}
        <View style={styles.column}>
          <Text style={styles.columnHeader}>DESTINOS</Text>
          {targets.map((target) => {
            const placed = placements.find((p) => p.targetId === target.id);
            const placedItem = placed
              ? items.find((i) => i.id === placed.itemId)
              : null;
            const isFlashingGreen = flashTargetId === target.id;

            return (
              <View
                key={target.id}
                style={[
                  styles.target,
                  isFlashingGreen && styles.targetFilled,
                  placedItem && styles.targetFilled,
                ]}
                onLayout={(e) => {
                  targetLayouts.current[target.id] = e.nativeEvent.layout;
                }}
              >
                <Text style={styles.targetLabel}>{target.label}</Text>
                {placedItem && (
                  <Text style={styles.placedLabel}>{placedItem.label}</Text>
                )}
              </View>
            );
          })}
        </View>
      </View>

      {showHintButton && lockedItems.size < items.length && (
        <TouchableOpacity style={styles.hintButton} onPress={handleHint}>
          <Text style={styles.hintText}>
            {hintUsed ? 'Escuchar pista otra vez' : 'Pista'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ── Draggable Item Sub-component ──────────────────

interface DraggableItemProps {
  item: DragDropItem;
  canInteract: boolean;
  findTarget: (x: number, y: number) => DragDropTarget | null;
  onDrop: (target: DragDropTarget | null) => void;
}

function DraggableItem({ item, canInteract, findTarget, onDrop }: DraggableItemProps) {
  const pan = useRef(new Animated.ValueXY()).current;
  const scale = useRef(new Animated.Value(1)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => canInteract,
      onMoveShouldSetPanResponder: () => canInteract,
      onPanResponderGrant: () => {
        Animated.spring(scale, {
          toValue: 1.08,
          useNativeDriver: true,
        }).start();
      },
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: (_evt, gestureState) => {
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
        }).start();

        const target = findTarget(
          gestureState.moveX,
          gestureState.moveY,
        );

        if (target) {
          onDrop(target);
        }

        // Snap back
        Animated.spring(pan, {
          toValue: { x: 0, y: 0 },
          useNativeDriver: true,
        }).start();
      },
    }),
  ).current;

  return (
    <Animated.View
      style={[
        styles.draggableItem,
        {
          transform: [
            { translateX: pan.x },
            { translateY: pan.y },
            { scale },
          ],
        },
      ]}
      {...panResponder.panHandlers}
    >
      <Text style={styles.itemLabel}>{item.label}</Text>
    </Animated.View>
  );
}

// ── Styles ────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#F5F7FA',
  },
  instruction: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A2E',
    textAlign: 'center',
    marginBottom: 40,
    maxWidth: 700,
  },
  columns: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 48,
    width: '100%',
    maxWidth: 800,
  },
  column: {
    flex: 1,
    gap: 12,
  },
  columnHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999',
    letterSpacing: 1,
    marginBottom: 8,
  },
  draggableItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    zIndex: 10,
  },
  itemLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A2E',
  },
  itemSlot: {
    borderRadius: 14,
    padding: 18,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#DDD',
  },
  itemPlaced: {
    backgroundColor: '#F0FFF0',
    borderColor: '#34C759',
    borderStyle: 'solid',
  },
  itemPlacedText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#34C759',
  },
  target: {
    backgroundColor: '#FAFAFA',
    borderRadius: 14,
    padding: 18,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    minHeight: 60,
    justifyContent: 'center',
  },
  targetFilled: {
    borderColor: '#34C759',
    borderStyle: 'solid',
    backgroundColor: '#F0FFF0',
  },
  targetLabel: {
    fontSize: 16,
    color: '#888',
    fontWeight: '500',
  },
  placedLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#34C759',
    marginTop: 4,
  },
  hintButton: {
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 32,
    backgroundColor: '#F0EDFF',
    borderRadius: 12,
  },
  hintText: {
    fontSize: 18,
    color: '#6C63FF',
    fontWeight: '600',
  },
});
