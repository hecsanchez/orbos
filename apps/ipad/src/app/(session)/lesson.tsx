import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { tts } from '../../services/tts.service';

export default function LessonScreen() {
  const placeholderText =
    'Bienvenido a tu sesión de aprendizaje. Aquí aparecerán tus lecciones.';

  useEffect(() => {
    tts.speak(placeholderText);
    return () => tts.stop();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sesión de Aprendizaje</Text>
      <Text style={styles.body}>{placeholderText}</Text>
      <Text style={styles.note}>
        Placeholder — las lecciones interactivas llegarán pronto
      </Text>
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
  body: {
    fontSize: 22,
    color: '#333',
    textAlign: 'center',
    maxWidth: 600,
    lineHeight: 32,
    marginBottom: 32,
  },
  note: {
    fontSize: 16,
    color: '#999',
    fontStyle: 'italic',
  },
});
