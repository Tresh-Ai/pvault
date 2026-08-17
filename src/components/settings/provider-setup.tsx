import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, ExternalLink, Loader2, Search, Sparkle, Unplug } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  PROVIDERS,
  buildOpenRouterAuthUrl,
  clearAISettings,
  fetchModels,
  getAISettings,
  isFreeModel,
  providerMeta,
  saveAISettings,
  scoreModel,
  type ModelInfo,
  type ProviderId,
} from "@/lib/ai";
import { cn } from "@/lib/utils";

type Step = "provider" | "connect" | "model";

/**
 * One decision per screen: provider, then connection, then model. Nothing is
 * shown before it is needed.
 */
export function ProviderSetup() {
  const { toast } = useToast();
  const [settings, setSettings] = useState(getAISettings());
  const [step, setStep] = useState<Step>(() => {
    const s = getAISettings();
    if (!s.apiKey) return "provider";
    return s.model ? "model" : "model";
  });
  const [keyDraft, setKeyDraft] = useState("");
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [freeOnly, setFreeOnly] = useState(false);

  const meta = providerMeta(settings.provider);
  const connected = !!settings.apiKey;

  // The OpenRouter popup tells us when the key landed.
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type !== "pvault:openrouter-connected") return;
      setSettings(getAISettings());
      setStep("model");
      toast({ title: "OpenRouter connected", description: "Now pick a model." });
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [toast]);

  const loadModels = async () => {
    setLoading(true);
    try {
      const list = await fetchModels(settings.provider, settings.apiKey);
      setModels(list);
    } catch (error) {
      toast({
        title: "Could not load models",
        description: error instanceof Error ? error.message : "Try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (step !== "model") return;
    setModels([]);
    if (settings.provider === "openrouter" || settings.apiKey) void loadModels();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, settings.provider, settings.apiKey]);

  const pickProvider = (provider: ProviderId) => {
    setKeyDraft("");
    setSettings(saveAISettings({ provider, apiKey: "", model: "", modelName: "" }));
    setStep("connect");
  };

  const connectOpenRouter = async () => {
    const url = await buildOpenRouterAuthUrl();
    const popup = window.open(url, "pvault-openrouter", "width=520,height=720");
    if (!popup) window.location.href = url;
  };

  const saveKey = () => {
    const key = keyDraft.trim();
    if (!key) return;
    setSettings(saveAISettings({ apiKey: key }));
    setKeyDraft("");
    setStep("model");
  };

  const pickModel = (model: ModelInfo) => {
    setSettings(saveAISettings({ model: model.id, modelName: model.name }));
    toast({ title: "Model selected", description: model.name });
  };

  const disconnect = () => {
    clearAISettings();
    setSettings(getAISettings());
    setModels([]);
    setStep("provider");
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = freeOnly ? models.filter(isFreeModel) : models;
    if (q) list = list.filter((m) => m.id.toLowerCase().includes(q) || m.name.toLowerCase().includes(q));
    return [...list].sort((a, b) => scoreModel(b) - scoreModel(a)).slice(0, 60);
  }, [models, query, freeOnly]);

  const stepIndex = step === "provider" ? 0 : step === "connect" ? 1 : 2;

  return (
    <div className="space-y-4">
      {/* Progress */}
      <div className="flex items-center gap-3">
        {step !== "provider" && (
          <button
            onClick={() => setStep(step === "model" ? "connect" : "provider")}
            className="h-8 w-8 -ml-1 rounded-full flex items-center justify-center text-muted-foreground"
            aria-label="Back"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
        )}
        <div className="flex flex-1 gap-1.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className={cn("h-1 flex-1 rounded-full", i <= stepIndex ? "bg-primary" : "bg-secondary")}
            />
          ))}
        </div>
        {connected && settings.model && (
          <Button variant="ghost" size="sm" className="h-8 rounded-full shrink-0" onClick={disconnect}>
            <Unplug className="h-3.5 w-3.5 mr-1.5" />
            Reset
          </Button>
        )}
      </div>

      {step === "provider" && (
        <div>
          <h3 className="text-base font-semibold">Where should the model come from?</h3>
          <p className="text-sm text-muted-foreground mt-0.5 mb-3">
            Your key stays on this device and talks straight to the provider.
          </p>
          <div className="space-y-2">
            {PROVIDERS.map((p) => (
              <button
                key={p.id}
                onClick={() => pickProvider(p.id)}
                className={cn(
                  "w-full rounded-lg border px-3.5 py-3 text-left transition-colors",
                  settings.provider === p.id && connected
                    ? "border-primary bg-primary/5"
                    : "border-border bg-card hover:bg-secondary/60",
                )}
              >
                <span className="flex items-center gap-2 text-sm font-medium">
                  {p.label}
                  {p.oauth && (
                    <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary">1 tap</span>
                  )}
                </span>
                <span className="mt-0.5 block text-[12px] text-muted-foreground">{p.blurb}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === "connect" && (
        <div>
          <h3 className="text-base font-semibold">Connect {meta.label}</h3>
          {connected ? (
            <>
              <p className="text-sm text-muted-foreground mt-0.5 mb-3">This provider is already connected.</p>
              <div className="flex items-center justify-between rounded-lg border border-border bg-card px-3.5 py-3">
                <span className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-primary" /> Connected
                </span>
                <Button variant="ghost" size="sm" className="h-8 rounded-full" onClick={disconnect}>
                  Disconnect
                </Button>
              </div>
              <Button className="mt-3 w-full rounded-full" onClick={() => setStep("model")}>
                Continue to models
              </Button>
            </>
          ) : meta.oauth ? (
            <>
              <p className="text-sm text-muted-foreground mt-0.5 mb-3">
                Sign in once and PVault gets its own key automatically. Nothing to copy or paste.
              </p>
              <Button className="w-full rounded-full" onClick={connectOpenRouter}>
                <Sparkle className="h-4 w-4 mr-2" /> Connect OpenRouter
              </Button>
              <p className="mt-2 text-[11px] text-muted-foreground">
                Opens openrouter.ai in a new window. The key is stored on this device only.
              </p>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mt-0.5 mb-3">
                Paste an API key from {meta.label}.
              </p>
              <div className="flex gap-2">
                <Input
                  value={keyDraft}
                  onChange={(e) => setKeyDraft(e.target.value)}
                  placeholder={meta.keyPrefix ? `${meta.keyPrefix}...` : "Your API key"}
                  type="password"
                  autoComplete="off"
                />
                <Button className="rounded-full shrink-0" onClick={saveKey} disabled={!keyDraft.trim()}>
                  Save
                </Button>
              </div>
              {meta.keyUrl && (
                <a
                  href={meta.keyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1.5 text-xs text-primary"
                >
                  Get a key from {meta.label} <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </>
          )}
        </div>
      )}

      {step === "model" && (
        <div>
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="text-base font-semibold">Pick a model</h3>
            {settings.modelName && (
              <span className="text-xs text-muted-foreground truncate max-w-[50%]">{settings.modelName}</span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-0.5 mb-3">
            Best picks for planning work sit at the top. Switch to free models any time.
          </p>

          <div className="flex gap-2 mb-2">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search models..."
                className="pl-9"
              />
            </div>
            <button
              onClick={() => setFreeOnly((v) => !v)}
              className={cn(
                "shrink-0 rounded-full border px-3 text-xs font-medium transition-colors",
                freeOnly ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground",
              )}
            >
              Free only
            </button>
          </div>

          {loading ? (
            <p className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading models...
            </p>
          ) : (
            <div className="max-h-80 overflow-y-auto rounded-lg border border-border divide-y divide-border">
              {filtered.map((m) => (
                <button
                  key={m.id}
                  onClick={() => pickModel(m)}
                  className={cn(
                    "w-full text-left px-3 py-2.5 transition-colors hover:bg-secondary/60",
                    settings.model === m.id && "bg-primary/5",
                  )}
                >
                  <span className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">{m.name}</span>
                    {isFreeModel(m) && (
                      <span className="shrink-0 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary">
                        Free
                      </span>
                    )}
                    {settings.model === m.id && <Check className="ml-auto h-4 w-4 text-primary shrink-0" />}
                  </span>
                  <span className="block text-[11px] text-muted-foreground truncate">{m.id}</span>
                </button>
              ))}
              {filtered.length === 0 && (
                <p className="px-3 py-6 text-center text-sm text-muted-foreground">No models matched.</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
