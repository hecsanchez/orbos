import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { tts } from '../../services/tts.service';
import { sessionEngine } from '../../services/session.engine';
import { useSession } from '../../context/session.context';

export default function HomeScreen() {
  const router = useRouter();
  const session = useSession();
  const student = session.student;
  const plan = session.plan;

  useEffect(() => {
    if (student) {
      tts.speak(`Hola, ${student.name}. Hoy tienes un plan de aprendizaje listo.`);
    }
    return () => tts.stop();
  }, [student]);

  if (!student || !plan) {
    router.replace('/');
    return null;
  }

  const lessonItems = plan.items.filter(
    (i) => i.type === 'lesson' || i.type === 'practice',
  );
  const subjects = [...new Set(lessonItems.map((i) => i.subject).filter(Boolean))];

  function handleStart() {
    tts.stop();
    sessionEngine.start();
    router.push('/(session)/lesson');
  }

  return (
    <View style={styles.container}>
      <Text style={styles.greeting}>Hola, {student.name}</Text>
      <Text style={styles.subtitle}>Tu plan de hoy</Text>

      <View style={styles.summaryCard}>
        <View style={styles.statRow}>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>{lessonItems.length}</Text>
            <Text style={styles.statLabel}>Bloques</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>{plan.total_minutes}</Text>
            <Text style={styles.statLabel}>Minutos</Text>
          </View>
        </View>

        {subjects.length > 0 && (
          <View style={styles.subjectsRow}>
            {subjects.map((subject) => (
              <View key={subject} style={styles.subjectChip}>
                <Text style={styles.subjectText}>{subject}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.itemsList}>
          {plan.items.slice(0, 8).map((item, idx) => (
            <View key={idx} style={styles.itemRow}>
              <Text style={styles.itemIcon}>
                {item.type === 'break'
                  ? '☕'
                  : item.type === 'lesson'
                    ? '📖'
                    : item.type === 'practice'
                      ? '✏️'
                      : '🔬'}
              </Text>
              <Text style={styles.itemText} numberOfLines={1}>
                {item.type === 'break'
                  ? 'Descanso'
                  : item.standard_description}
              </Text>
              <Text style={styles.itemTime}>{item.estimated_minutes} min</Text>
            </View>
          ))}
        </View>
      </View>

      <TouchableOpacity style={styles.startButton} onPress={handleStart}>
        <Text style={styles.startButtonText}>Empezar hoy →</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
    padding: 40,
  },
  greeting: {
    fontSize: 36,
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 20,
    color: '#666',
    marginBottom: 32,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 32,
    width: '100%',
    maxWidth: 600,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    marginBottom: 32,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 48,
    marginBottom: 20,
  },
  stat: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: '700',
    color: '#6C63FF',
  },
  statLabel: {
    fontSize: 14,
    color: '#888',
    marginTop: 2,
  },
  subjectsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  subjectChip: {
    backgroundColor: '#F0EDFF',
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  subjectText: {
    fontSize: 14,
    color: '#6C63FF',
    fontWeight: '600',
  },
  itemsList: {
    gap: 8,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
  },
  itemIcon: {
    fontSize: 18,
    width: 28,
    textAlign: 'center',
  },
  itemText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  itemTime: {
    fontSize: 14,
    color: '#999',
  },
  startButton: {
    backgroundColor: '#1A1A2E',
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 56,
    minWidth: 280,
    alignItems: 'center',
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '600',
  },
});
