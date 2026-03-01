import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { tts } from '../services/tts.service';

const PROFILES = [
  { id: '1', name: 'Sofía', age: 6, grade: 1, emoji: '🦋' },
  { id: '2', name: 'Mateo', age: 8, grade: 4, emoji: '🚀' },
  { id: '3', name: 'Valentina', age: 11, grade: 6, emoji: '🌟' },
];

export default function ProfileSelector() {
  const router = useRouter();

  useEffect(() => {
    tts.speak('Elige tu perfil para comenzar');
  }, []);

  function handleSelect(profile: (typeof PROFILES)[number]) {
    tts.stop();
    router.push('/(session)/lesson');
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>¿Quién eres hoy?</Text>
      <View style={styles.profiles}>
        {PROFILES.map((profile) => (
          <TouchableOpacity
            key={profile.id}
            style={styles.card}
            onPress={() => handleSelect(profile)}
            activeOpacity={0.8}
          >
            <Text style={styles.avatar}>{profile.emoji}</Text>
            <Text style={styles.name}>{profile.name}</Text>
            <Text style={styles.age}>{profile.age} años</Text>
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
