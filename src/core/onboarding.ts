import React, { createContext, useContext, useState } from 'react';

export interface OnboardingProfile {
  name: string;
  email: string;
  externalId: string;
  age: number;
  gender: string;
  career: string;
  semester: string;
  birthCity: string;
  lifestyle: {
    cleaningFrequency: string;
    isEarlyBird: boolean;
    useCommonAreasAtNight: boolean;
    sharedTasks: string[];
  };
  social: {
    hobbies: string[];
    musicGenres: string[];
    petPreference: string;
    smokingPreference: string;
    socialLevel: string;
  };
  financial: {
    budgetRange: { min: number; max: number };
    roomType: string;
    preferredCommonAreas: string[];
    expenseManagement: string;
    sharedItems: string[];
  };
}

export const emptyOnboardingProfile: OnboardingProfile = {
  name: '',
  email: '',
  externalId: '',
  age: 0,
  gender: '',
  career: '',
  semester: '',
  birthCity: '',
  lifestyle: {
    cleaningFrequency: '',
    isEarlyBird: false,
    useCommonAreasAtNight: false,
    sharedTasks: [],
  },
  social: {
    hobbies: [],
    musicGenres: [],
    petPreference: '',
    smokingPreference: '',
    socialLevel: '',
  },
  financial: {
    budgetRange: { min: 150, max: 250 },
    roomType: '',
    preferredCommonAreas: [],
    expenseManagement: '',
    sharedItems: [],
  },
};

interface OnboardingContextValue {
  formData: OnboardingProfile;
  updateFormData: (patch: Partial<OnboardingProfile>) => void;
  resetFormData: () => void;
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export const OnboardingProvider = ({ children }: { children: React.ReactNode }) => {
  const [formData, setFormData] = useState<OnboardingProfile>(emptyOnboardingProfile);

  const updateFormData = (patch: Partial<OnboardingProfile>) => {
    setFormData(current => ({ ...current, ...patch }));
  };

  const resetFormData = () => setFormData(emptyOnboardingProfile);

  return React.createElement(
    OnboardingContext.Provider,
    { value: { formData, updateFormData, resetFormData } },
    children
  );
};

export function useOnboarding(): OnboardingContextValue {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error('useOnboarding debe usarse dentro de OnboardingProvider');
  return ctx;
}

export function buildOnboardingPayload(profile: OnboardingProfile) {
  return {
    identity: {
      email: profile.email,
      externalId: profile.externalId,
    },
    profile: {
      fullName: profile.name,
      age: Number(profile.age) || 0,
      gender: profile.gender,
      birthCity: profile.birthCity,
      career: profile.career,
      currentSemester: Number(profile.semester) || 0,
    },
    lifestyle: profile.lifestyle,
    social: profile.social,
    financial: profile.financial,
  };
}
