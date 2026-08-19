import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ProjectsList } from "./ProjectsList";
import { Settings } from "./Settings";
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";
import { useOnboarding } from "@/hooks/useOnboarding";
import { ProductTour, hasSeenTour } from "@/components/product-tour";

const Index = () => {
  const navigate = useNavigate();
  const [showSettings, setShowSettings] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const { state: onboardingState, completeOnboarding } = useOnboarding();

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    const savedTheme = localStorage.getItem('pvault_settings');
    
    if (savedTheme) {
      try {
        const settings = JSON.parse(savedTheme);
        const theme = settings[0]?.theme || 'light';
        
        if (theme === 'dark') {
          root.classList.add('dark');
        } else if (theme === 'system') {
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          if (prefersDark) root.classList.add('dark');
        }
      } catch (error) {
        console.error('Failed to load theme:', error);
      }
    }
  }, []);

  const handleOnboardingComplete = (theme: 'light' | 'dark' | 'system') => {
    // Apply theme immediately
    const root = document.documentElement;
    root.classList.remove('dark');
    
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) root.classList.add('dark');
    }
    
    completeOnboarding(theme);
    setShowTour(true);
  };

  // Existing users who completed onboarding earlier still get the tour once
  useEffect(() => {
    if (onboardingState.isCompleted && !hasSeenTour()) setShowTour(true);
  }, [onboardingState.isCompleted]);

  // Show onboarding if not completed
  if (!onboardingState.isCompleted) {
    return <OnboardingFlow onComplete={handleOnboardingComplete} />;
  }

  return (
    <div className="min-h-screen bg-background">
      {showSettings ? (
        <Settings onBack={() => setShowSettings(false)} />
      ) : (
        <ProjectsList 
          onProjectSelect={(project) => navigate(`/project/${project.id}`)}
          onSettingsClick={() => setShowSettings(true)}
        />
      )}
      {showTour && !showSettings && <ProductTour onFinish={() => setShowTour(false)} />}
    </div>
  );
};

export default Index;
