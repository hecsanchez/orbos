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

export interface TapRevealProps {
  prompt: string;
  tts_text_before: string;
  revealed_content: string;
  tts_text_after: string;
  ageGroup?: AgeGroup;
  onComplete: () => void;
}

export function TapReveal({
  prompt,
  tts_text_before,
  revealed_content,
  tts_text_after,
  ageGroup = 'middle',
  onComplete,
}: TapRevealProps) {
  const theme = AGE_THEME[ageGroup ?? 'middle'];
  const [canTap, setCanTap] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [canContinue, setCanContinue] = useState(false);

  const flipAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // TTS reads tts_text_before on mount
  useEffect(() => {
    tts.speak(tts_text_before).then(() => setCanTap(true));
    const safety = setTimeout(() => setCanTap(true), 3000);
    return () => {
      clearTimeout(safety);
      tts.stop();
    };
  }, [tts_text_before]);

  // Subtle pulse animation on the card while waiting for tap
  useEffect(() => {
    if (!canTap || revealed) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.03, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [canTap, revealed, pulseAnim]);

  const handleTap = () => {
    if (!canTap || revealed) return;
    setRevealed(true);

    // Fade-in reveal
    Animated.timing(flipAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();

    // Read revealed content, then show continue
    tts.speak(tts_text_after).then(() => setCanContinue(true));
    setTimeout(() => setCanContinue(true), 4000); // safety
  };

  // Fade in continue button
  useEffect(() => {
    if (canContinue) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [canContinue, fadeAnim]);

  const handleContinue = () => {
    if (!canContinue) return;
    tts.stop();
    onComplete();
  };

  return (
    <View style={styles.container}>
      {!revealed ? (
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={handleTap}
          disabled={!canTap}
        >
          <Animated.View style={[styles.card, { transform: [{ scale: pulseAnim }] }]}>
            <Text style={[styles.tapHint, { fontSize: theme.fontSize.body - 4 }]}>
              Toca para descubrir
            </Text>
            <Text style={[styles.prompt, { fontSize: theme.fontSize.instruction }]}>
              {prompt}
            </Text>
            <Text style={[styles.tapIcon, { fontSize: theme.iconSize }]}>👆</Text>
          </Animated.View>
        </TouchableOpacity>
      ) : (
        <Animated.View style={[styles.card, styles.revealedCard, { opacity: flipAnim }]}>
          <Text style={[styles.revealedContent, { fontSize: theme.fontSize.body }]}>
            {revealed_content}
          </Text>

          <Animated.View style={{ opacity: fadeAnim }}>
            <TouchableOpacity
              style={styles.button}
              onPress={handleContinue}
              disabled={!canContinue}
            >
              <Text style={[styles.buttonText, { fontSize: theme.fontSize.button }]}>
                Continuar →
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
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
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 40,
    maxWidth: 600,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    alignItems: 'center',
  },
  revealedCard: {
    backgroundColor: '#FAFFF5',
  },
  tapHint: {
    color: '#999',
    marginBottom: 12,
  },
  prompt: {
    fontWeight: '700',
    color: '#1A1A2E',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 38,
  },
  tapIcon: {
    marginTop: 8,
  },
  revealedContent: {
    color: '#333',
    textAlign: 'center',
    lineHeight: 32,
    marginBottom: 32,
  },
  button: {
    backgroundColor: '#1A1A2E',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 48,
    minWidth: 240,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
