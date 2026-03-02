import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AVATAR_CONFIG, type AvatarId } from '../constants/avatars';

export interface AvatarCircleProps {
  avatarId: AvatarId;
  name?: string;
  size: number;
  selected?: boolean;
}

export function AvatarCircle({ avatarId, name, size, selected }: AvatarCircleProps) {
  const config = AVATAR_CONFIG[avatarId];
  const letter = name ? name.charAt(0).toUpperCase() : config.label.charAt(0);

  return (
    <View
      style={[
        styles.outer,
        {
          width: size + 8,
          height: size + 8,
          borderRadius: (size + 8) / 2,
          borderColor: selected ? config.accentColor : 'transparent',
          borderWidth: selected ? 3 : 0,
        },
      ]}
    >
      <View
        style={[
          styles.circle,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: config.accentColor + '20',
          },
        ]}
      >
        <Text style={[styles.emoji, { fontSize: size * 0.45 }]}>
          {config.emoji}
        </Text>
        <Text
          style={[
            styles.letter,
            { fontSize: size * 0.18, color: config.accentColor },
          ]}
        >
          {letter}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  circle: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  emoji: {
    marginBottom: 2,
  },
  letter: {
    fontWeight: '700',
  },
});
