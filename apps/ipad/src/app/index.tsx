import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { tts } from '../services/tts.service';
import { apiClient } from '../services/api-client';
import type { StudentResponseDto } from '@orbos/types';

const EMOJIS = ['🦋', '🚀', '🌟', '🐙', '🌈'];

export default function ProfileSelector() {
  const router = useRouter();
  const [students, setStudents] = useState<StudentResponseDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    tts.speak('Elige tu perfil para comenzar');

    apiClient
      .getStudents()
      .then(setStudents)
      .catch((err) => {
        console.warn('Failed to fetch students, using fallback:', err);
        // Fallback to hardcoded profiles matching seeded data
        setStudents([
          { id: '54fbe0d9', name: 'Ana', age: 5, grade_target: 1, interests: ['animales'] },
          { id: '937f13bc', name: 'Miguel', age: 8, grade_target: 3, interests: ['dinosaurios'] },
          { id: 'b07d2cc1', name: 'Sofia', age: 11, grade_target: 5, interests: ['naturaleza'] },
        ]);
      })
      .finally(() => setLoading(false));
  }, []);

  function handleSelect(student: StudentResponseDto) {
    tts.stop();
    router.push({
      pathname: '/(session)/lesson',
      params: { studentId: student.id, studentName: student.name, studentAge: String(student.age) },
    });
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#6C63FF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>¿Quién eres hoy?</Text>
      <View style={styles.profiles}>
        {students.map((student, idx) => (
          <TouchableOpacity
            key={student.id}
            style={styles.card}
            onPress={() => handleSelect(student)}
            activeOpacity={0.8}
          >
            <Text style={styles.avatar}>{EMOJIS[idx % EMOJIS.length]}</Text>
            <Text style={styles.name}>{student.name}</Text>
            <Text style={styles.age}>{student.age} años</Text>
          </TouchableOpacity>
        ))}
      </View>
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
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: 48,
  },
  profiles: {
    flexDirection: 'row',
    gap: 32,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    width: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  avatar: {
    fontSize: 64,
    marginBottom: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1A1A2E',
    marginBottom: 4,
  },
  age: {
    fontSize: 18,
    color: '#666',
  },
});
