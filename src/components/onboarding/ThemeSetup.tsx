import { Button } from "@/components/ui/button";
import { Sun, Moon, Monitor, Check, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface ThemeSetupProps {
  selectedTheme: 'light' | 'dark' | 'system';
  onThemeSelect: (theme: 'light' | 'dark' | 'system') => void;
  onComplete: () => void;
  onBack: () => void;
}

const themes = [
  { id: 'light' as const, label: 'Light', icon: Sun, desc: 'Clean and bright' },
  { id: 'dark' as const, label: 'Dark', icon: Moon, desc: 'Easy on the eyes' },
  { id: 'system' as const, label: 'System', icon: Monitor, desc: 'Match your device' },
];

export function ThemeSetup({ selectedTheme, onThemeSelect, onComplete, onBack }: ThemeSetupProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="px-6 pt-8">
        <button
          onClick={onBack}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
      </div>

      <div className="flex-1 flex flex-col justify-center px-6 max-w-md mx-auto w-full">
        <span className="text-xs font-medium tracking-widest uppercase text-muted-foreground mb-3">
          Last step
        </span>
        <h2 className="text-4xl sm:text-5xl font-semibold leading-[1.05] tracking-tight mb-4">
          Pick your look.
        </h2>
        <p className="text-lg text-muted-foreground mb-10">
          You can change this anytime in settings.
        </p>

        <div className="space-y-3 mb-10">
          {themes.map((theme) => {
            const Icon = theme.icon;
            const isSelected = selectedTheme === theme.id;

            return (
              <button
                key={theme.id}
                onClick={() => onThemeSelect(theme.id)}
                className={cn(
                  "w-full p-4 rounded-2xl border transition-all text-left flex items-center gap-4",
                  "hover:border-foreground/30",
                  isSelected
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                    : "border-border bg-card"
                )}
              >
                <div
                  className={cn(
                    "w-11 h-11 rounded-xl flex items-center justify-center border",
                    isSelected ? "bg-primary text-primary-foreground border-primary" : "bg-secondary border-border"
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="font-medium">{theme.label}</div>
                  <div className="text-sm text-muted-foreground">{theme.desc}</div>
                </div>
                {isSelected && (
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                    <Check className="h-3.5 w-3.5 text-primary-foreground" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-6 pb-10 max-w-md mx-auto w-full">
        <Button onClick={onComplete} size="lg" className="w-full h-14 rounded-full text-base">
          Enter PVault
        </Button>
      </div>
    </div>
  );
}
