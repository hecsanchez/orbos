import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { tts } from '../../services/tts.service';
import { AGE_THEME, type AgeGroup } from '../../utils/age-theme';

export interface MatchConnectLeftItem {
  id: string;
  label: string;
}

export interface MatchConnectRightItem {
  id: string;
  label: string;
  matches: string; // left item id
}

export interface MatchConnectProps {
  instruction: string;
  tts_text: string;
  left_items: MatchConnectLeftItem[];
  right_items: MatchConnectRightItem[];
  hint_text?: string;
  ageGroup?: AgeGroup;
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

interface MatchPair {
  leftId: string;
  rightId: string;
}

export function MatchConnect({
  instruction,
  tts_text,
  left_items: rawLeft,
  right_items: rawRight,
  hint_text,
  ageGroup = 'middle',
  onComplete,
}: MatchConnectProps) {
  const theme = AGE_THEME[ageGroup ?? 'middle'];
  // Max 4 pairs
  const leftItems = rawLeft.slice(0, 4);
  const rightItemsAll = rawRight.slice(0, 4);
  const [shuffledRight] = useState(() => shuffleArray(rightItemsAll));

  const [canInteract, setCanInteract] = useState(false);
  const [selectedLeftId, setSelectedLeftId] = useState<string | null>(null);
  const [matches, setMatches] = useState<MatchPair[]>([]);
  const [lockedLeftIds, setLockedLeftIds] = useState<Set<string>>(new Set());
  const [lockedRightIds, setLockedRightIds] = useState<Set<string>>(new Set());
  const [hintUsed, setHintUsed] = useState(false);
  const [showHintButton, setShowHintButton] = useState(false);
  const [wrongAttemptsPerLeft, setWrongAttemptsPerLeft] = useState<Record<string, number>>({});
  const [hadAnyWrong, setHadAnyWrong] = useState(false);
  const [fadingLine, setFadingLine] = useState<{ leftId: string; rightId: string } | null>(null);
  const timerStart = useRef<number>(0);
  const fadeLineAnim = useRef(new Animated.Value(1)).current;

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

  // Check completion
  useEffect(() => {
    if (matches.length === leftItems.length && leftItems.length > 0) {
      const timeSpent = (Date.now() - timerStart.current) / 1000;
      setTimeout(() => {
        onComplete({
          correct: !hadAnyWrong,
          hint_used: hintUsed,
          time_spent_seconds: Math.round(timeSpent * 10) / 10,
        });
      }, 800);
    }
  }, [matches.length, leftItems.length, hadAnyWrong, hintUsed, onComplete]);

  // Show hint after 2 wrong attempts on same left card
  useEffect(() => {
    if (hint_text && Object.values(wrongAttemptsPerLeft).some((c) => c >= 2)) {
      setShowHintButton(true);
    }
  }, [wrongAttemptsPerLeft, hint_text]);

  const handleLeftTap = useCallback(
    (leftId: string) => {
      if (!canInteract || lockedLeftIds.has(leftId)) return;
      setSelectedLeftId((prev) => (prev === leftId ? null : leftId));
    },
    [canInteract, lockedLeftIds],
  );

  const handleRightTap = useCallback(
    (rightItem: MatchConnectRightItem) => {
      if (!canInteract || !selectedLeftId || lockedRightIds.has(rightItem.id)) return;

      const isCorrect = rightItem.matches === selectedLeftId;

      if (isCorrect) {
        setMatches((prev) => [...prev, { leftId: selectedLeftId, rightId: rightItem.id }]);
        setLockedLeftIds((prev) => new Set([...prev, selectedLeftId]));
        setLockedRightIds((prev) => new Set([...prev, rightItem.id]));
        setSelectedLeftId(null);
      } else {
        // Wrong: fade out line gently, no negative feedback
        setHadAnyWrong(true);
        setFadingLine({ leftId: selectedLeftId, rightId: rightItem.id });
        fadeLineAnim.setValue(1);
        Animated.timing(fadeLineAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }).start(() => {
          setFadingLine(null);
        });

        setWrongAttemptsPerLeft((prev) => ({
          ...prev,
          [selectedLeftId]: (prev[selectedLeftId] ?? 0) + 1,
        }));
        setSelectedLeftId(null);
      }
    },
    [canInteract, selectedLeftId, lockedRightIds, fadeLineAnim],
  );

  const handleHint = useCallback(() => {
    if (!hint_text) return;
    setHintUsed(true);
    tts.speak(hint_text);
  }, [hint_text]);

  const isLeftLocked = (id: string) => lockedLeftIds.has(id);
  const isRightLocked = (id: string) => lockedRightIds.has(id);

  return (
    <View style={styles.container}>
      <Text style={[styles.instruction, { fontSize: theme.fontSize.instruction }]}>
        {instruction}
      </Text>

      <View style={styles.columns}>
        {/* Left column */}
        <View style={styles.column}>
          {leftItems.map((item) => {
            const locked = isLeftLocked(item.id);
            const selected = selectedLeftId === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.card,
                  selected && styles.cardSelected,
                  locked && styles.cardLocked,
                ]}
                onPress={() => handleLeftTap(item.id)}
                disabled={!canInteract || locked}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.cardLabel,
                    { fontSize: theme.fontSize.body },
                    locked && styles.cardLabelLocked,
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Connection indicators */}
        <View style={styles.connectionColumn}>
          {matches.map((m) => (
            <View key={`${m.leftId}-${m.rightId}`} style={styles.connectedLine} />
          ))}
          {fadingLine && (
            <Animated.View style={[styles.fadingLine, { opacity: fadeLineAnim }]} />
          )}
        </View>

        {/* Right column */}
        <View style={styles.column}>
          {shuffledRight.map((item) => {
            const locked = isRightLocked(item.id);
            return (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.card,
                  locked && styles.cardLocked,
                  selectedLeftId && !locked ? styles.cardAvailable : undefined,
                ]}
                onPress={() => handleRightTap(item)}
                disabled={!canInteract || locked || !selectedLeftId}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.cardLabel,
                    { fontSize: theme.fontSize.body },
                    locked && styles.cardLabelLocked,
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {showHintButton && matches.length < leftItems.length && (
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
    marginBottom: 40,
    maxWidth: 700,
    lineHeight: 34,
  },
  columns: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    width: '100%',
    maxWidth: 800,
    alignItems: 'flex-start',
  },
  column: {
    flex: 1,
    gap: 12,
  },
  connectionColumn: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingTop: 20,
  },
  connectedLine: {
    width: 4,
    height: 20,
    borderRadius: 2,
    backgroundColor: '#34C759',
  },
  fadingLine: {
    width: 4,
    height: 20,
    borderRadius: 2,
    backgroundColor: '#CCC',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 3,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    alignItems: 'center',
  },
  cardSelected: {
    borderColor: '#6C63FF',
    backgroundColor: '#F5F3FF',
  },
  cardAvailable: {
    borderColor: '#E0E0FF',
  },
  cardLocked: {
    borderColor: '#34C759',
    backgroundColor: '#E8FAE8',
    opacity: 0.7,
  },
  cardLabel: {
    fontWeight: '500',
    color: '#1A1A2E',
    textAlign: 'center',
  },
  cardLabelLocked: {
    color: '#34C759',
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
