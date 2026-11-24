import { useMemo, useState } from "react";
import { Check, Copy, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { shareUrl, SharedPrompt } from "@/lib/share";
import { extractVariables } from "@/lib/variables";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prompt: SharedPrompt;
}

export function SharePromptDialog({ open, onOpenChange, prompt }: Props) {
  const [copied, setCopied] = useState(false);
  const url = useMemo(() => (open ? shareUrl(prompt) : ""), [open, prompt]);
  const vars = useMemo(() => extractVariables(prompt.content).length, [prompt.content]);

  const copy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const nativeShare = () =>
    navigator.share?.({ title: prompt.title || "Prompt", text: "A prompt shared from PVault", url }).catch(() => {});

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[92vw] max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Share2 className="h-4 w-4 text-primary" /> Share prompt
          </DialogTitle>
          <DialogDescription>
            Anyone with this link can view and copy this prompt.
            {vars > 0 && ` They'll be asked to fill ${vars} variable${vars > 1 ? "s" : ""} before copying.`}
          </DialogDescription>
        </DialogHeader>
        <div className="rounded-md bg-secondary px-3 py-2 text-xs text-muted-foreground truncate">{url}</div>
        <p className="text-[11px] text-muted-foreground">
          The link is a snapshot. Later edits are not included, so share again after changing it.
        </p>
        <div className="flex gap-2">
          <Button onClick={copy} className="flex-1 rounded-full">
            {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
            {copied ? "Link copied" : "Copy link"}
          </Button>
          {typeof navigator !== "undefined" && "share" in navigator && (
            <Button variant="secondary" onClick={nativeShare} className="rounded-full">
              Share
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
