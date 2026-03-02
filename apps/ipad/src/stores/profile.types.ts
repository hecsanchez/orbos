import type { AvatarId } from '../constants/avatars';

export interface LocalProfile {
  id: string;
  name: string;
  age: number;
  grade_target: number;
  interests: string[];
  avatar_id: AvatarId;
  accent_color: string;
  created_at: string;
  last_used_at: string;
  synced: boolean;
}

export interface CreateProfileInput {
  name: string;
  age: number;
  avatar_id: AvatarId;
}

export interface ProfileStore {
  profiles: LocalProfile[];
  activeProfile: LocalProfile | null;
  loading: boolean;
  loadProfiles: () => Promise<void>;
  addProfile: (input: CreateProfileInput) => Promise<LocalProfile>;
  setActiveProfile: (profile: LocalProfile) => Promise<void>;
  clearActiveProfile: () => void;
  syncProfiles: () => Promise<void>;
}
