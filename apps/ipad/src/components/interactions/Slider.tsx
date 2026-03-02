import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  PanResponder,
  LayoutRectangle,
} from 'react-native';
import { tts } from '../../services/tts.service';
import { AGE_THEME, type AgeGroup } from '../../utils/age-theme';

export interface SliderProps {
  instruction: string;
  tts_text: string;
  min_value: number;
  max_value: number;
  step: number;
  correct_value: number;
  tolerance?: number; // acceptable range around correct_value, defaults to step
  min_label: string;
  max_label: string;
  unit?: string;
  hint_text?: string;
  ageGroup?: AgeGroup;
  onComplete: (result: {
    correct: boolean;
    hint_used: boolean;
    time_spent_seconds: number;
  }) => void;
}

export function Slider({
  instruction,
  tts_text,
  min_value,
  max_value,
  step,
  correct_value,
  tolerance,
  min_label,
  max_label,
  unit = '',
  hint_text,
  ageGroup = 'middle',
  onComplete,
}: SliderProps) {
  const theme = AGE_THEME[ageGroup ?? 'middle'];
  const effectiveTolerance = tolerance ?? step;

  const [canInteract, setCanInteract] = useState(false);
  const [value, setValue] = useState(min_value + Math.round((max_value - min_value) / 2 / step) * step);
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [hintUsed, setHintUsed] = useState(false);
  const [showHintButton, setShowHintButton] = useState(false);
  const [waitingForEncouragement, setWaitingForEncouragement] = useState(false);
  const timerStart = useRef<number>(0);

  const trackLayout = useRef<LayoutRectangle>({ x: 0, y: 0, width: 0, height: 0 });
  const thumbAnim = useRef(new Animated.Value(0.5)).current; // 0..1 position
  const bounceAnim = useRef(new Animated.Value(1)).current;

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

  const valueToFraction = useCallback(
    (v: number) => (v - min_value) / (max_value - min_value),
    [min_value, max_value],
  );

  const fractionToValue = useCallback(
    (f: number) => {
      const raw = min_value + f * (max_value - min_value);
      const stepped = Math.round(raw / step) * step;
      return Math.max(min_value, Math.min(max_value, stepped));
    },
    [min_value, max_value, step],
  );

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        if (!canInteract || submitted || waitingForEncouragement) return;
        const x = evt.nativeEvent.locationX;
        const fraction = Math.max(0, Math.min(1, x / trackLayout.current.width));
        thumbAnim.setValue(fraction);
        setValue(fractionToValue(fraction));
      },
      onPanResponderMove: (evt) => {
        if (!canInteract || submitted || waitingForEncouragement) return;
        const x = evt.nativeEvent.locationX;
        const fraction = Math.max(0, Math.min(1, x / trackLayout.current.width));
        thumbAnim.setValue(fraction);
        setValue(fractionToValue(fraction));
      },
    }),
  ).current;

  const handleConfirm = useCallback(() => {
    if (!canInteract || submitted || waitingForEncouragement) return;

    const correct = Math.abs(value - correct_value) <= effectiveTolerance;

    if (correct) {
      setSubmitted(true);
      setIsCorrect(true);
      const timeSpent = (Date.now() - timerStart.current) / 1000;

      Animated.sequence([
        Animated.timing(bounceAnim, { toValue: 1.08, duration: 150, useNativeDriver: true }),
        Animated.spring(bounceAnim, { toValue: 1, friction: 4, useNativeDriver: true }),
      ]).start();

      setTimeout(() => {
        onComplete({
          correct: wrongAttempts === 0,
          hint_used: hintUsed,
          time_spent_seconds: Math.round(timeSpent * 10) / 10,
        });
      }, 1500);
    } else {
      setWrongAttempts((prev) => prev + 1);

      // Gentle bounce — no red
      Animated.sequence([
        Animated.timing(bounceAnim, { toValue: 0.92, duration: 100, useNativeDriver: true }),
        Animated.spring(bounceAnim, { toValue: 1, friction: 4, useNativeDriver: true }),
      ]).start();

      setWaitingForEncouragement(true);
      tts.speak('Inténtalo de nuevo').then(() => setWaitingForEncouragement(false));
      setTimeout(() => setWaitingForEncouragement(false), 2000);
    }
  }, [canInteract, submitted, waitingForEncouragement, value, correct_value, effectiveTolerance, wrongAttempts, hintUsed, onComplete]);

  const handleHint = useCallback(() => {
    if (!hint_text) return;
    setHintUsed(true);
    tts.speak(hint_text);
  }, [hint_text]);

  const fraction = valueToFraction(value);

  return (
    <View style={styles.container}>
      <Text style={[styles.instruction, { fontSize: theme.fontSize.instruction }]}>
        {instruction}
      </Text>

      {/* Current value display */}
      <Animated.View style={{ transform: [{ scale: bounceAnim }] }}>
        <Text style={[styles.valueDisplay, { fontSize: theme.fontSize.instruction + 8 }]}>
          {value}{unit ? ` ${unit}` : ''}
        </Text>
      </Animated.View>

      {/* Slider track */}
      <View
        style={styles.trackContainer}
        onLayout={(e) => {
          trackLayout.current = e.nativeEvent.layout;
        }}
        {...panResponder.panHandlers}
      >
        <View style={styles.track}>
          <View style={[styles.trackFill, { width: `${fraction * 100}%` }]} />
        </View>

        {/* Thumb */}
        <View
          style={[
            styles.thumb,
            {
              left: `${fraction * 100}%`,
            },
            submitted && isCorrect && styles.thumbCorrect,
          ]}
        />
      </View>

      {/* Labels */}
      <View style={styles.labelRow}>
        <Text style={[styles.label, { fontSize: theme.fontSize.body - 2 }]}>{min_label}</Text>
        <Text style={[styles.label, { fontSize: theme.fontSize.body - 2 }]}>{max_label}</Text>
      </View>

      {/* Confirm button */}
      {!submitted && (
        <TouchableOpacity
          style={[
            styles.confirmButton,
            (!canInteract || waitingForEncouragement) && styles.confirmButtonDisabled,
          ]}
          onPress={handleConfirm}
          disabled={!canInteract || submitted || waitingForEncouragement}
        >
          <Text style={[styles.confirmText, { fontSize: theme.fontSize.button }]}>
            Confirmar
          </Text>
        </TouchableOpacity>
      )}

      {showHintButton && !submitted && (
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
  valueDisplay: {
    fontWeight: '800',
    color: '#1A1A2E',
    textAlign: 'center',
    marginBottom: 32,
  },
  trackContainer: {
    width: '100%',
    maxWidth: 600,
    height: 56,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  track: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  trackFill: {
    height: '100%',
    backgroundColor: '#6C63FF',
    borderRadius: 4,
  },
  thumb: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 3,
    borderColor: '#6C63FF',
    marginLeft: -18 + 20, // offset by half thumb + track padding
    top: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  thumbCorrect: {
    borderColor: '#34C759',
    backgroundColor: '#E8FAE8',
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 600,
    paddingHorizontal: 20,
    marginTop: 8,
    marginBottom: 32,
  },
  label: {
    color: '#888',
    fontWeight: '500',
  },
  confirmButton: {
    backgroundColor: '#1A1A2E',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 48,
    minWidth: 240,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    backgroundColor: '#CCC',
  },
  confirmText: {
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
