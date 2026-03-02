import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { InteractionBlock, AttemptResult } from '@orbos/types';
import { INTERACTION_COMPONENTS, type ComponentName } from './interactions';

/**
 * INTERACTION DESIGN PRINCIPLES — DO NOT OVERRIDE
 * - Wrong answers: neutral animation only, never red
 * - Always encouraging: TTS says "Inténtalo de nuevo" on wrong answer
 * - No timers shown to child
 * - No scores shown to child
 * - Child can only move forward — no back navigation
 */

export interface InteractionRendererProps {
  script: InteractionBlock[];
  studentId: string;
  standardId: string;
  onComplete: (attempts: AttemptResult[]) => void;
}

export function InteractionRenderer({
  script,
  studentId,
  standardId,
  onComplete,
}: InteractionRendererProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [attempts, setAttempts] = useState<AttemptResult[]>([]);

  const currentBlock = script[currentIndex];

  const advanceToNext = useCallback(
    (result: AttemptResult) => {
      const updatedAttempts = [...attempts, result];
      setAttempts(updatedAttempts);

      if (currentIndex + 1 >= script.length) {
        onComplete(updatedAttempts);
      } else {
        setCurrentIndex((prev) => prev + 1);
      }
    },
    [attempts, currentIndex, script.length, onComplete],
  );

  if (!currentBlock) {
    return (
      <View style={styles.error}>
        <Text style={styles.errorText}>No hay bloques en el guion</Text>
      </View>
    );
  }

  const componentName = currentBlock.component as ComponentName;
  const Component = INTERACTION_COMPONENTS[componentName];

  if (!Component) {
    return (
      <View style={styles.error}>
        <Text style={styles.errorText}>
          Componente desconocido: &quot;{currentBlock.component}&quot;
        </Text>
      </View>
    );
  }

  // Build props for the component
  const componentProps = {
    ...currentBlock.props,
    tts_text: currentBlock.tts_text,
    onComplete: (result?: {
      correct: boolean;
      hint_used: boolean;
      time_spent_seconds: number;
    }) => {
      // story_card has no result — always correct
      const attemptResult: AttemptResult = {
        component: currentBlock.component,
        correct: result?.correct ?? true,
        hint_used: result?.hint_used ?? false,
        time_spent_seconds: result?.time_spent_seconds ?? 0,
      };
      advanceToNext(attemptResult);
    },
  };

  return (
    <View style={styles.container}>
      {/* Progress indicator */}
      <View style={styles.progressBar}>
        {script.map((_, idx) => (
          <View
            key={idx}
            style={[
              styles.progressDot,
              idx < currentIndex && styles.progressDotDone,
              idx === currentIndex && styles.progressDotActive,
            ]}
          />
        ))}
      </View>

      {/* Render current interaction — key forces remount on index change */}
      <Component key={`${componentName}-${currentIndex}`} {...(componentProps as any)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  progressBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingTop: 20,
    paddingBottom: 8,
    backgroundColor: '#F5F7FA',
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#DDD',
  },
  progressDotDone: {
    backgroundColor: '#34C759',
  },
  progressDotActive: {
    backgroundColor: '#6C63FF',
  },
  error: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF3F3',
    padding: 40,
  },
  errorText: {
    fontSize: 22,
    color: '#FF3B30',
    fontWeight: '600',
    textAlign: 'center',
  },
});
