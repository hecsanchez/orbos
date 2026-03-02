import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { tts } from '../../services/tts.service';
import { sessionEngine } from '../../services/session.engine';
import { useSession } from '../../context/session.context';
import { InteractionRenderer } from '../../components/InteractionRenderer';
import type { InteractionBlock, AttemptResult } from '@orbos/types';

const BREAK_DURATION_SECONDS = 5 * 60; // 5 minutes

export default function LessonScreen() {
  const router = useRouter();
  const session = useSession();
  const student = session.student;
  const currentItem = session.currentItem;

  // Redirect if no active session
  useEffect(() => {
    if (session.status === 'idle' || !student) {
      router.replace('/');
    }
  }, [session.status, student, router]);

  // Navigate to complete screen when session ends
  useEffect(() => {
    if (session.status === 'complete') {
      router.replace('/(session)/complete');
    }
  }, [session.status, router]);

  if (!student || !currentItem) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6C63FF" />
      </View>
    );
  }

  if (currentItem.type === 'break') {
    return <BreakScreen onComplete={() => sessionEngine.advance()} />;
  }

  if (currentItem.type === 'phenomenon_evidence') {
    router.push('/(session)/evidence');
    return null;
  }

  // lesson or practice
  return (
    <LessonItem
      key={`item-${session.currentItemIndex}`}
      studentId={student.id}
      standardId={currentItem.standard_id}
      lessonScriptId={currentItem.lesson_script_id}
    />
  );
}

// ── Lesson/Practice Item ──────────────────────────

function LessonItem({
  studentId,
  standardId,
  lessonScriptId,
}: {
  studentId: string;
  standardId: string;
  lessonScriptId?: string;
}) {
  const [script, setScript] = useState<InteractionBlock[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!lessonScriptId) {
      setError('Este bloque no tiene un guion asignado');
      return;
    }
    sessionEngine
      .getCurrentScript()
      .then((res) => {
        const blocks = res.script as InteractionBlock[];
        if (!blocks || blocks.length === 0) {
          setError('El guion de la lección está vacío');
        } else {
          setScript(blocks);
        }
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Error cargando el guion');
      });
  }, [lessonScriptId]);

  const handleComplete = useCallback(
    async (attempts: AttemptResult[]) => {
      await sessionEngine.completeCurrentItem(attempts);
      sessionEngine.advance();
    },
    [],
  );

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorEmoji}>😕</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.skipButton}
          onPress={() => sessionEngine.advance()}
        >
          <Text style={styles.skipText}>Continuar →</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!script) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6C63FF" />
        <Text style={styles.loadingText}>Cargando lección...</Text>
      </View>
    );
  }

  return (
    <InteractionRenderer
      script={script}
      studentId={studentId}
      standardId={standardId}
      onComplete={handleComplete}
    />
  );
}

// ── Break Screen ──────────────────────────────────

function BreakScreen({ onComplete }: { onComplete: () => void }) {
  const [secondsLeft, setSecondsLeft] = useState(BREAK_DURATION_SECONDS);

  useEffect(() => {
    tts.speak('Toma un descanso. Relaja tu mente y cuerpo por unos minutos.');
    return () => tts.stop();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const canContinue = secondsLeft === 0;

  return (
    <View style={styles.breakContainer}>
      <Text style={styles.breakEmoji}>😴</Text>
      <Text style={styles.breakTitle}>Toma un descanso</Text>
      <Text style={styles.breakSubtitle}>
        Relaja tu mente y cuerpo por unos minutos.
      </Text>
      <View style={styles.timerCircle}>
        <Text style={styles.timerText}>
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </Text>
        <Text style={styles.timerLabel}>minutos</Text>
      </View>
      <TouchableOpacity
        style={[styles.continueButton, !canContinue && styles.continueButtonDisabled]}
        onPress={canContinue ? onComplete : undefined}
        disabled={!canContinue}
      >
        <Text style={styles.continueButtonText}>
          {canContinue ? 'Continuar →' : 'Respira profundo...'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Styles ────────────────────────────────────────

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
    padding: 40,
  },
  loadingText: {
    fontSize: 20,
    color: '#666',
    marginTop: 16,
  },
  errorEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 22,
    color: '#333',
    textAlign: 'center',
    maxWidth: 500,
    lineHeight: 32,
  },
  skipButton: {
    marginTop: 24,
    paddingVertical: 14,
    paddingHorizontal: 36,
    backgroundColor: '#6C63FF',
    borderRadius: 14,
  },
  skipText: {
    fontSize: 18,
    color: '#FFF',
    fontWeight: '600',
  },
  // ── Break styles
  breakContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
    padding: 40,
  },
  breakEmoji: {
    fontSize: 80,
    marginBottom: 24,
  },
  breakTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: 12,
  },
  breakSubtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 40,
    textAlign: 'center',
  },
  timerCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 4,
    borderColor: '#6C63FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  timerText: {
    fontSize: 36,
    fontWeight: '700',
    color: '#1A1A2E',
  },
  timerLabel: {
    fontSize: 14,
    color: '#999',
    marginTop: 2,
  },
  continueButton: {
    backgroundColor: '#1A1A2E',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 48,
    minWidth: 280,
    alignItems: 'center',
  },
  continueButtonDisabled: {
    backgroundColor: '#CCC',
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
  },
});
