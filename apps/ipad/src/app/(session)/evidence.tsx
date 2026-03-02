import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Animated,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { tts } from '../../services/tts.service';
import { useSession } from '../../context/session.context';
import { useProfile } from '../../context/profile.context';
import { useAudioRecorder } from '../../hooks/useAudioRecorder';
import { sessionEngine } from '../../services/session.engine';
import { getDatabase } from '../../db/sqlite';
import { AGE_THEME } from '../../utils/age-theme';

type CaptureMode = 'choose' | 'audio' | 'photo';

export default function EvidenceScreen() {
  const { currentItem, student } = useSession();
  const { ageGroup } = useProfile();
  const theme = AGE_THEME[ageGroup];

  const [mode, setMode] = useState<CaptureMode>('choose');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const recorder = useAudioRecorder(3);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const phenomenonId = currentItem?.phenomenon_id ?? null;
  const promptText = 'Muestra lo que aprendiste con este fenómeno';
  const ttsText = 'Muestra lo que aprendiste con este fenómeno';

  useEffect(() => {
    tts.speak(ttsText);
    return () => {
      tts.stop();
      recorder.cleanup();
    };
  }, []);

  // Pulse animation while recording
  useEffect(() => {
    if (!recorder.isRecording) {
      pulseAnim.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [recorder.isRecording, pulseAnim]);

  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permiso necesario',
        'Necesitamos acceso a la cámara para tomar fotos.',
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.7,
      allowsEditing: false,
    });

    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const saveToQueue = async (fileUri: string, type: 'photo' | 'audio') => {
    const db = getDatabase();
    const id = `ev-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    await db.runAsync(
      `INSERT INTO evidence_queue (id, student_id, standard_id, phenomenon_id, type, file_uri) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        id,
        student?.id ?? '',
        currentItem?.standard_id ?? '',
        phenomenonId ?? '',
        type,
        fileUri,
      ],
    );
  };

  const handleSubmit = async () => {
    if (submitted) return;
    setSubmitted(true);

    try {
      if (mode === 'audio' && recorder.recordingUri) {
        await saveToQueue(recorder.recordingUri, 'audio');
      } else if (mode === 'photo' && photoUri) {
        await saveToQueue(photoUri, 'photo');
      }

      await sessionEngine.completeCurrentItem([
        {
          component: 'evidence_capture',
          correct: true,
          hint_used: false,
          time_spent_seconds: 0,
        },
      ]);
      sessionEngine.advance();
    } catch {
      setSubmitted(false);
      Alert.alert(
        'Error',
        'No se pudo guardar la evidencia. Intenta de nuevo.',
      );
    }
  };

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // ── Mode selector ──
  if (mode === 'choose') {
    return (
      <View style={styles.container}>
        <Text style={[styles.title, { fontSize: theme.fontSize.instruction }]}>
          Evidencia de Aprendizaje
        </Text>
        <Text style={[styles.prompt, { fontSize: theme.fontSize.body }]}>
          {promptText}
        </Text>
        <View style={styles.modeButtons}>
          <TouchableOpacity
            style={[styles.modeButton, styles.audioModeButton]}
            onPress={() => setMode('audio')}
            activeOpacity={0.8}
          >
            <Text style={styles.modeEmoji}>🎤</Text>
            <Text
              style={[
                styles.modeButtonText,
                { fontSize: theme.fontSize.button },
              ]}
            >
              Grabar explicación
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeButton, styles.photoModeButton]}
            onPress={() => {
              setMode('photo');
              handleTakePhoto();
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.modeEmoji}>📸</Text>
            <Text
              style={[
                styles.modeButtonText,
                { fontSize: theme.fontSize.button },
              ]}
            >
              Tomar foto
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Audio mode ──
  if (mode === 'audio') {
    return (
      <View style={styles.container}>
        <Text style={[styles.title, { fontSize: theme.fontSize.instruction }]}>
          Graba tu explicación
        </Text>
        <Text style={[styles.prompt, { fontSize: theme.fontSize.body }]}>
          {promptText}
        </Text>

        {recorder.permissionError && (
          <Text style={styles.errorText}>
            Necesitamos acceso al micrófono para grabar
          </Text>
        )}

        {!recorder.recordingUri ? (
          <View style={styles.recordingArea}>
            {recorder.isRecording ? (
              <>
                <Animated.View
                  style={[
                    styles.recordIndicator,
                    { transform: [{ scale: pulseAnim }] },
                  ]}
                >
                  <Text style={styles.recordDot}>●</Text>
                </Animated.View>
                <Text
                  style={[
                    styles.durationText,
                    { fontSize: theme.fontSize.body },
                  ]}
                >
                  {formatDuration(recorder.recordingDuration)}
                </Text>
                <TouchableOpacity
                  style={[
                    styles.stopButton,
                    recorder.recordingDuration < 3 && styles.stopButtonDisabled,
                  ]}
                  onPress={recorder.stopRecording}
                  disabled={recorder.recordingDuration < 3}
                >
                  <Text
                    style={[
                      styles.stopText,
                      { fontSize: theme.fontSize.button },
                    ]}
                  >
                    Detener
                  </Text>
                </TouchableOpacity>
                {recorder.recordingDuration < 3 && (
                  <Text style={styles.minDurationHint}>
                    Habla por lo menos 3 segundos
                  </Text>
                )}
              </>
            ) : (
              <TouchableOpacity
                style={styles.recordButton}
                onPress={recorder.startRecording}
              >
                <Text style={styles.micIcon}>🎤</Text>
                <Text
                  style={[
                    styles.recordText,
                    { fontSize: theme.fontSize.button },
                  ]}
                >
                  Grabar
                </Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.reviewArea}>
            <Text
              style={[styles.reviewLabel, { fontSize: theme.fontSize.body }]}
            >
              Grabación lista — {formatDuration(recorder.recordingDuration)}
            </Text>
            <View style={styles.reviewButtons}>
              <TouchableOpacity
                style={styles.playButton}
                onPress={recorder.playRecording}
                disabled={recorder.isPlaying}
              >
                <Text
                  style={[
                    styles.playText,
                    { fontSize: theme.fontSize.button },
                  ]}
                >
                  {recorder.isPlaying ? 'Reproduciendo...' : '▶ Escuchar'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.reRecordButton}
                onPress={recorder.resetRecording}
              >
                <Text
                  style={[
                    styles.reRecordText,
                    { fontSize: theme.fontSize.body },
                  ]}
                >
                  Grabar de nuevo
                </Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={[styles.submitButton, submitted && styles.submitDisabled]}
              onPress={handleSubmit}
              disabled={submitted}
            >
              <Text
                style={[
                  styles.submitText,
                  { fontSize: theme.fontSize.button },
                ]}
              >
                {submitted ? 'Guardando...' : 'Listo ✓'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setMode('choose')}
        >
          <Text style={styles.backText}>← Cambiar modo</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Photo mode ──
  return (
    <View style={styles.container}>
      <Text style={[styles.title, { fontSize: theme.fontSize.instruction }]}>
        Captura tu evidencia
      </Text>
      <Text style={[styles.prompt, { fontSize: theme.fontSize.body }]}>
        {promptText}
      </Text>

      {photoUri ? (
        <View style={styles.photoReview}>
          <Image source={{ uri: photoUri }} style={styles.photoPreview} />
          <View style={styles.photoActions}>
            <TouchableOpacity
              style={styles.retakeButton}
              onPress={handleTakePhoto}
            >
              <Text
                style={[
                  styles.retakeText,
                  { fontSize: theme.fontSize.body },
                ]}
              >
                Tomar otra
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.submitButton, submitted && styles.submitDisabled]}
              onPress={handleSubmit}
              disabled={submitted}
            >
              <Text
                style={[
                  styles.submitText,
                  { fontSize: theme.fontSize.button },
                ]}
              >
                {submitted ? 'Guardando...' : 'Listo ✓'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.noPhotoArea}>
          <TouchableOpacity
            style={styles.takePhotoButton}
            onPress={handleTakePhoto}
          >
            <Text style={styles.modeEmoji}>📸</Text>
            <Text
              style={[
                styles.takePhotoText,
                { fontSize: theme.fontSize.button },
              ]}
            >
              Tomar foto
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => {
          setPhotoUri(null);
          setMode('choose');
        }}
      >
        <Text style={styles.backText}>← Cambiar modo</Text>
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
  title: { fontWeight: '700', color: '#1A1A2E', marginBottom: 16, textAlign: 'center' },
  prompt: { color: '#333', textAlign: 'center', marginBottom: 40, lineHeight: 34, maxWidth: 700 },
  modeButtons: { flexDirection: 'row', gap: 32 },
  modeButton: {
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
  audioModeButton: { backgroundColor: '#E8F5E9' },
  photoModeButton: { backgroundColor: '#E3F2FD' },
  modeEmoji: { fontSize: 48, marginBottom: 12 },
  modeButtonText: { fontWeight: '600', color: '#1A1A2E' },
  errorText: { color: '#FF9500', fontSize: 16, textAlign: 'center', marginBottom: 20 },
  recordingArea: { alignItems: 'center', gap: 20 },
  recordButton: {
    backgroundColor: '#E8F5E9',
    borderRadius: 24,
    paddingVertical: 28,
    paddingHorizontal: 48,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  micIcon: { fontSize: 48, marginBottom: 12 },
  recordText: { fontWeight: '600', color: '#1A1A2E' },
  recordIndicator: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFE0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordDot: { fontSize: 32, color: '#FF3B30' },
  durationText: { fontWeight: '700', color: '#1A1A2E' },
  stopButton: { backgroundColor: '#1A1A2E', borderRadius: 16, paddingVertical: 16, paddingHorizontal: 40 },
  stopButtonDisabled: { backgroundColor: '#CCC' },
  stopText: { color: '#FFFFFF', fontWeight: '600' },
  minDurationHint: { color: '#999', fontSize: 14, marginTop: 4 },
  reviewArea: { alignItems: 'center', gap: 24 },
  reviewLabel: { color: '#34C759', fontWeight: '600' },
  reviewButtons: { flexDirection: 'row', gap: 16 },
  playButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderWidth: 2,
    borderColor: '#6C63FF',
  },
  playText: { color: '#6C63FF', fontWeight: '600' },
  reRecordButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderWidth: 2,
    borderColor: '#DDD',
  },
  reRecordText: { color: '#666', fontWeight: '500' },
  submitButton: {
    backgroundColor: '#1A1A2E',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 48,
    minWidth: 240,
    alignItems: 'center',
    marginTop: 8,
  },
  submitDisabled: { opacity: 0.6 },
  submitText: { color: '#FFFFFF', fontWeight: '600' },
  backButton: { position: 'absolute', bottom: 40, left: 40 },
  backText: { color: '#6C63FF', fontSize: 16, fontWeight: '500' },
  photoReview: { alignItems: 'center', gap: 24 },
  photoPreview: { width: 400, height: 300, borderRadius: 16, backgroundColor: '#EEE' },
  photoActions: { flexDirection: 'row', gap: 16, alignItems: 'center' },
  retakeButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderWidth: 2,
    borderColor: '#DDD',
  },
  retakeText: { color: '#666', fontWeight: '500' },
  noPhotoArea: { alignItems: 'center' },
  takePhotoButton: {
    backgroundColor: '#E3F2FD',
    borderRadius: 24,
    paddingVertical: 28,
    paddingHorizontal: 48,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  takePhotoText: { fontWeight: '600', color: '#1A1A2E' },
});
