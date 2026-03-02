import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { tts } from '../../services/tts.service';

export interface StoryCardProps {
  title: string;
  body: string;
  tts_text: string;
  continue_label?: string;
  onComplete: () => void;
}

export function StoryCard({
  title,
  body,
  tts_text,
  continue_label = 'Continuar',
  onComplete,
}: StoryCardProps) {
  const [canContinue, setCanContinue] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Safety timeout — never block the child indefinitely
    const safetyTimer = setTimeout(() => setCanContinue(true), 2000);

    tts.speak(tts_text).then(() => {
      setCanContinue(true);
    });

    return () => {
      clearTimeout(safetyTimer);
      tts.stop();
    };
  }, [tts_text]);

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
    <TouchableOpacity
      style={styles.container}
      activeOpacity={0.95}
      onPress={handleContinue}
      disabled={!canContinue}
    >
      <View style={styles.card}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.body}>{body}</Text>

        <Animated.View style={[styles.buttonWrap, { opacity: fadeAnim }]}>
          <View
            style={[
              styles.button,
              !canContinue && styles.buttonDisabled,
            ]}
          >
            <Text style={styles.buttonText}>
              {continue_label} &rarr;
            </Text>
          </View>
        </Animated.View>
      </View>
    </TouchableOpacity>
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
    maxWidth: 700,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: 20,
    textAlign: 'center',
  },
  body: {
    fontSize: 22,
    color: '#333',
    lineHeight: 34,
    textAlign: 'center',
    marginBottom: 32,
  },
  buttonWrap: {
    width: '100%',
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#1A1A2E',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 48,
    minWidth: 240,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#CCC',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
  },
});
