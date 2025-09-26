import { useState, useEffect } from "react";
import { Project } from "@/lib/database";
import { ProjectsList } from "./ProjectsList";
import { ProjectView } from "./ProjectView";
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";
import { useOnboarding } from "@/hooks/useOnboarding";

const Index = () => {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
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
  };

  // Show onboarding if not completed
  if (!onboardingState.isCompleted) {
    return <OnboardingFlow onComplete={handleOnboardingComplete} />;
  }

  return (
    <div className="min-h-screen bg-background">
      {selectedProject ? (
        <ProjectView 
          project={selectedProject} 
          onBack={() => setSelectedProject(null)} 
        />
      ) : (
        <ProjectsList onProjectSelect={setSelectedProject} />
      )}
    </div>
  );
};

export default Index;
