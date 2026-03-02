import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useProfileStore } from '../../stores/profile.store';
import { AvatarCircle } from '../../components/AvatarCircle';
import { AVATAR_IDS, type AvatarId } from '../../constants/avatars';

const AGES = [5, 6, 7, 8, 9, 10, 11] as const;

export default function CreateProfileScreen() {
  const router = useRouter();
  const addProfile = useProfileStore((s) => s.addProfile);

  const [name, setName] = useState('');
  const [age, setAge] = useState<number | null>(null);
  const [avatarId, setAvatarId] = useState<AvatarId | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = name.trim().length > 0 && age !== null && avatarId !== null && !submitting;

  async function handleCreate() {
    if (!canSubmit || age === null || avatarId === null) return;

    setSubmitting(true);
    setError(null);

    try {
      await addProfile({
        name: name.trim(),
        age,
        avatar_id: avatarId,
      });
      router.back();
    } catch {
      setError('Algo salió mal, intenta de nuevo');
      setSubmitting(false);
    }
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>¡Vamos a crear tu perfil!</Text>
      <Text style={styles.subtitle}>
        Escribe tu nombre, elige tu edad y un avatar
      </Text>

      {error && <Text style={styles.errorText}>{error}</Text>}

      {/* Name Input */}
      <Text style={styles.label}>Nombre</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={(text) => setName(text.slice(0, 30))}
        placeholder="¿Cómo te llamas?"
        placeholderTextColor="#BBB"
        autoCapitalize="words"
        autoCorrect={false}
        maxLength={30}
        editable={!submitting}
      />

      {/* Age Selector */}
      <Text style={styles.label}>Edad</Text>
      <View style={styles.ageRow}>
        {AGES.map((a) => (
          <TouchableOpacity
            key={a}
            style={[
              styles.agePill,
              age === a && styles.agePillSelected,
            ]}
            onPress={() => setAge(a)}
            disabled={submitting}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.agePillText,
                age === a && styles.agePillTextSelected,
              ]}
            >
              {a}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Avatar Picker */}
      <Text style={styles.label}>Avatar</Text>
      <View style={styles.avatarGrid}>
        {AVATAR_IDS.map((id) => (
          <TouchableOpacity
            key={id}
            style={styles.avatarOption}
            onPress={() => setAvatarId(id)}
            disabled={submitting}
            activeOpacity={0.7}
          >
            <AvatarCircle
              avatarId={id}
              size={72}
              selected={avatarId === id}
            />
          </TouchableOpacity>
        ))}
      </View>

      {/* Buttons */}
      <View style={styles.buttons}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => router.back()}
          disabled={submitting}
          activeOpacity={0.7}
        >
          <Text style={styles.cancelText}>Cancelar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.createButton,
            !canSubmit && styles.createButtonDisabled,
          ]}
          onPress={handleCreate}
          disabled={!canSubmit}
          activeOpacity={0.8}
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.createText}>Crear perfil →</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  container: {
    padding: 40,
    alignItems: 'center',
    paddingBottom: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: 8,
    textAlign: 'center',
    marginTop: 40,
  },
  subtitle: {
    fontSize: 18,
    color: '#888',
    marginBottom: 32,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#FF6B6B',
    marginBottom: 16,
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#555',
    alignSelf: 'flex-start',
    maxWidth: 600,
    width: '100%',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    fontSize: 22,
    color: '#1A1A2E',
    width: '100%',
    maxWidth: 600,
    borderWidth: 2,
    borderColor: '#E8E8E8',
  },
  ageRow: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
    justifyContent: 'center',
    maxWidth: 600,
  },
  agePill: {
    minWidth: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E8E8E8',
    paddingHorizontal: 8,
  },
  agePillSelected: {
    backgroundColor: '#6C63FF',
    borderColor: '#6C63FF',
  },
  agePillText: {
    fontSize: 22,
    fontWeight: '600',
    color: '#555',
  },
  agePillTextSelected: {
    color: '#FFFFFF',
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'center',
    maxWidth: 600,
    marginTop: 8,
  },
  avatarOption: {
    padding: 4,
  },
  buttons: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 40,
    width: '100%',
    maxWidth: 600,
    justifyContent: 'center',
  },
  cancelButton: {
    paddingVertical: 18,
    paddingHorizontal: 36,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#DDD',
    backgroundColor: '#FFFFFF',
  },
  cancelText: {
    fontSize: 18,
    color: '#666',
    fontWeight: '600',
  },
  createButton: {
    backgroundColor: '#6C63FF',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 48,
    flex: 1,
    alignItems: 'center',
  },
  createButtonDisabled: {
    backgroundColor: '#CCC',
  },
  createText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});
