import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Share, X, Plus } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "pvault_install_dismissed";

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

export function InstallPrompt({ compact = false }: { compact?: boolean }) {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(DISMISS_KEY) === "1");
  const [showIOSHelp, setShowIOSHelp] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (dismissed || isStandalone()) return null;

  const install = async () => {
    if (deferred) {
      await deferred.prompt();
      const { outcome } = await deferred.userChoice;
      if (outcome === "accepted") setDismissed(true);
      setDeferred(null);
      return;
    }
    setShowIOSHelp(true);
  };

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 shrink-0 rounded-xl bg-secondary border border-border flex items-center justify-center">
          <Download className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold tracking-tight">Install PVault as an app</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Add it to your home screen for full-screen access and true offline use - your vault
            works with no connection at all.
          </p>

          {showIOSHelp && (
            <div className="mt-3 rounded-xl bg-secondary p-3 text-xs text-muted-foreground space-y-1.5">
              {isIOS() ? (
                <>
                  <p className="inline-flex items-center gap-1.5">
                    1. Tap <Share className="h-3.5 w-3.5" /> Share in Safari
                  </p>
                  <p className="inline-flex items-center gap-1.5">
                    2. Choose <Plus className="h-3.5 w-3.5" /> Add to Home Screen
                  </p>
                  <p>3. Tap Add - done.</p>
                </>
              ) : (
                <p>
                  Open your browser menu (⋮) and choose <strong>Install app</strong> or{" "}
                  <strong>Add to Home screen</strong>.
                </p>
              )}
            </div>
          )}

          {!compact && (
            <div className="flex gap-2 mt-3">
              <Button onClick={install} size="sm" className="h-9 rounded-full px-4 text-xs">
                <Download className="h-3.5 w-3.5 mr-1.5" />
                Install app
              </Button>
              <Button
                onClick={dismiss}
                variant="ghost"
                size="sm"
                className="h-9 rounded-full px-3 text-xs text-muted-foreground"
              >
                Not now
              </Button>
            </div>
          )}
        </div>
        <button
          onClick={dismiss}
          aria-label="Dismiss"
          className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
