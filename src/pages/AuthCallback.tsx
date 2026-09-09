import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

/** Finishes a redirect-based sign-in (Google), then sends the user to Settings. */
export default function AuthCallback() {
  const navigate = useNavigate();
  const [state, setState] = useState<"working" | "done" | "error">("working");
  const [message, setMessage] = useState("Finishing sign-in...");

  useEffect(() => {
    let cancelled = false;

    const finish = async () => {
      try {
        const url = new URL(window.location.href);
        const hash = new URLSearchParams(url.hash.replace(/^#/, ""));
        const errorText =
          hash.get("error_description") || url.searchParams.get("error_description") ||
          hash.get("error") || url.searchParams.get("error");
        if (errorText) throw new Error(errorText);

        const accessToken = hash.get("access_token");
        const refreshToken = hash.get("refresh_token");
        const code = url.searchParams.get("code");

        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) throw error;
        } else if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        } else {
          const { data: existing } = await supabase.auth.getSession();
          if (!existing.session) {
            throw new Error(
              "The sign-in link was missing or has already been used. Start the sign-in again.",
            );
          }
        }


        // Clear tokens from the address bar so they are never left in history.
        window.history.replaceState({}, "", "/auth/callback");

        const { data, error: userError } = await supabase.auth.getUser();
        if (userError || !data.user) throw userError ?? new Error("No session was created.");

        if (cancelled) return;
        setState("done");
        setMessage("You are signed in. Taking you to settings...");
        setTimeout(() => navigate("/settings", { replace: true }), 700);
      } catch (error) {
        if (cancelled) return;
        setState("error");
        setMessage(
          error instanceof Error && error.message
            ? error.message
            : "We could not finish signing you in. Please try again.",
        );
      }
    };

    void finish();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const Icon = state === "working" ? Loader2 : state === "done" ? Check : X;

  return (
    <div className="min-h-[100dvh] bg-background flex items-center justify-center px-6">
      <div className="max-w-sm text-center">
        <div className="mx-auto mb-4 h-11 w-11 rounded-2xl border border-border bg-secondary flex items-center justify-center">
          <Icon className={`h-5 w-5 ${state === "working" ? "animate-spin" : "text-primary"}`} />
        </div>
        <h1 className="text-lg font-semibold tracking-tight">
          {state === "error" ? "Sign-in failed" : "Signing you in"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{message}</p>
        {state === "error" && (
          <div className="mt-5 flex items-center justify-center gap-2">
            <Button className="rounded-full" onClick={() => navigate("/auth", { replace: true })}>
              Try again
            </Button>
            <Button
              variant="ghost"
              className="rounded-full"
              onClick={() => navigate("/", { replace: true })}
            >
              Continue offline
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
