import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Sparkle, GitBranch, MessageSquare, X } from "lucide-react";

export const APP_VERSION = "1.1";
const SEEN_KEY = "pvault_seen_version";

/** True for people who already used PVault before this version shipped. */
function shouldShow() {
  try {
    const seen = localStorage.getItem(SEEN_KEY);
    if (seen === APP_VERSION) return false;
    // Brand new users go through onboarding instead, they don't need an update note.
    const isExisting = localStorage.getItem("pvault_onboarding_completed") !== null;
    return isExisting;
  } catch {
    return false;
  }
}

const HIGHLIGHTS = [
  {
    icon: Sparkle,
    title: "PVault AI",
    body: "Connect your own OpenRouter key and run any saved prompt without leaving the app.",
  },
  {
    icon: MessageSquare,
    title: "Chats per project",
    body: "Every run is saved in the project's Chats tab, so you can find where a prompt was used.",
  },
  {
    icon: GitBranch,
    title: "Flows in AI",
    body: "Play a flow and hand the whole sequence straight to the AI, step by step.",
  },
];

export function UpdateDialog() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (shouldShow()) setOpen(true);
  }, []);

  const dismiss = () => {
    try {
      localStorage.setItem(SEEN_KEY, APP_VERSION);
    } catch {
      /* ignore */
    }
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? setOpen(true) : dismiss())}>
      <DialogContent className="max-w-sm rounded-3xl p-0 overflow-hidden [&>button]:hidden">
        <div className="p-6">
          <div className="flex items-start justify-between mb-5">
            <div>
              <p className="text-[10px] font-medium tracking-widest uppercase text-muted-foreground">
                Version {APP_VERSION}
              </p>
              <h2 className="text-2xl font-semibold tracking-tight mt-1">PVault got an AI</h2>
            </div>
            <button
              onClick={dismiss}
              aria-label="Close"
              className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-4">
            {HIGHLIGHTS.map(({ icon: Icon, title, body }) => (
              <div key={title} className="flex gap-3">
                <div className="shrink-0 w-9 h-9 rounded-xl bg-secondary border border-border flex items-center justify-center">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium">{title}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{body}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 space-y-2">
            <Button
              className="w-full rounded-full h-11"
              onClick={() => {
                dismiss();
                navigate("/ai");
              }}
            >
              Set up PVault AI
            </Button>
            <button
              onClick={() => {
                dismiss();
                navigate("/changelog");
              }}
              className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
            >
              See the full changelog
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
