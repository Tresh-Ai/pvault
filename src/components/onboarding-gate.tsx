import { useEffect, useState } from "react";
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";
import { useOnboarding } from "@/hooks/useOnboarding";
import { applyTheme } from "@/lib/theme";

/** Shows onboarding once, then hands over to the app. */
export function OnboardingGate({ children }: { children: React.ReactNode }) {
  const { state, completeOnboarding } = useOnboarding();
  const [ready, setReady] = useState(false);

  useEffect(() => setReady(true), []);

  if (!ready) return null;

  if (!state.isCompleted) {
    return (
      <OnboardingFlow
        onComplete={(theme) => {
          completeOnboarding(theme);
          applyTheme(theme);
        }}
      />
    );
  }

  return <>{children}</>;
}
