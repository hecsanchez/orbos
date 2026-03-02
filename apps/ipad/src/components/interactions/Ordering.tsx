import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  PanResponder,
} from 'react-native';
import { tts } from '../../services/tts.service';
import { AGE_THEME, type AgeGroup } from '../../utils/age-theme';

export interface OrderingItem {
  id: string;
  label: string;
  correct_position: number;
}

export interface OrderingProps {
  instruction: string;
  tts_text: string;
  items: OrderingItem[];
  hint_text?: string;
  ageGroup?: AgeGroup;
  onComplete: (result: {
    correct: boolean;
    hint_used: boolean;
    time_spent_seconds: number;
  }) => void;
}

function shuffleUntilDifferent<T extends { correct_position: number }>(items: T[]): T[] {
  const copy = [...items];
  // Keep shuffling until order differs from correct
  for (let attempt = 0; attempt < 20; attempt++) {
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    const isCorrectOrder = copy.every((item, idx) => item.correct_position === idx + 1);
    if (!isCorrectOrder) return copy;
  }
  // Fallback: just swap first two
  if (copy.length >= 2) [copy[0], copy[1]] = [copy[1], copy[0]];
  return copy;
}

export function Ordering({
  instruction,
  tts_text,
  items: rawItems,
  hint_text,
  ageGroup = 'middle',
  onComplete,
}: OrderingProps) {
  const theme = AGE_THEME[ageGroup ?? 'middle'];
  // Max 5 items
  const capped = rawItems.slice(0, 5);
  const [orderedItems, setOrderedItems] = useState(() => shuffleUntilDifferent(capped));
  const [canInteract, setCanInteract] = useState(false);
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [hintUsed, setHintUsed] = useState(false);
  const [showHintButton, setShowHintButton] = useState(false);
  const [answeredCorrectly, setAnsweredCorrectly] = useState(false);
  const [incorrectIds, setIncorrectIds] = useState<Set<string>>(new Set());
  const [waitingForEncouragement, setWaitingForEncouragement] = useState(false);
  const timerStart = useRef<number>(0);

  // Drag state: track which item is being moved by tap-to-sequence
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const bounceAnims = useRef<Record<string, Animated.Value>>({});
  for (const item of capped) {
    if (!bounceAnims.current[item.id]) {
      bounceAnims.current[item.id] = new Animated.Value(1);
    }
  }

  useEffect(() => {
    tts.speak(tts_text).then(() => {
      setCanInteract(true);
      timerStart.current = Date.now();
    });
    const safety = setTimeout(() => {
      setCanInteract(true);
      if (timerStart.current === 0) timerStart.current = Date.now();
    }, 3000);
    return () => {
      clearTimeout(safety);
      tts.stop();
    };
  }, [tts_text]);

  useEffect(() => {
    if (wrongAttempts >= 2 && hint_text) {
      setShowHintButton(true);
    }
  }, [wrongAttempts, hint_text]);

  const handleItemTap = useCallback(
    (index: number) => {
      if (!canInteract || answeredCorrectly || waitingForEncouragement) return;

      if (selectedIndex === null) {
        // First tap: select
        setSelectedIndex(index);
      } else if (selectedIndex === index) {
        // Tap same item: deselect
        setSelectedIndex(null);
      } else {
        // Second tap: swap the two items
        setOrderedItems((prev) => {
          const next = [...prev];
          [next[selectedIndex], next[index]] = [next[index], next[selectedIndex]];
          return next;
        });
        setSelectedIndex(null);
        setIncorrectIds(new Set());
      }
    },
    [canInteract, answeredCorrectly, waitingForEncouragement, selectedIndex],
  );

  const handleCheck = useCallback(() => {
    if (!canInteract || answeredCorrectly || waitingForEncouragement) return;

    const allCorrect = orderedItems.every(
      (item, idx) => item.correct_position === idx + 1,
    );

    if (allCorrect) {
      setAnsweredCorrectly(true);
      setIncorrectIds(new Set());
      const timeSpent = (Date.now() - timerStart.current) / 1000;
      setTimeout(() => {
        onComplete({
          correct: wrongAttempts === 0,
          hint_used: hintUsed,
          time_spent_seconds: Math.round(timeSpent * 10) / 10,
        });
      }, 1500);
    } else {
      // Mark incorrect items with neutral highlight
      const wrong = new Set<string>();
      orderedItems.forEach((item, idx) => {
        if (item.correct_position !== idx + 1) {
          wrong.add(item.id);
          // Gentle bounce
          const anim = bounceAnims.current[item.id];
          if (anim) {
            Animated.sequence([
              Animated.timing(anim, { toValue: 0.92, duration: 100, useNativeDriver: true }),
              Animated.spring(anim, { toValue: 1, friction: 4, useNativeDriver: true }),
            ]).start();
          }
        }
      });
      setIncorrectIds(wrong);
      setWrongAttempts((prev) => prev + 1);

      // Encouraging TTS
      setWaitingForEncouragement(true);
      tts.speak('Inténtalo de nuevo').then(() => {
        setWaitingForEncouragement(false);
        setIncorrectIds(new Set());
      });
      setTimeout(() => {
        setWaitingForEncouragement(false);
        setIncorrectIds(new Set());
      }, 2000);
    }
  }, [canInteract, answeredCorrectly, waitingForEncouragement, orderedItems, wrongAttempts, hintUsed, onComplete]);

  const handleHint = useCallback(() => {
    if (!hint_text) return;
    setHintUsed(true);
    tts.speak(hint_text);
  }, [hint_text]);

  return (
    <View style={styles.container}>
      <Text style={[styles.instruction, { fontSize: theme.fontSize.instruction }]}>
        {instruction}
      </Text>

      <View style={styles.list}>
        {orderedItems.map((item, index) => {
          const isSelected = selectedIndex === index;
          const isIncorrect = incorrectIds.has(item.id);
          const isCorrectDone = answeredCorrectly;
          const bounceAnim = bounceAnims.current[item.id];

          return (
            <Animated.View
              key={item.id}
              style={bounceAnim ? { transform: [{ scale: bounceAnim }] } : undefined}
            >
              <TouchableOpacity
                style={[
                  styles.item,
                  isSelected && styles.itemSelected,
                  isIncorrect && styles.itemIncorrect,
                  isCorrectDone && styles.itemCorrect,
                ]}
                onPress={() => handleItemTap(index)}
                disabled={!canInteract || answeredCorrectly || waitingForEncouragement}
                activeOpacity={0.7}
              >
                <View style={styles.positionBadge}>
                  <Text style={styles.positionText}>{index + 1}</Text>
                </View>
                <Text style={[styles.itemLabel, { fontSize: theme.fontSize.body }]}>
                  {item.label}
                </Text>
                {isSelected && <Text style={styles.swapHint}>↕</Text>}
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </View>

      {!answeredCorrectly && (
        <TouchableOpacity
          style={[styles.checkButton, (!canInteract || waitingForEncouragement) && styles.checkButtonDisabled]}
          onPress={handleCheck}
          disabled={!canInteract || answeredCorrectly || waitingForEncouragement}
        >
          <Text style={[styles.checkButtonText, { fontSize: theme.fontSize.button }]}>
            Comprobar
          </Text>
        </TouchableOpacity>
      )}

      {showHintButton && !answeredCorrectly && (
        <TouchableOpacity style={styles.hintButton} onPress={handleHint}>
          <Text style={styles.hintText}>
            {hintUsed ? 'Escuchar pista otra vez' : 'Pista'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#F5F7FA',
  },
  instruction: {
    fontWeight: '700',
    color: '#1A1A2E',
    textAlign: 'center',
    marginBottom: 32,
    maxWidth: 700,
    lineHeight: 34,
  },
  list: {
    width: '100%',
    maxWidth: 600,
    gap: 12,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 18,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  itemSelected: {
    borderColor: '#6C63FF',
    backgroundColor: '#F5F3FF',
  },
  itemIncorrect: {
    borderColor: '#D0D0D0',
    backgroundColor: '#F5F5F5',
  },
  itemCorrect: {
    borderColor: '#34C759',
    backgroundColor: '#E8FAE8',
  },
  positionBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  positionText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#666',
  },
  itemLabel: {
    fontWeight: '500',
    color: '#1A1A2E',
    flex: 1,
  },
  swapHint: {
    fontSize: 20,
    color: '#6C63FF',
    marginLeft: 8,
  },
  checkButton: {
    marginTop: 28,
    backgroundColor: '#1A1A2E',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 48,
    minWidth: 240,
    alignItems: 'center',
  },
  checkButtonDisabled: {
    backgroundColor: '#CCC',
  },
  checkButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  hintButton: {
    marginTop: 16,
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
