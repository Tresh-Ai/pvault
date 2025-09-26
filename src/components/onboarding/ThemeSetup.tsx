import { Button } from "@/components/ui/button";
import { Sun, Moon, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";

interface ThemeSetupProps {
  selectedTheme: 'light' | 'dark' | 'system';
  onThemeSelect: (theme: 'light' | 'dark' | 'system') => void;
  onComplete: () => void;
  onBack: () => void;
}

const themes = [
  {
    id: 'light' as const,
    label: 'Light',
    icon: Sun,
    description: 'Clean and bright',
    preview: 'bg-white border border-gray-200',
  },
  {
    id: 'dark' as const,
    label: 'Dark',
    icon: Moon,
    description: 'Easy on the eyes',
    preview: 'bg-gray-900 border border-gray-700',
  },
  {
    id: 'system' as const,
    label: 'Auto',
    icon: Monitor,
    description: 'Matches your device',
    preview: 'bg-gradient-to-br from-white to-gray-900 border border-gray-400',
  },
];

export function ThemeSetup({ selectedTheme, onThemeSelect, onComplete, onBack }: ThemeSetupProps) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold mb-2">Choose Your Theme</h2>
          <p className="text-muted-foreground">
            Pick a theme that feels right for you. You can change this later in settings.
          </p>
        </div>

        <div className="space-y-3 mb-8">
          {themes.map((theme) => {
            const Icon = theme.icon;
            const isSelected = selectedTheme === theme.id;
            
            return (
              <button
                key={theme.id}
                onClick={() => onThemeSelect(theme.id)}
                className={cn(
                  "w-full p-4 rounded-lg border-2 transition-all",
                  "hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20",
                  isSelected ? "border-primary bg-primary/5" : "border-border"
                )}
              >
                <div className="flex items-center gap-4">
                  <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center", theme.preview)}>
                    <Icon className={cn("h-6 w-6", theme.id === 'dark' ? 'text-white' : 'text-gray-700')} />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-semibold">{theme.label}</div>
                    <div className="text-sm text-muted-foreground">{theme.description}</div>
                  </div>
                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-white" />
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={onBack} className="flex-1">
            Back
          </Button>
          <Button onClick={onComplete} className="flex-1">
            Complete Setup
          </Button>
        </div>
      </div>
    </div>
  );
}