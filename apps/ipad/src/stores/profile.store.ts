import { create } from 'zustand';
import { getDatabase } from '../db/sqlite';
import { apiClient } from '../services/api-client';
import { AVATAR_CONFIG, type AvatarId } from '../constants/avatars';
import type { LocalProfile, CreateProfileInput, ProfileStore } from './profile.types';

function deriveGradeTarget(age: number): number {
  if (age <= 5) return 1;
  if (age <= 6) return 2;
  if (age <= 7) return 3;
  if (age <= 8) return 4;
  if (age <= 9) return 5;
  return 6; // 10-11
}

function defaultInterests(age: number): string[] {
  if (age <= 6) return ['animales', 'colores'];
  if (age <= 9) return ['dinosaurios', 'espacio'];
  return ['naturaleza', 'tecnología'];
}

export const useProfileStore = create<ProfileStore>((set, get) => ({
  profiles: [],
  activeProfile: null,
  loading: false,

  async loadProfiles() {
    set({ loading: true });
    try {
      const db = getDatabase();
      const rows = await db.getAllAsync<{
        id: string;
        name: string;
        age: number;
        grade_target: number;
        interests: string;
        avatar_id: string;
        accent_color: string;
        created_at: string;
        last_used_at: string;
        synced: number;
      }>('SELECT * FROM profiles ORDER BY last_used_at DESC');

      const profiles: LocalProfile[] = rows.map((row) => ({
        id: row.id,
        name: row.name,
        age: row.age,
        grade_target: row.grade_target,
        interests: JSON.parse(row.interests),
        avatar_id: row.avatar_id as AvatarId,
        accent_color: row.accent_color,
        created_at: row.created_at,
        last_used_at: row.last_used_at,
        synced: row.synced === 1,
      }));

      set({ profiles, loading: false });
    } catch (err) {
      console.error('Failed to load profiles:', err);
      set({ loading: false });
    }
  },

  async addProfile(input: CreateProfileInput) {
    const gradeTarget = deriveGradeTarget(input.age);
    const interests = defaultInterests(input.age);
    const accentColor = AVATAR_CONFIG[input.avatar_id].accentColor;
    const now = new Date().toISOString();

    // POST to API to get a real ID
    let id: string;
    let synced = false;
    try {
      const response = await apiClient.createStudent({
        name: input.name,
        age: input.age,
        grade_target: gradeTarget,
        interests,
      });
      id = response.id;
      synced = true;
    } catch {
      // Offline — generate a local UUID
      id = `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    }

    const profile: LocalProfile = {
      id,
      name: input.name,
      age: input.age,
      grade_target: gradeTarget,
      interests,
      avatar_id: input.avatar_id,
      accent_color: accentColor,
      created_at: now,
      last_used_at: now,
      synced,
    };

    // Store in SQLite
    const db = getDatabase();
    await db.runAsync(
      `INSERT INTO profiles (id, name, age, grade_target, interests, avatar_id, accent_color, created_at, last_used_at, synced)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        profile.id,
        profile.name,
        profile.age,
        profile.grade_target,
        JSON.stringify(profile.interests),
        profile.avatar_id,
        profile.accent_color,
        profile.created_at,
        profile.last_used_at,
        profile.synced ? 1 : 0,
      ],
    );

    set({ profiles: [profile, ...get().profiles] });
    return profile;
  },

  async setActiveProfile(profile: LocalProfile) {
    const now = new Date().toISOString();
    const updated = { ...profile, last_used_at: now };

    // Update last_used_at in SQLite
    const db = getDatabase();
    await db.runAsync('UPDATE profiles SET last_used_at = ? WHERE id = ?', [
      now,
      profile.id,
    ]);

    // Update in profiles list
    const profiles = get().profiles.map((p) =>
      p.id === profile.id ? updated : p,
    );

    set({ activeProfile: updated, profiles });
  },

  clearActiveProfile() {
    set({ activeProfile: null });
  },

  async syncProfiles() {
    try {
      const remoteStudents = await apiClient.getStudents();
      const db = getDatabase();
      const { profiles } = get();

      for (const remote of remoteStudents) {
        const local = profiles.find((p) => p.id === remote.id);
        if (local) {
          // API wins for core fields, local wins for avatar/accent
          await db.runAsync(
            'UPDATE profiles SET name = ?, age = ?, grade_target = ?, interests = ?, synced = 1 WHERE id = ?',
            [
              remote.name,
              remote.age,
              remote.grade_target,
              JSON.stringify(remote.interests),
              remote.id,
            ],
          );
        }
      }

      // Reload from DB to get merged state
      await get().loadProfiles();
    } catch (err) {
      console.warn('Profile sync failed:', err);
    }
  },
}));
