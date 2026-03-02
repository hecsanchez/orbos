import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Animated,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { tts } from '../services/tts.service';
import { sessionEngine } from '../services/session.engine';
import { useSession } from '../context/session.context';
import { useProfileStore } from '../stores/profile.store';
import { AvatarCircle } from '../components/AvatarCircle';
import { AVATAR_CONFIG } from '../constants/avatars';
import type { StudentResponseDto } from '@orbos/types';
import type { LocalProfile } from '../stores/profile.types';

export default function ProfileSelector() {
  const router = useRouter();
  const session = useSession();
  const { profiles, loading, loadProfiles } = useProfileStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [initError, setInitError] = useState<string | null>(null);
  const highlightAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    tts.speak('Selecciona tu perfil para comenzar');
    loadProfiles();
    return () => tts.stop();
  }, []);

  // Navigate to home when session is ready
  useEffect(() => {
    if (session.status === 'ready') {
      router.push('/(session)/home');
    }
  }, [session.status, router]);

  async function handleSelect(profile: LocalProfile) {
    tts.stop();
    setInitError(null);
    setSelectedId(profile.id);

    // Highlight animation
    Animated.sequence([
      Animated.timing(highlightAnim, {
        toValue: 1.05,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(highlightAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();

    try {
      await useProfileStore.getState().setActiveProfile(profile);

      // Construct StudentResponseDto from LocalProfile
      const studentDto: StudentResponseDto = {
        id: profile.id,
        name: profile.name,
        age: profile.age,
        grade_target: profile.grade_target,
        interests: profile.interests,
      };

      await sessionEngine.initialize(studentDto);
      // Navigation happens via the useEffect above
    } catch {
      setInitError(
        'No se pudo preparar la sesión. Verifica tu conexión a internet.',
      );
      setSelectedId(null);
    }
  }

  // Loading / prefetch state
  if (session.status === 'loading') {
    const progress = session.prefetchProgress;
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#6C63FF" />
        <Text style={styles.loadingText}>Preparando tu sesión...</Text>
        {progress && progress.total > 0 && (
          <Text style={styles.progressText}>
            {progress.fetched}/{progress.total} lecciones
          </Text>
        )}
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#6C63FF" />
      </View>
    );
  }

  // Empty state
  if (profiles.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyEmoji}>👋</Text>
        <Text style={styles.title}>¡Bienvenido a Orbos!</Text>
        <Text style={styles.subtitle}>
          Agrega un perfil para comenzar a aprender
        </Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/profile/create')}
          activeOpacity={0.8}
        >
          <Text style={styles.addButtonText}>Agregar niño →</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>¿Quién va a aprender hoy?</Text>
      <Text style={styles.subtitle}>
        Selecciona tu perfil para comenzar
      </Text>

      {initError && <Text style={styles.errorText}>{initError}</Text>}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.profiles}
      >
        {profiles.map((profile) => {
          const isSelected = selectedId === profile.id;
          const isYoung = profile.age <= 6;
          const accentColor = AVATAR_CONFIG[profile.avatar_id]?.accentColor ?? '#6C63FF';
          const cardWidth = isYoung ? 220 : 200;

          return (
            <Animated.View
              key={profile.id}
              style={
                isSelected
                  ? { transform: [{ scale: highlightAnim }] }
                  : undefined
              }
            >
              <TouchableOpacity
                style={[
                  styles.card,
                  { width: cardWidth, borderColor: accentColor + '30' },
                  isSelected && {
                    borderColor: accentColor,
                    backgroundColor: accentColor + '08',
                  },
                ]}
                onPress={() => handleSelect(profile)}
                activeOpacity={0.8}
                disabled={selectedId !== null}
              >
                <AvatarCircle
                  avatarId={profile.avatar_id}
                  name={profile.name}
                  size={isYoung ? 80 : 64}
                  selected={isSelected}
                />
                <Text
                  style={[
                    styles.name,
                    isYoung && styles.nameYoung,
                  ]}
                >
                  {profile.name}
                </Text>
                <Text style={styles.age}>{profile.age} años</Text>
                <Text style={styles.grade}>
                  {profile.grade_target}° Grado
                </Text>
              </TouchableOpacity>
            </Animated.View>
          );
        })}

        {/* New Profile Card */}
        <TouchableOpacity
          style={[styles.card, styles.newCard]}
          onPress={() => router.push('/profile/create')}
          activeOpacity={0.8}
          disabled={selectedId !== null}
        >
          <View style={styles.plusCircle}>
            <Text style={styles.plusIcon}>+</Text>
          </View>
          <Text style={styles.newCardText}>Nuevo Perfil</Text>
        </TouchableOpacity>
      </ScrollView>
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
  emptyEmoji: {
    fontSize: 80,
    marginBottom: 24,
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#888',
    marginBottom: 40,
    textAlign: 'center',
  },
  profiles: {
    flexDirection: 'row',
    gap: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    width: 200,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  name: {
    fontSize: 22,
    fontWeight: '600',
    color: '#1A1A2E',
    marginTop: 12,
    marginBottom: 4,
  },
  nameYoung: {
    fontSize: 26,
  },
  age: {
    fontSize: 16,
    color: '#666',
  },
  grade: {
    fontSize: 14,
    color: '#999',
    marginTop: 2,
  },
  newCard: {
    borderStyle: 'dashed',
    borderColor: '#CCC',
    backgroundColor: '#FAFAFA',
    justifyContent: 'center',
  },
  plusCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  plusIcon: {
    fontSize: 32,
    color: '#999',
    fontWeight: '300',
  },
  newCardText: {
    fontSize: 16,
    color: '#999',
    fontWeight: '500',
  },
  addButton: {
    backgroundColor: '#6C63FF',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 48,
    marginTop: 16,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
  },
  loadingText: {
    fontSize: 20,
    color: '#666',
    marginTop: 16,
  },
  progressText: {
    fontSize: 16,
    color: '#999',
    marginTop: 8,
  },
  errorText: {
    fontSize: 16,
    color: '#FF6B6B',
    marginBottom: 24,
    textAlign: 'center',
    maxWidth: 400,
  },
});
