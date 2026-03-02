import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { Audio } from 'expo-av';
import { tts } from '../../services/tts.service';
import { getAgeGroup, AGE_THEME } from '../../utils/age-theme';

export interface AudioExplainProps {
  prompt: string;
  tts_text: string;
  min_duration_seconds?: number; // minimum recording duration, default 3
  studentAge?: number;
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
  studentAge = 8,
  onComplete,
}: AudioExplainProps) {
  const theme = AGE_THEME[getAgeGroup(studentAge)];
  const [canInteract, setCanInteract] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [permissionError, setPermissionError] = useState(false);
  const timerStart = useRef<number>(0);
  const recordStart = useRef<number>(0);
  const durationInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);

  const pulseAnim = useRef(new Animated.Value(1)).current;

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
      if (durationInterval.current) clearInterval(durationInterval.current);
      tts.stop();
      soundRef.current?.unloadAsync();
    };
  }, [tts_text]);

  // Pulse animation while recording
  useEffect(() => {
    if (!isRecording) {
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
  }, [isRecording, pulseAnim]);

  const startRecording = useCallback(async () => {
    if (!canInteract || isRecording) return;

    try {
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        setPermissionError(true);
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
      );

      setRecording(newRecording);
      setIsRecording(true);
      setRecordingUri(null);
      recordStart.current = Date.now();
      setRecordingDuration(0);

      durationInterval.current = setInterval(() => {
        setRecordingDuration(Math.floor((Date.now() - recordStart.current) / 1000));
      }, 500);
    } catch {
      setPermissionError(true);
    }
  }, [canInteract, isRecording]);

  const stopRecording = useCallback(async () => {
    if (!recording) return;

    if (durationInterval.current) {
      clearInterval(durationInterval.current);
      durationInterval.current = null;
    }

    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecordingUri(uri);
      setIsRecording(false);
      setRecording(null);

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });
    } catch {
      setIsRecording(false);
      setRecording(null);
    }
  }, [recording]);

  const playRecording = useCallback(async () => {
    if (!recordingUri || isPlaying) return;

    try {
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri: recordingUri },
        { shouldPlay: true },
      );
      soundRef.current = sound;
      setIsPlaying(true);

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setIsPlaying(false);
        }
      });
    } catch {
      setIsPlaying(false);
    }
  }, [recordingUri, isPlaying]);

  const handleSubmit = useCallback(() => {
    if (!recordingUri) return;
    const timeSpent = (Date.now() - timerStart.current) / 1000;
    // Audio explanations are always "correct" — they're evidence capture
    onComplete({
      correct: true,
      hint_used: false,
      time_spent_seconds: Math.round(timeSpent * 10) / 10,
    });
  }, [recordingUri, onComplete]);

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const meetsMinDuration = recordingDuration >= min_duration_seconds;

  return (
    <View style={styles.container}>
      <Text style={[styles.prompt, { fontSize: theme.fontSize.instruction }]}>
        {prompt}
      </Text>

      {permissionError && (
        <Text style={styles.errorText}>
          Necesitamos acceso al micrófono para grabar tu explicación
        </Text>
      )}

      {!recordingUri ? (
        /* Recording phase */
        <View style={styles.recordingArea}>
          {isRecording ? (
            <>
              <Animated.View style={[styles.recordIndicator, { transform: [{ scale: pulseAnim }] }]}>
                <Text style={styles.recordDot}>●</Text>
              </Animated.View>
              <Text style={[styles.durationText, { fontSize: theme.fontSize.body }]}>
                {formatDuration(recordingDuration)}
              </Text>
              <TouchableOpacity
                style={[styles.stopButton, !meetsMinDuration && styles.stopButtonDisabled]}
                onPress={stopRecording}
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
              onPress={startRecording}
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
            Grabación lista — {formatDuration(recordingDuration)}
          </Text>

          <View style={styles.reviewButtons}>
            <TouchableOpacity
              style={styles.playButton}
              onPress={playRecording}
              disabled={isPlaying}
            >
              <Text style={[styles.playText, { fontSize: theme.fontSize.button }]}>
                {isPlaying ? 'Reproduciendo...' : '▶ Escuchar'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.reRecordButton}
              onPress={() => {
                setRecordingUri(null);
                setRecordingDuration(0);
              }}
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
  errorText: {
    color: '#FF9500',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  recordingArea: {
    alignItems: 'center',
    gap: 20,
  },
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
  recordButtonDisabled: {
    opacity: 0.5,
  },
  micIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  recordText: {
    fontWeight: '600',
    color: '#1A1A2E',
  },
  recordIndicator: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFE0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordDot: {
    fontSize: 32,
    color: '#FF3B30',
  },
  durationText: {
    fontWeight: '700',
    color: '#1A1A2E',
  },
  stopButton: {
    backgroundColor: '#1A1A2E',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 40,
  },
  stopButtonDisabled: {
    backgroundColor: '#CCC',
  },
  stopText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  minDurationHint: {
    color: '#999',
    fontSize: 14,
    marginTop: 4,
  },
  reviewArea: {
    alignItems: 'center',
    gap: 24,
  },
  reviewLabel: {
    color: '#34C759',
    fontWeight: '600',
  },
  reviewButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  playButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderWidth: 2,
    borderColor: '#6C63FF',
  },
  playText: {
    color: '#6C63FF',
    fontWeight: '600',
  },
  reRecordButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderWidth: 2,
    borderColor: '#DDD',
  },
  reRecordText: {
    color: '#666',
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: '#1A1A2E',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 48,
    minWidth: 240,
    alignItems: 'center',
    marginTop: 8,
  },
  submitText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
