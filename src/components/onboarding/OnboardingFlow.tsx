import { useState } from "react";
import { WelcomeScreen } from "./WelcomeScreen";
import { OnboardingSlides } from "./OnboardingSlides";
import { ThemeSetup } from "./ThemeSetup";
import { useOnboarding } from "@/hooks/useOnboarding";
import { dbHelpers } from "@/lib/database";

interface OnboardingFlowProps {
  onComplete: (theme: 'light' | 'dark' | 'system') => void;
}

type OnboardingStep = 'welcome' | 'slides' | 'theme';

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome');
  const { state, setTheme } = useOnboarding();

  const handleStepComplete = async (step: OnboardingStep) => {
    switch (step) {
      case 'welcome':
        setCurrentStep('slides');
        break;
      case 'slides':
        setCurrentStep('theme');
        break;
      case 'theme':
        // Apply theme and complete onboarding
        await dbHelpers.updateSettings({ theme: state.selectedTheme });
        onComplete(state.selectedTheme);
        break;
    }
  };

  const handleStepBack = (step: OnboardingStep) => {
    switch (step) {
      case 'slides':
        setCurrentStep('welcome');
        break;
      case 'theme':
        setCurrentStep('slides');
        break;
    }
  };

  switch (currentStep) {
    case 'welcome':
      return <WelcomeScreen onGetStarted={() => handleStepComplete('welcome')} />;
    
    case 'slides':
      return (
        <OnboardingSlides
          onComplete={() => handleStepComplete('slides')}
          onBack={() => handleStepBack('slides')}
        />
      );
    
    case 'theme':
      return (
        <ThemeSetup
          selectedTheme={state.selectedTheme}
          onThemeSelect={setTheme}
          onComplete={() => handleStepComplete('theme')}
          onBack={() => handleStepBack('theme')}
        />
      );
    
    default:
      return null;
  }
}