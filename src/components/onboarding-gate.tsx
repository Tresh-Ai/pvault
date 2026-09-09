import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";
import { useOnboarding } from "@/hooks/useOnboarding";
import { applyTheme } from "@/lib/theme";

/** Routes that must render even before onboarding is finished. */
const BYPASS = ["/auth", "/auth/callback", "/oauth/openrouter"];

/** Shows onboarding once, then hands over to the app. */
export function OnboardingGate({ children }: { children: React.ReactNode }) {
  const { state, completeOnboarding } = useOnboarding();
  const [ready, setReady] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => setReady(true), []);

  if (!ready) return null;

  if (!state.isCompleted && !BYPASS.includes(pathname)) {

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
