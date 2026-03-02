export const AVATAR_IDS = [
  'fox',
  'owl',
  'bear',
  'rabbit',
  'turtle',
  'cat',
  'dog',
  'penguin',
] as const;

export type AvatarId = (typeof AVATAR_IDS)[number];

export const AVATAR_CONFIG: Record<AvatarId, { label: string; emoji: string; accentColor: string }> = {
  fox: { label: 'Zorro', emoji: '🦊', accentColor: '#FF6B35' },
  owl: { label: 'Búho', emoji: '🦉', accentColor: '#6C63FF' },
  bear: { label: 'Oso', emoji: '🐻', accentColor: '#8B5E3C' },
  rabbit: { label: 'Conejo', emoji: '🐰', accentColor: '#FF85A2' },
  turtle: { label: 'Tortuga', emoji: '🐢', accentColor: '#34C759' },
  cat: { label: 'Gato', emoji: '🐱', accentColor: '#FFB340' },
  dog: { label: 'Perro', emoji: '🐶', accentColor: '#5AC8FA' },
  penguin: { label: 'Pingüino', emoji: '🐧', accentColor: '#1A1A2E' },
};
