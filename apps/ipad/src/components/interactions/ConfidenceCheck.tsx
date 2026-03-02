import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { tts } from '../../services/tts.service';
import { AGE_THEME, type AgeGroup } from '../../utils/age-theme';

export interface ConfidenceCheckProps {
  question: string;
  tts_text: string;
  mode: 'pre' | 'post';
  ageGroup?: AgeGroup;
  onComplete: (result: { confidence: 1 | 2 | 3 }) => void;
}

const CONFIDENCE_OPTIONS: { value: 1 | 2 | 3; label: string; icon: string }[] = [
  { value: 1, label: 'No estoy seguro', icon: '🤔' },
  { value: 2, label: 'Más o menos', icon: '😊' },
  { value: 3, label: '¡Lo sé bien!', icon: '🌟' },
];

export function ConfidenceCheck({
  question,
  tts_text,
  mode,
  ageGroup = 'middle',
  onComplete,
}: ConfidenceCheckProps) {
  const theme = AGE_THEME[ageGroup ?? 'middle'];
  const [canInteract, setCanInteract] = useState(false);
  const [selectedValue, setSelectedValue] = useState<1 | 2 | 3 | null>(null);

  const scaleAnims = useRef(
    CONFIDENCE_OPTIONS.map(() => new Animated.Value(1)),
  ).current;

  useEffect(() => {
    tts.speak(tts_text).then(() => setCanInteract(true));
    const safety = setTimeout(() => setCanInteract(true), 3000);
    return () => {
      clearTimeout(safety);
      tts.stop();
    };
  }, [tts_text]);

  const handleSelect = (value: 1 | 2 | 3, index: number) => {
    if (!canInteract || selectedValue !== null) return;
    setSelectedValue(value);

    // Soft highlight animation
    Animated.spring(scaleAnims[index], {
      toValue: 1.06,
      friction: 5,
      useNativeDriver: true,
    }).start();

    // Advance after 0.8 seconds
    setTimeout(() => {
      onComplete({ confidence: value });
    }, 800);
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.question, { fontSize: theme.fontSize.instruction }]}>
        {question}
      </Text>

      <View style={styles.options}>
        {CONFIDENCE_OPTIONS.map((option, index) => {
          const isSelected = selectedValue === option.value;
          return (
            <Animated.View
              key={option.value}
              style={{ transform: [{ scale: scaleAnims[index] }] }}
            >
              <TouchableOpacity
                style={[
                  styles.card,
                  isSelected && styles.cardSelected,
                ]}
                onPress={() => handleSelect(option.value, index)}
                disabled={!canInteract || selectedValue !== null}
                activeOpacity={0.8}
              >
                <Text style={[styles.icon, { fontSize: ageGroup === 'young' ? 72 : theme.iconSize }]}>
                  {option.icon}
                </Text>
                <Text
                  style={[
                    styles.label,
                    { fontSize: ageGroup === 'young' ? theme.fontSize.body : theme.fontSize.body - 2 },
                    isSelected && styles.labelSelected,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </View>
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
  question: {
    fontWeight: '700',
    color: '#1A1A2E',
    textAlign: 'center',
    marginBottom: 48,
    maxWidth: 600,
    lineHeight: 36,
  },
  options: {
    flexDirection: 'row',
    gap: 24,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    width: 200,
    borderWidth: 3,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  cardSelected: {
    borderColor: '#6C63FF',
    backgroundColor: '#F5F3FF',
  },
  icon: {
    marginBottom: 16,
  },
  label: {
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  labelSelected: {
    color: '#6C63FF',
  },
});
