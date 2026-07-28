import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface WelcomeScreenProps {
  onGetStarted: () => void;
}

export function WelcomeScreen({ onGetStarted }: WelcomeScreenProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      {/* subtle dot grid backdrop */}
      <div className="absolute inset-0 dot-grid opacity-40 pointer-events-none" />

      {/* top bar */}
      <div className="relative px-6 pt-8 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary" />
          <span className="text-xs font-medium tracking-widest uppercase text-muted-foreground">
            PVault
          </span>
        </div>
        <span className="text-xs text-muted-foreground">v1.0</span>
      </div>

      {/* main */}
      <div className="relative flex-1 flex flex-col justify-center px-6 max-w-md mx-auto w-full">
        <div className="mb-3 inline-flex items-center gap-2 self-start rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          Offline-first · Private
        </div>

        <h1 className="text-5xl sm:text-6xl font-semibold leading-[1.02] tracking-tight mb-6">
          Your AI memory,
          <br />
          <span className="text-primary">organized.</span>
        </h1>

        <p className="text-lg text-muted-foreground leading-relaxed mb-10 max-w-sm">
          Save prompts, tools, and workflows by project. Fast to find,
          faster to reuse.
        </p>

        <Button
          onClick={onGetStarted}
          size="lg"
          className="h-14 rounded-full px-6 text-base font-medium w-full sm:w-auto sm:self-start group"
        >
          Get started
          <ArrowRight className="h-4 w-4 ml-2 transition-transform group-hover:translate-x-1" />
        </Button>
      </div>

      {/* footer */}
      <div className="relative px-6 pb-8 text-xs text-muted-foreground text-center">
        No account. No cloud. Just your vault.
      </div>
    </div>
  );
}
