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

export interface MultipleChoiceOption {
  id: string;
  label: string;
  correct: boolean;
}

export interface MultipleChoiceProps {
  question: string;
  tts_text: string;
  options: MultipleChoiceOption[];
  hint_text?: string;
  studentAge?: number;
  onComplete: (result: {
    correct: boolean;
    hint_used: boolean;
    time_spent_seconds: number;
  }) => void;
}

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function MultipleChoice({
  question,
  tts_text,
  options,
  hint_text,
  studentAge = 8,
  onComplete,
}: MultipleChoiceProps) {
  const theme = AGE_THEME[getAgeGroup(studentAge)];
  const [shuffledOptions] = useState(() => shuffleArray(options));
  const [canInteract, setCanInteract] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [hintUsed, setHintUsed] = useState(false);
  const [answeredCorrectly, setAnsweredCorrectly] = useState(false);
  const [showHintButton, setShowHintButton] = useState(false);
  const timerStart = useRef<number>(0);
  const [waitingForEncouragement, setWaitingForEncouragement] = useState(false);
  const bounceAnims = useRef<Record<string, Animated.Value>>({});

  // Initialize bounce animations per option
  for (const opt of shuffledOptions) {
    if (!bounceAnims.current[opt.id]) {
      bounceAnims.current[opt.id] = new Animated.Value(1);
    }
  }

  useEffect(() => {
    tts.speak(tts_text).then(() => {
      setCanInteract(true);
      timerStart.current = Date.now();
    });

    // Safety timeout
    const safetyTimer = setTimeout(() => {
      setCanInteract(true);
      if (timerStart.current === 0) timerStart.current = Date.now();
    }, 3000);

    return () => {
      clearTimeout(safetyTimer);
      tts.stop();
    };
  }, [tts_text]);

  useEffect(() => {
    if (wrongAttempts >= 2 && hint_text) {
      setShowHintButton(true);
    }
  }, [wrongAttempts, hint_text]);

  const bounceOption = useCallback((optionId: string) => {
    const anim = bounceAnims.current[optionId];
    if (!anim) return;
    Animated.sequence([
      Animated.timing(anim, { toValue: 0.92, duration: 100, useNativeDriver: true }),
      Animated.spring(anim, { toValue: 1, friction: 4, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleSelect = useCallback(
    (option: MultipleChoiceOption) => {
      if (!canInteract || answeredCorrectly || waitingForEncouragement) return;

      setSelectedId(option.id);

      if (option.correct) {
        setAnsweredCorrectly(true);
        const timeSpent = (Date.now() - timerStart.current) / 1000;

        // Auto-continue after 1.5 seconds
        setTimeout(() => {
          onComplete({
            correct: wrongAttempts === 0,
            hint_used: hintUsed,
            time_spent_seconds: Math.round(timeSpent * 10) / 10,
          });
        }, 1500);
      } else {
        setWrongAttempts((prev) => prev + 1);
        bounceOption(option.id);

        // Disable interaction, speak encouragement, then re-enable
        setWaitingForEncouragement(true);
        setTimeout(() => {
          setSelectedId(null);
          tts.speak('Inténtalo de nuevo').then(() => {
            setWaitingForEncouragement(false);
          });
          // Safety: re-enable after 2s even if TTS fails
          setTimeout(() => setWaitingForEncouragement(false), 2000);
        }, 400);
      }
    },
    [canInteract, answeredCorrectly, waitingForEncouragement, wrongAttempts, hintUsed, onComplete, bounceOption],
  );

  const handleHint = useCallback(() => {
    if (!hint_text) return;
    setHintUsed(true);
    tts.speak(hint_text);
  }, [hint_text]);

  const getOptionStyle = (option: MultipleChoiceOption) => {
    if (selectedId !== option.id) return styles.option;

    if (option.correct) {
      return [styles.option, styles.optionCorrect];
    }
    return [styles.option, styles.optionNeutral];
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.question, { fontSize: theme.fontSize.instruction }]}>{question}</Text>

      <View style={styles.optionsGrid}>
        {shuffledOptions.map((option) => {
          const bounceAnim = bounceAnims.current[option.id];
          return (
            <Animated.View
              key={option.id}
              style={[
                styles.optionWrap,
                bounceAnim ? { transform: [{ scale: bounceAnim }] } : undefined,
              ]}
            >
              <TouchableOpacity
                style={getOptionStyle(option)}
                onPress={() => handleSelect(option)}
                disabled={!canInteract || answeredCorrectly || waitingForEncouragement}
                activeOpacity={0.7}
              >
                <Text style={[styles.optionLabel, { fontSize: theme.fontSize.body }]}>{option.label}</Text>
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </View>

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
  question: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A2E',
    textAlign: 'center',
    marginBottom: 40,
    maxWidth: 700,
    lineHeight: 40,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
    maxWidth: 700,
  },
  optionWrap: {
    width: '46%',
    minWidth: 280,
  },
  option: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    borderWidth: 3,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    alignItems: 'center',
  },
  optionCorrect: {
    borderColor: '#34C759',
    backgroundColor: '#E8FAE8',
  },
  optionNeutral: {
    borderColor: '#D0D0D0',
    backgroundColor: '#F5F5F5',
  },
  optionLabel: {
    fontSize: 20,
    color: '#1A1A2E',
    textAlign: 'center',
    fontWeight: '500',
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
