export type AgeGroup = 'young' | 'middle' | 'older';

export function getAgeGroup(age: number): AgeGroup {
  if (age <= 6) return 'young';
  if (age <= 9) return 'middle';
  return 'older';
}

export const AGE_THEME = {
  young: {
    fontSize: { instruction: 28, body: 24, button: 26 },
    iconSize: 64,
    showAudioButton: true,
    textDensity: 'minimal' as const,
  },
  middle: {
    fontSize: { instruction: 22, body: 18, button: 20 },
    iconSize: 48,
    showAudioButton: true,
    textDensity: 'moderate' as const,
  },
  older: {
    fontSize: { instruction: 20, body: 16, button: 18 },
    iconSize: 36,
    showAudioButton: false,
    textDensity: 'full' as const,
  },
} as const;
