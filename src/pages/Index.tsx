import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ProjectsList } from "./ProjectsList";
import { Settings } from "./Settings";
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";
import { useOnboarding } from "@/hooks/useOnboarding";
import { ProductTour, hasSeenTour } from "@/components/product-tour";
import { applyTheme } from "@/lib/theme";
import { UpdateDialog } from "@/components/update-dialog";


const Index = () => {
  const navigate = useNavigate();
  const [showSettings, setShowSettings] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const { state: onboardingState, completeOnboarding } = useOnboarding();

  const handleOnboardingComplete = (theme: 'light' | 'dark' | 'system') => {
    completeOnboarding(theme);
    applyTheme(theme);
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
