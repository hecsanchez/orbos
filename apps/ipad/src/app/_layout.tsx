import React, { useEffect, useState } from 'react';
import { Slot } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { initDatabase } from '../db/sqlite';
import { tts } from '../services/tts.service';
import { SessionProvider } from '../context/session.context';
import { OfflineIndicator } from '../components/OfflineIndicator';

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      try {
        await initDatabase();
        await tts.speak('Hola');
        setReady(true);
      } catch (err) {
        console.error('Init error:', err);
        setError(String(err));
        setReady(true);
      }
    }
    init();
  }, []);

  if (!ready) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingText}>Cargando Orbos...</Text>
      </View>
    );
  }

  if (error) {
    console.warn('Init warning:', error);
  }

  return (
    <SessionProvider>
      <OfflineIndicator />
      <Slot />
    </SessionProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
  },
  loadingText: {
    fontSize: 24,
    color: '#333',
    fontWeight: '600',
  },
});
