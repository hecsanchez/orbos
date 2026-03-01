import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { tts } from '../../services/tts.service';

export default function EvidenceScreen() {
  const promptText = 'Cuéntame qué aprendiste hoy';

  useEffect(() => {
    tts.speak(promptText);
    return () => tts.stop();
  }, []);

  function handleAudio() {
    Alert.alert('Próximamente', 'La grabación de audio estará disponible pronto.');
  }

  function handlePhoto() {
    Alert.alert('Próximamente', 'La captura de fotos estará disponible pronto.');
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Evidencia de Aprendizaje</Text>
      <Text style={styles.prompt}>{promptText}</Text>
      <View style={styles.buttons}>
        <TouchableOpacity
          style={[styles.button, styles.audioButton]}
          onPress={handleAudio}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonEmoji}>🎤</Text>
          <Text style={styles.buttonText}>Grabar explicación</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.photoButton]}
          onPress={handlePhoto}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonEmoji}>📸</Text>
          <Text style={styles.buttonText}>Tomar foto</Text>
        </TouchableOpacity>
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
    fontSize: 32,
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: 24,
  },
  prompt: {
    fontSize: 26,
    color: '#333',
    textAlign: 'center',
    marginBottom: 48,
    lineHeight: 36,
  },
  buttons: {
    flexDirection: 'row',
    gap: 32,
  },
  button: {
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    width: 220,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  audioButton: {
    backgroundColor: '#E8F5E9',
  },
  photoButton: {
    backgroundColor: '#E3F2FD',
  },
  buttonEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  buttonText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A2E',
  },
});
