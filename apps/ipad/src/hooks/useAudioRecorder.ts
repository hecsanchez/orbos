import { useState, useRef, useCallback } from 'react';
import { Audio } from 'expo-av';

export interface AudioRecorderState {
  isRecording: boolean;
  recordingUri: string | null;
  recordingDuration: number;
  isPlaying: boolean;
  permissionError: boolean;
}

export interface AudioRecorderActions {
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  playRecording: () => Promise<void>;
  resetRecording: () => void;
  cleanup: () => void;
}

export function useAudioRecorder(
  minDuration = 3,
): AudioRecorderState & AudioRecorderActions {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [permissionError, setPermissionError] = useState(false);

  const recordStart = useRef<number>(0);
  const durationInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);

  const startRecording = useCallback(async () => {
    if (isRecording) return;

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
        setRecordingDuration(
          Math.floor((Date.now() - recordStart.current) / 1000),
        );
      }, 500);
    } catch {
      setPermissionError(true);
    }
  }, [isRecording]);

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

  const resetRecording = useCallback(() => {
    setRecordingUri(null);
    setRecordingDuration(0);
  }, []);

  const cleanup = useCallback(() => {
    if (durationInterval.current) clearInterval(durationInterval.current);
    soundRef.current?.unloadAsync();
  }, []);

  return {
    isRecording,
    recordingUri,
    recordingDuration,
    isPlaying,
    permissionError,
    startRecording,
    stopRecording,
    playRecording,
    resetRecording,
    cleanup,
  };
}
