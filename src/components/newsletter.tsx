import { useState } from "react";
import { X, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

const DISMISS_KEY = "pvault_newsletter_dismissed";

interface NewsletterProps {
  /** compact inline variant used inside settings */
  variant?: "card" | "inline";
  dismissible?: boolean;
}

export function Newsletter({ variant = "card", dismissible = true }: NewsletterProps) {
  const [dismissed, setDismissed] = useState(
    () => dismissible && localStorage.getItem(DISMISS_KEY) === "1"
  );

  if (dismissed) return null;

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
  };

  return (
    <section
      aria-labelledby="newsletter-heading"
      className={
        variant === "card"
          ? "relative rounded-2xl border border-border bg-card p-5"
          : "relative rounded-2xl bg-secondary p-5"
      }
    >
      {dismissible && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDismiss}
          aria-label="Dismiss newsletter"
          className="absolute right-2 top-2 h-8 w-8 p-0 rounded-full text-muted-foreground"
        >
          <X className="h-4 w-4" />
        </Button>
      )}

      <div className="flex items-center gap-2 mb-2">
        <Mail className="h-4 w-4 text-primary" />
        <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Free to use
        </span>
      </div>

      <h2 id="newsletter-heading" className="text-lg font-semibold tracking-tight">
        PVault is free to use
      </h2>
      <p className="text-sm text-muted-foreground mt-1 mb-4 max-w-sm">
        Join the newsletter for the top AI products, prompt drops and new tools
        from the founder - straight to your inbox.
      </p>

      <div className="overflow-hidden rounded-xl border border-border bg-background">
        <iframe
          src="https://treshbaba.substack.com/embed"
          title="Subscribe to the PVault newsletter on Substack"
          width="100%"
          height="150"
          loading="lazy"
          scrolling="no"
          className="w-full block border-0"
        />
      </div>
    </section>
  );
}
