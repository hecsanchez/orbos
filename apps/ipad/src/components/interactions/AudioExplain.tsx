import React, { useEffect, useRef, useCallback, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { tts } from '../../services/tts.service';
import { useAudioRecorder } from '../../hooks/useAudioRecorder';
import { AGE_THEME, type AgeGroup } from '../../utils/age-theme';

export interface AudioExplainProps {
  prompt: string;
  tts_text: string;
  min_duration_seconds?: number;
  ageGroup?: AgeGroup;
  onComplete: (result: {
    correct: boolean;
    hint_used: boolean;
    time_spent_seconds: number;
  }) => void;
}

export function AudioExplain({
  prompt,
  tts_text,
  min_duration_seconds = 3,
  ageGroup = 'middle',
  onComplete,
}: AudioExplainProps) {
  const theme = AGE_THEME[ageGroup ?? 'middle'];
  const [canInteract, setCanInteract] = useState(false);
  const timerStart = useRef<number>(0);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const recorder = useAudioRecorder(min_duration_seconds);
  const meetsMinDuration = recorder.recordingDuration >= min_duration_seconds;

  useEffect(() => {
    tts.speak(tts_text).then(() => {
      setCanInteract(true);
      timerStart.current = Date.now();
    });
    const safety = setTimeout(() => {
      setCanInteract(true);
      if (timerStart.current === 0) timerStart.current = Date.now();
    }, 3000);
    return () => {
      clearTimeout(safety);
      recorder.cleanup();
      tts.stop();
    };
  }, [tts_text]);

  // Pulse animation while recording
  useEffect(() => {
    if (!recorder.isRecording) {
      pulseAnim.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 600, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [recorder.isRecording, pulseAnim]);

  const handleStart = useCallback(async () => {
    if (!canInteract) return;
    await recorder.startRecording();
  }, [canInteract, recorder]);

  const handleSubmit = useCallback(() => {
    if (!recorder.recordingUri) return;
    const timeSpent = (Date.now() - timerStart.current) / 1000;
    onComplete({
      correct: true,
      hint_used: false,
      time_spent_seconds: Math.round(timeSpent * 10) / 10,
    });
  }, [recorder.recordingUri, onComplete]);

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.prompt, { fontSize: theme.fontSize.instruction }]}>
        {prompt}
      </Text>

      {recorder.permissionError && (
        <Text style={styles.errorText}>
          Necesitamos acceso al micrófono para grabar tu explicación
        </Text>
      )}

      {!recorder.recordingUri ? (
        /* Recording phase */
        <View style={styles.recordingArea}>
          {recorder.isRecording ? (
            <>
              <Animated.View style={[styles.recordIndicator, { transform: [{ scale: pulseAnim }] }]}>
                <Text style={styles.recordDot}>●</Text>
              </Animated.View>
              <Text style={[styles.durationText, { fontSize: theme.fontSize.body }]}>
                {formatDuration(recorder.recordingDuration)}
              </Text>
              <TouchableOpacity
                style={[styles.stopButton, !meetsMinDuration && styles.stopButtonDisabled]}
                onPress={recorder.stopRecording}
                disabled={!meetsMinDuration}
              >
                <Text style={[styles.stopText, { fontSize: theme.fontSize.button }]}>
                  Detener
                </Text>
              </TouchableOpacity>
              {!meetsMinDuration && (
                <Text style={styles.minDurationHint}>
                  Habla por lo menos {min_duration_seconds} segundos
                </Text>
              )}
            </>
          ) : (
            <TouchableOpacity
              style={[styles.recordButton, !canInteract && styles.recordButtonDisabled]}
              onPress={handleStart}
              disabled={!canInteract}
            >
              <Text style={styles.micIcon}>🎤</Text>
              <Text style={[styles.recordText, { fontSize: theme.fontSize.button }]}>
                Grabar mi explicación
              </Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        /* Review phase */
        <View style={styles.reviewArea}>
          <Text style={[styles.reviewLabel, { fontSize: theme.fontSize.body }]}>
            Grabación lista — {formatDuration(recorder.recordingDuration)}
          </Text>

          <View style={styles.reviewButtons}>
            <TouchableOpacity
              style={styles.playButton}
              onPress={recorder.playRecording}
              disabled={recorder.isPlaying}
            >
              <Text style={[styles.playText, { fontSize: theme.fontSize.button }]}>
                {recorder.isPlaying ? 'Reproduciendo...' : '▶ Escuchar'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.reRecordButton}
              onPress={recorder.resetRecording}
            >
              <Text style={[styles.reRecordText, { fontSize: theme.fontSize.body }]}>
                Grabar de nuevo
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={[styles.submitText, { fontSize: theme.fontSize.button }]}>
              Enviar →
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#F5F7FA',
  },
  prompt: {
    fontWeight: '700',
    color: '#1A1A2E',
    textAlign: 'center',
    marginBottom: 40,
    maxWidth: 700,
    lineHeight: 34,
  },
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
  recordButtonDisabled: { opacity: 0.5 },
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
  submitText: { color: '#FFFFFF', fontWeight: '600' },
});
