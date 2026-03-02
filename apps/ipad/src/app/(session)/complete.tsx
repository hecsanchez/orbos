import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { tts } from '../../services/tts.service';
import { sessionEngine } from '../../services/session.engine';
import { syncService } from '../../services/sync.service';
import { useSession } from '../../context/session.context';

export default function CompleteScreen() {
  const router = useRouter();
  const session = useSession();
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    tts.speak('¡Buen trabajo hoy! Terminaste tus bloques de aprendizaje. Tu mente creció un poco más.');

    // Trigger sync
    setSyncing(true);
    syncService.syncAll().finally(() => setSyncing(false));

    return () => tts.stop();
  }, []);

  const totalItems = session.completedItems.length;
  const correctCount = session.attempts.filter((a) => a.correct).length;

  function handleClose() {
    tts.stop();
    sessionEngine.reset();
    router.replace('/');
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>¡Buen trabajo hoy!</Text>
      <Text style={styles.subtitle}>
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

      {syncing && (
        <Text style={styles.syncText}>Sincronizando...</Text>
      )}

      <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
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
  },
  subtitle: {
    fontSize: 20,
    color: '#555',
    textAlign: 'center',
    lineHeight: 30,
    marginBottom: 40,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 32,
    marginBottom: 32,
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
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
  },
});
