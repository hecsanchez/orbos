import React, { createContext, useContext, useMemo } from 'react';
import { useProfileStore } from '../stores/profile.store';
import { getAgeGroup, type AgeGroup } from '../utils/age-theme';
import type { LocalProfile } from '../stores/profile.types';

interface ProfileContextValue {
  activeProfile: LocalProfile | null;
  ageGroup: AgeGroup;
}

const ProfileContext = createContext<ProfileContextValue>({
  activeProfile: null,
  ageGroup: 'middle',
});

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const activeProfile = useProfileStore((s) => s.activeProfile);

  const value = useMemo<ProfileContextValue>(
    () => ({
      activeProfile,
      ageGroup: activeProfile ? getAgeGroup(activeProfile.age) : 'middle',
    }),
    [activeProfile],
  );

  return (
    <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
  );
}

export function useProfile(): ProfileContextValue {
  return useContext(ProfileContext);
}
