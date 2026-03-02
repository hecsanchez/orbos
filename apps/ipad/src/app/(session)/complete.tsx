import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { tts } from '../../services/tts.service';
import { sessionEngine } from '../../services/session.engine';
import { syncService } from '../../services/sync.service';
import { useSession } from '../../context/session.context';
import { useProfileStore } from '../../stores/profile.store';

export default function CompleteScreen() {
  const router = useRouter();
  const session = useSession();
  const activeProfile = useProfileStore((s) => s.activeProfile);
  const clearActiveProfile = useProfileStore((s) => s.clearActiveProfile);
  const [syncing, setSyncing] = useState(true);
  const syncTimedOut = useRef(false);

  const name = activeProfile?.name ?? '';

  useEffect(() => {
    tts.speak(`¡Buen trabajo hoy, ${name}! Terminaste tus bloques de aprendizaje.`);

    // Trigger sync with 10s timeout
    const timeout = setTimeout(() => {
      syncTimedOut.current = true;
      setSyncing(false);
    }, 10_000);

    syncService.syncAll().finally(() => {
      if (!syncTimedOut.current) {
        clearTimeout(timeout);
        setSyncing(false);
      }
    });

    return () => {
      clearTimeout(timeout);
      tts.stop();
    };
  }, [name]);

  // Derive unique subjects from completed items
  const subjects = [
    ...new Set(
      session.completedItems
        .map((item) => item.subject)
        .filter(Boolean),
    ),
  ].join(' · ');

  function handleClose() {
    tts.stop();
    clearActiveProfile();
    sessionEngine.reset();
    router.replace('/');
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>¡Buen trabajo hoy, {name}!</Text>
      <Text style={styles.subtitle}>
        Terminaste tus bloques de aprendizaje.{'\n'}Tu mente creció un poco más.
      </Text>

      {subjects.length > 0 && (
        <Text style={styles.subjects}>{subjects}</Text>
      )}

      <View style={styles.badgesRow}>
        <View style={styles.badge}>
          <Text style={styles.badgeIcon}>⏱</Text>
          <Text style={styles.badgeLabel}>Tiempo cumplido</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeIcon}>📦</Text>
          <Text style={styles.badgeLabel}>Bloques listos</Text>
        </View>
      </View>

      {syncing && (
        <Text style={styles.syncText}>Sincronizando...</Text>
      )}

      <TouchableOpacity
        style={[styles.closeButton, syncing && styles.closeButtonDisabled]}
        onPress={handleClose}
        disabled={syncing}
      >
        <Text style={styles.closeButtonText}>Cerrar sesión por hoy →</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0FFF4',
    padding: 40,
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 20,
    color: '#555',
    textAlign: 'center',
    lineHeight: 30,
    marginBottom: 24,
  },
  subjects: {
    fontSize: 16,
    color: '#6C63FF',
    fontWeight: '600',
    marginBottom: 32,
    textAlign: 'center',
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 32,
  },
  badge: {
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
  badgeIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  badgeLabel: {
    fontSize: 14,
    color: '#888',
    fontWeight: '500',
  },
  syncText: {
    fontSize: 16,
    color: '#999',
    marginBottom: 24,
  },
  closeButton: {
    backgroundColor: '#1A1A2E',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 48,
  },
  closeButtonDisabled: {
    backgroundColor: '#CCC',
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
  },
});
