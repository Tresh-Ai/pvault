import { useEffect, useState } from "react";
import { Braces } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { humanizeVariable } from "@/lib/variables";

interface VariablesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  names: string[];
  /** Label for the confirm button, e.g. "Run in PVault AI". */
  confirmLabel?: string;
  onConfirm: (values: Record<string, string>) => void;
}

/**
 * Asks for {{variable}} values right before a prompt runs, so the editor stays
 * clean and the saved prompt keeps its placeholders.
 */
export function VariablesDialog({
  open,
  onOpenChange,
  names,
  confirmLabel = "Run",
  onConfirm,
}: VariablesDialogProps) {
  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) setValues({});
  }, [open, names.join("|")]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const filled = Object.fromEntries(Object.entries(values).filter(([, v]) => v && v.trim()));
    onOpenChange(false);
    onConfirm(filled);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[92vw] max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Braces className="h-4 w-4 text-primary" />
            Fill variables
          </DialogTitle>
          <DialogDescription>
            This prompt has placeholders. Fill them in for this run, the saved prompt stays untouched.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-3">
          {names.map((name) => (
            <label key={name} className="block">
              <span className="mb-1 block text-[11px] uppercase tracking-wider text-muted-foreground">
                {humanizeVariable(name)}
              </span>
              <input
                autoFocus={name === names[0]}
                value={values[name] || ""}
                onChange={(e) => setValues((v) => ({ ...v, [name]: e.target.value }))}
                placeholder={`{{${name}}}`}
                className="w-full rounded-md bg-secondary px-3 py-2 text-sm placeholder:text-muted-foreground/60 outline-none"
              />
            </label>
          ))}

          <div className="flex gap-2 pt-1">
            <Button type="submit" className="flex-1 rounded-full">
              {confirmLabel}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="rounded-full"
              onClick={() => {
                onOpenChange(false);
                onConfirm({});
              }}
            >
              Skip
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
