import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { syncService } from '../services/sync.service';

export function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const offline = !(state.isConnected && state.isInternetReachable !== false);
      setIsOffline(offline);

      // Auto-sync when coming back online
      if (!offline) {
        syncService.getPendingCount().then(({ attempts }) => {
          if (attempts > 0) {
            setIsSyncing(true);
            syncService.syncAll().finally(() => setIsSyncing(false));
          }
        });
      }
    });

    return () => unsubscribe();
  }, []);

  const showBanner = isOffline || isSyncing;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: showBanner ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [showBanner, fadeAnim]);

  if (!showBanner) return null;

  return (
    <Animated.View style={[styles.banner, { opacity: fadeAnim }]}>
      <Text style={styles.icon}>{isSyncing ? '🔄' : '📡'}</Text>
      <Text style={styles.text}>
        {isSyncing ? 'Sincronizando...' : 'Trabajando sin conexión'}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  icon: {
    fontSize: 16,
  },
  text: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
});
