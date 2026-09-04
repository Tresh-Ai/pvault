import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Check, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { exchangeOpenRouterCode, saveAISettings } from "@/lib/ai";

/** Landing page for the OpenRouter OAuth (PKCE) redirect. */
export default function OpenRouterCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [state, setState] = useState<"working" | "done" | "error">("working");
  const [message, setMessage] = useState("Finishing the connection…");

  useEffect(() => {
    const code = params.get("code");
    if (!code) {
      setState("error");
      setMessage("OpenRouter did not return a code. Start again from Settings.");
      return;
    }
    exchangeOpenRouterCode(code)
      .then((key) => {
        saveAISettings({ provider: "openrouter", apiKey: key });
        setState("done");
        setMessage("OpenRouter connected. Pick a model next.");
        window.opener?.postMessage({ type: "pvault:openrouter-connected" }, window.location.origin);
        if (window.opener) setTimeout(() => window.close(), 900);
      })
      .catch((error: Error) => {
        setState("error");
        setMessage(error.message);
      });
  }, [params]);

  const Icon = state === "working" ? Loader2 : state === "done" ? Check : X;

  return (
    <div className="min-h-[100dvh] bg-background flex items-center justify-center px-6">
      <div className="max-w-sm text-center">
        <div className="mx-auto mb-4 h-11 w-11 rounded-2xl border border-border bg-secondary flex items-center justify-center">
          <Icon className={`h-5 w-5 ${state === "working" ? "animate-spin" : "text-primary"}`} />
        </div>
        <h1 className="text-lg font-semibold tracking-tight">
          {state === "error" ? "Connection failed" : "OpenRouter"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{message}</p>
        {state !== "working" && (
          <Button className="mt-5 rounded-full" onClick={() => navigate("/settings")}>
            Back to settings
          </Button>
        )}
      </div>
    </div>
  );
}
