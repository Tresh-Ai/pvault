import { useState, useEffect } from 'react';

const ONBOARDING_KEY = 'pvault_onboarding_completed';
const ONBOARDING_VERSION = '1.0';

export interface OnboardingState {
  isCompleted: boolean;
  currentStep: number;
  selectedTheme: 'light' | 'dark' | 'system';
}

export function useOnboarding() {
  const [state, setState] = useState<OnboardingState>({
    isCompleted: false,
    currentStep: 0,
    selectedTheme: 'light',
  });

  useEffect(() => {
    const saved = localStorage.getItem(ONBOARDING_KEY);
    if (saved === ONBOARDING_VERSION) {
      setState(prev => ({ ...prev, isCompleted: true }));
    }
  }, []);

  const completeOnboarding = (theme: 'light' | 'dark' | 'system') => {
    localStorage.setItem(ONBOARDING_KEY, ONBOARDING_VERSION);
    setState(prev => ({ ...prev, isCompleted: true, selectedTheme: theme }));
  };

  const nextStep = () => {
    setState(prev => ({ ...prev, currentStep: prev.currentStep + 1 }));
  };

  const prevStep = () => {
    setState(prev => ({ ...prev, currentStep: Math.max(0, prev.currentStep - 1) }));
  };

  const setTheme = (theme: 'light' | 'dark' | 'system') => {
    setState(prev => ({ ...prev, selectedTheme: theme }));
  };

  return {
    state,
    completeOnboarding,
    nextStep,
    prevStep,
    setTheme,
  };
}