import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { tts } from '../../services/tts.service';
import { getAgeGroup, AGE_THEME } from '../../utils/age-theme';

export interface BuildPart {
  id: string;
  label: string;
  slot: string; // which slot this part belongs to
}

export interface BuildSlot {
  id: string;
  label: string;
}

export interface BuildObjectProps {
  instruction: string;
  tts_text: string;
  target_label: string;
  parts: BuildPart[];
  slots: BuildSlot[];
  hint_text?: string;
  studentAge?: number;
  onComplete: (result: {
    correct: boolean;
    hint_used: boolean;
    time_spent_seconds: number;
  }) => void;
}

export function BuildObject({
  instruction,
  tts_text,
  target_label,
  parts,
  slots,
  hint_text,
  studentAge = 8,
  onComplete,
}: BuildObjectProps) {
  const theme = AGE_THEME[getAgeGroup(studentAge)];
  const [canInteract, setCanInteract] = useState(false);
  const [selectedPartId, setSelectedPartId] = useState<string | null>(null);
  const [filledSlots, setFilledSlots] = useState<Record<string, string>>({}); // slotId → partId
  const [lockedSlots, setLockedSlots] = useState<Set<string>>(new Set());
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [hintUsed, setHintUsed] = useState(false);
  const [showHintButton, setShowHintButton] = useState(false);
  const [waitingForEncouragement, setWaitingForEncouragement] = useState(false);
  const timerStart = useRef<number>(0);

  const bounceAnims = useRef<Record<string, Animated.Value>>({});
  for (const slot of slots) {
    if (!bounceAnims.current[slot.id]) {
      bounceAnims.current[slot.id] = new Animated.Value(1);
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

  // Check completion
  useEffect(() => {
    if (lockedSlots.size === slots.length && slots.length > 0) {
      const timeSpent = (Date.now() - timerStart.current) / 1000;
      setTimeout(() => {
        onComplete({
          correct: wrongAttempts === 0,
          hint_used: hintUsed,
          time_spent_seconds: Math.round(timeSpent * 10) / 10,
        });
      }, 1200);
    }
  }, [lockedSlots.size, slots.length, wrongAttempts, hintUsed, onComplete]);

  const handlePartTap = useCallback(
    (partId: string) => {
      if (!canInteract || waitingForEncouragement) return;
      // Don't select already-placed parts
      const isPlaced = Object.values(filledSlots).includes(partId) &&
        [...lockedSlots].some((slotId) => filledSlots[slotId] === partId);
      if (isPlaced) return;

      setSelectedPartId((prev) => (prev === partId ? null : partId));
    },
    [canInteract, waitingForEncouragement, filledSlots, lockedSlots],
  );

  const handleSlotTap = useCallback(
    (slotId: string) => {
      if (!canInteract || waitingForEncouragement || !selectedPartId) return;
      if (lockedSlots.has(slotId)) return;

      // Check if the part belongs to this slot
      const part = parts.find((p) => p.id === selectedPartId);
      if (!part) return;

      if (part.slot === slotId) {
        // Correct placement
        setFilledSlots((prev) => ({ ...prev, [slotId]: selectedPartId }));
        setLockedSlots((prev) => new Set([...prev, slotId]));
        setSelectedPartId(null);

        // Green flash via bounce
        const anim = bounceAnims.current[slotId];
        if (anim) {
          Animated.sequence([
            Animated.timing(anim, { toValue: 1.06, duration: 150, useNativeDriver: true }),
            Animated.spring(anim, { toValue: 1, friction: 4, useNativeDriver: true }),
          ]).start();
        }
      } else {
        // Wrong placement — neutral bounce, no red
        setWrongAttempts((prev) => prev + 1);
        const anim = bounceAnims.current[slotId];
        if (anim) {
          Animated.sequence([
            Animated.timing(anim, { toValue: 0.92, duration: 100, useNativeDriver: true }),
            Animated.spring(anim, { toValue: 1, friction: 4, useNativeDriver: true }),
          ]).start();
        }
        setSelectedPartId(null);

        setWaitingForEncouragement(true);
        tts.speak('Inténtalo de nuevo').then(() => setWaitingForEncouragement(false));
        setTimeout(() => setWaitingForEncouragement(false), 2000);
      }
    },
    [canInteract, waitingForEncouragement, selectedPartId, lockedSlots, parts],
  );

  const handleHint = useCallback(() => {
    if (!hint_text) return;
    setHintUsed(true);
    tts.speak(hint_text);
  }, [hint_text]);

  const usedPartIds = new Set(
    [...lockedSlots].map((slotId) => filledSlots[slotId]).filter(Boolean),
  );

  return (
    <View style={styles.container}>
      <Text style={[styles.instruction, { fontSize: theme.fontSize.instruction }]}>
        {instruction}
      </Text>

      <Text style={[styles.targetLabel, { fontSize: theme.fontSize.body }]}>
        {target_label}
      </Text>

      {/* Slots — the structure to build */}
      <View style={styles.slotsContainer}>
        {slots.map((slot) => {
          const isLocked = lockedSlots.has(slot.id);
          const placedPartId = filledSlots[slot.id];
          const placedPart = placedPartId ? parts.find((p) => p.id === placedPartId) : null;
          const bounceAnim = bounceAnims.current[slot.id];

          return (
            <Animated.View
              key={slot.id}
              style={bounceAnim ? { transform: [{ scale: bounceAnim }] } : undefined}
            >
              <TouchableOpacity
                style={[
                  styles.slot,
                  isLocked && styles.slotFilled,
                  !isLocked && selectedPartId && styles.slotReady,
                ]}
                onPress={() => handleSlotTap(slot.id)}
                disabled={!canInteract || isLocked || !selectedPartId || waitingForEncouragement}
                activeOpacity={0.7}
              >
                <Text style={[styles.slotLabel, { fontSize: theme.fontSize.body - 2 }]}>
                  {slot.label}
                </Text>
                {isLocked && placedPart && (
                  <Text style={[styles.placedPartLabel, { fontSize: theme.fontSize.body }]}>
                    {placedPart.label}
                  </Text>
                )}
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </View>

      {/* Available parts */}
      <View style={styles.partsContainer}>
        {parts.map((part) => {
          const isUsed = usedPartIds.has(part.id);
          const isSelected = selectedPartId === part.id;

          return (
            <TouchableOpacity
              key={part.id}
              style={[
                styles.part,
                isSelected && styles.partSelected,
                isUsed && styles.partUsed,
              ]}
              onPress={() => handlePartTap(part.id)}
              disabled={!canInteract || isUsed || waitingForEncouragement}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.partLabel,
                  { fontSize: theme.fontSize.body },
                  isUsed && styles.partLabelUsed,
                ]}
              >
                {part.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {showHintButton && lockedSlots.size < slots.length && (
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
    marginBottom: 16,
    maxWidth: 700,
    lineHeight: 34,
  },
  targetLabel: {
    color: '#666',
    textAlign: 'center',
    marginBottom: 28,
  },
  slotsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 36,
    maxWidth: 700,
  },
  slot: {
    backgroundColor: '#FAFAFA',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    minWidth: 140,
    minHeight: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  slotFilled: {
    borderColor: '#34C759',
    borderStyle: 'solid',
    backgroundColor: '#F0FFF0',
  },
  slotReady: {
    borderColor: '#6C63FF',
    borderStyle: 'solid',
    backgroundColor: '#F5F3FF',
  },
  slotLabel: {
    color: '#888',
    fontWeight: '500',
  },
  placedPartLabel: {
    color: '#34C759',
    fontWeight: '600',
    marginTop: 4,
  },
  partsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    maxWidth: 700,
  },
  part: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  partSelected: {
    borderColor: '#6C63FF',
    backgroundColor: '#F5F3FF',
  },
  partUsed: {
    backgroundColor: '#F0F0F0',
    opacity: 0.5,
  },
  partLabel: {
    fontWeight: '600',
    color: '#1A1A2E',
  },
  partLabelUsed: {
    color: '#999',
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
