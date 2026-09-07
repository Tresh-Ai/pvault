import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Plus, Share, WifiOff, Zap, Lock } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const SEEN_KEY = "pvault_install_seen";
export const INSTALL_EVENT = "pvault:open-install";

/** Ask anywhere in the app to show the install explainer. */
export function openInstallDialog() {
  window.dispatchEvent(new Event(INSTALL_EVENT));
}

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent);

export function InstallDialog() {
  const [open, setOpen] = useState(false);
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [showSteps, setShowSteps] = useState(false);

  useEffect(() => {
    const capture = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const manual = () => {
      setShowSteps(false);
      setOpen(true);
    };
    window.addEventListener("beforeinstallprompt", capture);
    window.addEventListener(INSTALL_EVENT, manual);
    return () => {
      window.removeEventListener("beforeinstallprompt", capture);
      window.removeEventListener(INSTALL_EVENT, manual);
    };
  }, []);

  // Show it once, a moment after the app settles.
  useEffect(() => {
    if (isStandalone() || localStorage.getItem(SEEN_KEY) === "1") return;
    const t = setTimeout(() => {
      localStorage.setItem(SEEN_KEY, "1");
      setOpen(true);
    }, 6000);
    return () => clearTimeout(t);
  }, []);

  const install = async () => {
    if (deferred) {
      await deferred.prompt();
      const { outcome } = await deferred.userChoice;
      setDeferred(null);
      if (outcome === "accepted") setOpen(false);
      return;
    }
    setShowSteps(true);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-sm rounded-2xl">
        <DialogHeader>
          <div className="mx-auto mb-2 h-11 w-11 rounded-xl bg-secondary flex items-center justify-center">
            <Download className="h-5 w-5" />
          </div>
          <DialogTitle className="text-center">Install PVault</DialogTitle>
          <DialogDescription className="text-center">
            PVault works best as an installed app. Add it to your home screen and it opens
            full screen, instantly, with your vault available offline.
          </DialogDescription>
        </DialogHeader>

        <ul className="space-y-2.5 text-sm text-muted-foreground">
          <li className="flex items-center gap-2.5">
            <WifiOff className="h-4 w-4 shrink-0" /> Works with no connection at all
          </li>
          <li className="flex items-center gap-2.5">
            <Zap className="h-4 w-4 shrink-0" /> Opens faster, no browser bars
          </li>
          <li className="flex items-center gap-2.5">
            <Lock className="h-4 w-4 shrink-0" /> Your notes stay on your device
          </li>
        </ul>

        {showSteps && (
          <div className="rounded-xl bg-secondary p-3 text-xs text-muted-foreground space-y-1.5">
            {isIOS() ? (
              <>
                <p className="inline-flex items-center gap-1.5">
                  1. Tap <Share className="h-3.5 w-3.5" /> Share in Safari
                </p>
                <p className="inline-flex items-center gap-1.5">
                  2. Choose <Plus className="h-3.5 w-3.5" /> Add to Home Screen
                </p>
                <p>3. Tap Add and you are done.</p>
              </>
            ) : (
              <p>
                Open your browser menu and choose <strong>Install app</strong> or{" "}
                <strong>Add to Home screen</strong>.
              </p>
            )}
          </div>
        )}

        <div className="flex flex-col gap-2 pt-1">
          <Button onClick={install} className="rounded-full h-11">
            <Download className="h-4 w-4 mr-2" />
            Install app
          </Button>
          <Button
            variant="ghost"
            className="rounded-full h-10 text-muted-foreground"
            onClick={() => setOpen(false)}
          >
            Maybe later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
