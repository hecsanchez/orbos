import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { tts } from '../../services/tts.service';
import { apiClient } from '../../services/api-client';
import { getDatabase } from '../../db/sqlite';
import { InteractionRenderer } from '../../components/InteractionRenderer';
import type {
  InteractionBlock,
  AttemptResult,
  PlanItemDto,
} from '@orbos/types';

type ScreenState =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'lesson'; script: InteractionBlock[]; planItem: PlanItemDto }
  | { kind: 'complete'; totalItems: number; correctCount: number };

export default function LessonScreen() {
  const { studentId, studentName, studentAge } = useLocalSearchParams<{
    studentId: string;
    studentName: string;
    studentAge: string;
  }>();
  const router = useRouter();
  const [state, setState] = useState<ScreenState>({ kind: 'loading' });

  useEffect(() => {
    if (!studentId) {
      setState({ kind: 'error', message: 'No se proporcionó un perfil de estudiante' });
      return;
    }
    loadLessonScript();
  }, [studentId]);

  async function loadLessonScript() {
    try {
      // 1. Fetch daily plan (try API first, fall back to SQLite cache)
      let plan;
      try {
        plan = await apiClient.getDailyPlan(studentId!);

        // Cache in SQLite
        try {
          const db = getDatabase();
          const today = new Date().toISOString().slice(0, 10);
          await db.runAsync(
            `INSERT OR REPLACE INTO daily_plan (id, student_id, date, plan_json) VALUES (?, ?, ?, ?)`,
            [`plan-${studentId}-${today}`, studentId!, today, JSON.stringify(plan)],
          );
        } catch {
          // SQLite cache failure is non-fatal
        }
      } catch (apiErr) {
        // Try SQLite cache
        const db = getDatabase();
        const today = new Date().toISOString().slice(0, 10);
        const cached = await db.getFirstAsync<{ plan_json: string }>(
          `SELECT plan_json FROM daily_plan WHERE student_id = ? AND date = ? LIMIT 1`,
          [studentId!, today],
        );
        if (cached) {
          plan = JSON.parse(cached.plan_json);
        } else {
          throw apiErr;
        }
      }

      // 2. Find first lesson/practice item with a script
      const lessonItem = plan.items.find(
        (item: PlanItemDto) =>
          (item.type === 'lesson' || item.type === 'practice') &&
          item.lesson_script_id,
      );

      if (!lessonItem || !lessonItem.lesson_script_id) {
        setState({
          kind: 'error',
          message: 'No hay lecciones disponibles en tu plan de hoy',
        });
        return;
      }

      // 3. Fetch the lesson script by ID (try API, fall back to SQLite)
      let scriptResponse;
      try {
        scriptResponse = await apiClient.getLessonScriptById(
          lessonItem.lesson_script_id,
        );

        // Cache in SQLite
        try {
          const db = getDatabase();
          await db.runAsync(
            `INSERT OR REPLACE INTO lesson_scripts (id, standard_id, student_age, script_json, safety_approved) VALUES (?, ?, ?, ?, ?)`,
            [
              scriptResponse.id,
              scriptResponse.standard_id,
              Number(studentAge) || 6,
              JSON.stringify(scriptResponse.script),
              scriptResponse.safety_approved ? 1 : 0,
            ],
          );
        } catch {
          // Cache failure is non-fatal
        }
      } catch {
        // Try SQLite cache
        const db = getDatabase();
        const cached = await db.getFirstAsync<{ script_json: string }>(
          `SELECT script_json FROM lesson_scripts WHERE id = ? LIMIT 1`,
          [lessonItem.lesson_script_id],
        );
        if (cached) {
          scriptResponse = { script: JSON.parse(cached.script_json) };
        } else {
          throw new Error('No se pudo cargar el guion de la lección');
        }
      }

      const script = scriptResponse.script as InteractionBlock[];
      if (!script || script.length === 0) {
        setState({ kind: 'error', message: 'El guion de la lección está vacío' });
        return;
      }

      setState({ kind: 'lesson', script, planItem: lessonItem });
    } catch (err) {
      console.error('Failed to load lesson:', err);
      setState({
        kind: 'error',
        message: `Error cargando la lección: ${err instanceof Error ? err.message : String(err)}`,
      });
    }
  }

  const handleComplete = useCallback(
    async (attempts: AttemptResult[]) => {
      if (state.kind !== 'lesson') return;

      const correctCount = attempts.filter((a) => a.correct).length;

      // Log each attempt to the API (or queue to SQLite)
      for (const attempt of attempts) {
        try {
          await apiClient.logAttempt({
            student_id: studentId!,
            standard_id: state.planItem.standard_id,
            interaction_component: attempt.component,
            correct: attempt.correct,
            time_spent_seconds: attempt.time_spent_seconds,
            hint_used: attempt.hint_used,
            source: state.planItem.type === 'practice' ? 'lesson' : 'lesson',
          });
        } catch {
          // Queue to SQLite for later sync
          try {
            const db = getDatabase();
            const id = `attempt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
            await db.runAsync(
              `INSERT INTO attempt_queue (id, student_id, standard_id, interaction_component, correct, time_spent_seconds, hint_used, source, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                id,
                studentId!,
                state.planItem.standard_id,
                attempt.component,
                attempt.correct ? 1 : 0,
                attempt.time_spent_seconds,
                attempt.hint_used ? 1 : 0,
                'lesson',
                new Date().toISOString(),
              ],
            );
          } catch {
            console.error('Failed to queue attempt to SQLite');
          }
        }
      }

      setState({
        kind: 'complete',
        totalItems: attempts.length,
        correctCount,
      });
    },
    [state, studentId],
  );

  // ── Render based on state ──────────────────────

  if (state.kind === 'loading') {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6C63FF" />
        <Text style={styles.loadingText}>Preparando tu lección...</Text>
      </View>
    );
  }

  if (state.kind === 'error') {
    return (
      <View style={styles.center}>
        <Text style={styles.errorEmoji}>😕</Text>
        <Text style={styles.errorText}>{state.message}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => {
            setState({ kind: 'loading' });
            loadLessonScript();
          }}
        >
          <Text style={styles.retryText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (state.kind === 'complete') {
    return <CompletionScreen totalItems={state.totalItems} correctCount={state.correctCount} onClose={() => router.back()} />;
  }

  return (
    <InteractionRenderer
      script={state.script}
      studentId={studentId!}
      standardId={state.planItem.standard_id}
      studentAge={Number(studentAge) || 8}
      onComplete={handleComplete}
    />
  );
}

// ── Completion Sub-screen ─────────────────────────

function CompletionScreen({
  totalItems,
  correctCount,
  onClose,
}: {
  totalItems: number;
  correctCount: number;
  onClose: () => void;
}) {
  useEffect(() => {
    tts.speak('¡Buen trabajo hoy! Terminaste tus bloques de aprendizaje.');
  }, []);

  return (
    <View style={styles.completionContainer}>
      <Text style={styles.completionTitle}>¡Buen trabajo hoy!</Text>
      <Text style={styles.completionSubtitle}>
        Terminaste tus bloques de aprendizaje.{'\n'}Tu mente creció un poco más.
      </Text>
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{totalItems}</Text>
          <Text style={styles.statLabel}>Bloques completados</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{correctCount}</Text>
          <Text style={styles.statLabel}>Respuestas correctas</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.closeButton} onPress={onClose}>
        <Text style={styles.closeButtonText}>Cerrar sesión por hoy →</Text>
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
  retryButton: {
    marginTop: 24,
    paddingVertical: 14,
    paddingHorizontal: 36,
    backgroundColor: '#6C63FF',
    borderRadius: 14,
  },
  retryText: {
    fontSize: 18,
    color: '#FFF',
    fontWeight: '600',
  },
  completionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0FFF4',
    padding: 40,
  },
  completionTitle: {
    fontSize: 36,
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: 16,
  },
  completionSubtitle: {
    fontSize: 20,
    color: '#555',
    textAlign: 'center',
    lineHeight: 30,
    marginBottom: 40,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 32,
    marginBottom: 48,
  },
  statBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    minWidth: 160,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  statNumber: {
    fontSize: 36,
    fontWeight: '700',
    color: '#34C759',
  },
  statLabel: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
  },
  closeButton: {
    backgroundColor: '#1A1A2E',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 48,
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
  },
});
