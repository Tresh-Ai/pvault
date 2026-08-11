import { useEffect, useMemo, useState } from "react";
import { Check, ExternalLink, Loader2, Search, Sparkle, Unplug } from "lucide-react";
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
  type ModelInfo,
  type ProviderId,
} from "@/lib/ai";
import { cn } from "@/lib/utils";

/**
 * Provider, then key, then model. Lives inside Settings so connecting the AI is
 * never a separate onboarding page.
 */
export function ProviderSetup() {
  const { toast } = useToast();
  const [settings, setSettings] = useState(getAISettings());
  const [keyDraft, setKeyDraft] = useState("");
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");

  const meta = providerMeta(settings.provider);
  const connected = !!settings.apiKey;

  // The OpenRouter popup tells us when the key landed.
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type !== "pvault:openrouter-connected") return;
      setSettings(getAISettings());
      toast({ title: "OpenRouter connected", description: "Now pick a model below." });
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
    setModels([]);
    if (settings.provider === "openrouter" || settings.apiKey) void loadModels();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.provider, settings.apiKey]);

  const pickProvider = (provider: ProviderId) => {
    setKeyDraft("");
    setSettings(saveAISettings({ provider, apiKey: "", model: "", modelName: "" }));
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
  };

  const pickModel = (model: ModelInfo) => {
    setSettings(saveAISettings({ model: model.id, modelName: model.name }));
    toast({ title: "Model selected", description: model.name });
  };

  const disconnect = () => {
    clearAISettings();
    setSettings(getAISettings());
    setModels([]);
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? models.filter((m) => m.id.toLowerCase().includes(q) || m.name.toLowerCase().includes(q))
      : models;
    return list.slice(0, 60);
  }, [models, query]);

  return (
    <div className="space-y-5">
      {/* 1. Provider */}
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
          1 · Model provider
        </p>
        <div className="grid grid-cols-2 gap-2">
          {PROVIDERS.map((p) => (
            <button
              key={p.id}
              onClick={() => pickProvider(p.id)}
              className={cn(
                "rounded-lg border px-3 py-2.5 text-left transition-colors",
                settings.provider === p.id
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card hover:bg-secondary/60",
              )}
            >
              <span className="flex items-center gap-1.5 text-sm font-medium">
                {p.label}
                {p.oauth && <span className="text-[10px] text-primary uppercase tracking-wider">1-tap</span>}
              </span>
              <span className="mt-0.5 block text-[11px] text-muted-foreground line-clamp-2">{p.blurb}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 2. Connect */}
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
          2 · Connect {meta.label}
        </p>

        {connected ? (
          <div className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2.5">
            <span className="flex items-center gap-2 text-sm">
              <Check className="h-4 w-4 text-primary" />
              Connected
            </span>
            <Button variant="ghost" size="sm" className="h-8 rounded-full" onClick={disconnect}>
              <Unplug className="h-3.5 w-3.5 mr-1.5" />
              Disconnect
            </Button>
          </div>
        ) : meta.oauth ? (
          <div className="rounded-lg border border-border bg-card p-3">
            <p className="text-sm">
              Sign in with OpenRouter and PVault gets its own key automatically. No copying, no pasting.
            </p>
            <Button className="mt-3 w-full rounded-full" onClick={connectOpenRouter}>
              <Sparkle className="h-4 w-4 mr-2" />
              Connect OpenRouter
            </Button>
            <p className="mt-2 text-[11px] text-muted-foreground">
              Opens openrouter.ai in a new window. The key is stored on this device only.
            </p>
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-card p-3">
            <p className="text-sm text-muted-foreground">
              Paste an API key from {meta.label}. It stays on this device and is sent straight to {meta.label}.
            </p>
            <div className="mt-3 flex gap-2">
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
          </div>
        )}
      </div>

      {/* 3. Model */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">3 · Model</p>
          {settings.modelName && (
            <span className="text-xs text-muted-foreground truncate max-w-[55%]">{settings.modelName}</span>
          )}
        </div>

        {!connected && settings.provider !== "openrouter" ? (
          <p className="text-sm text-muted-foreground">Add your key first to load the model list.</p>
        ) : (
          <>
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search models..."
                className="pl-9"
              />
            </div>

            {loading ? (
              <p className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading models…
              </p>
            ) : (
              <div className="max-h-72 overflow-y-auto rounded-lg border border-border divide-y divide-border">
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
          </>
        )}
      </div>
    </div>
  );
}
