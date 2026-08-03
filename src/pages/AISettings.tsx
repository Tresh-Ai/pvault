import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  ExternalLink,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Search,
  Sparkle,
  Trash2,
} from "lucide-react";
import {
  AISettings as AISettingsShape,
  OpenRouterModel,
  clearAISettings,
  fetchModels,
  getAISettings,
  isFreeModel,
  saveAISettings,
} from "@/lib/ai";
import { cn } from "@/lib/utils";

const STEPS = ["Connect", "Choose model"] as const;

export default function AISettings() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [params] = useSearchParams();
  const returnTo = params.get("returnTo");

  const [saved, setSaved] = useState<AISettingsShape>(() => getAISettings());
  const [apiKey, setApiKey] = useState(saved.apiKey);
  const [showKey, setShowKey] = useState(false);
  const [step, setStep] = useState<0 | 1>(saved.apiKey ? 1 : 0);
  const [howOpen, setHowOpen] = useState(!saved.apiKey);

  const [models, setModels] = useState<OpenRouterModel[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [query, setQuery] = useState("");
  const [freeOnly, setFreeOnly] = useState(false);

  useEffect(() => {
    if (step !== 1 || models.length) return;
    setLoadingModels(true);
    fetchModels()
      .then(setModels)
      .catch(() => toast({ title: "Couldn't load models", description: "Check your connection.", variant: "destructive" }))
      .finally(() => setLoadingModels(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = models;
    if (freeOnly) list = list.filter(isFreeModel);
    if (q) list = list.filter((m) => m.id.toLowerCase().includes(q) || m.name.toLowerCase().includes(q));
    // Free models bubble to the top, quality order preserved inside each group.
    const free = list.filter(isFreeModel);
    const paid = list.filter((m) => !isFreeModel(m));
    return [...free, ...paid].slice(0, 120);
  }, [models, query, freeOnly]);

  const connect = () => {
    const key = apiKey.trim();
    if (!key.startsWith("sk-or-")) {
      toast({
        title: "That doesn't look right",
        description: "An OpenRouter key starts with sk-or-.",
        variant: "destructive",
      });
      return;
    }
    setSaved(saveAISettings({ apiKey: key }));
    setStep(1);
  };

  const pickModel = (m: OpenRouterModel) => {
    setSaved(saveAISettings({ model: m.id, modelName: m.name }));
    toast({ title: "Ready to go", description: `${m.name} is now your PVault AI model.` });
    if (returnTo) navigate(returnTo);
  };

  const disconnect = () => {
    clearAISettings();
    setSaved({ apiKey: "", model: "", modelName: "" });
    setApiKey("");
    setStep(0);
    setHowOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background/85 backdrop-blur-md border-b border-border">
        <div className="max-w-xl mx-auto px-4 h-12 flex items-center gap-2">
          <button
            onClick={() => navigate(returnTo || "/")}
            aria-label="Back"
            className="shrink-0 h-8 w-8 -ml-1 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h1 className="text-base font-semibold tracking-tight flex-1">PVault AI</h1>
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
            {STEPS.map((label, i) => (
              <span key={label} className={cn("px-2 py-0.5 rounded-full", step === i && "bg-secondary text-foreground")}>
                {i + 1}. {label}
              </span>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-6 pb-24 space-y-5">
        {step === 0 ? (
          <>
            <div className="text-center pt-2 pb-1">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-secondary border border-border flex items-center justify-center mb-4">
                <Sparkle className="h-5 w-5 text-primary" />
              </div>
              <h2 className="text-2xl font-semibold tracking-tight mb-2">Run your prompts right here</h2>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                Connect once, then chat with any AI model without leaving PVault. Your key stays on this device.
              </p>
            </div>

            {/* How & why — collapsed by default so nothing feels jumbled */}
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <button
                onClick={() => setHowOpen((v) => !v)}
                className="w-full flex items-center justify-between gap-2 px-4 py-3 text-left"
              >
                <span className="text-sm font-medium">How to get a key &amp; why OpenRouter</span>
                <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", howOpen && "rotate-180")} />
              </button>
              {howOpen && (
                <div className="px-4 pb-4 space-y-4 border-t border-border pt-4">
                  <p className="text-sm text-muted-foreground">
                    OpenRouter is a single door to hundreds of AI models — including free ones. One key, no separate
                    accounts, and you only ever pay for what you use.
                  </p>
                  <ol className="space-y-3">
                    {[
                      "Create a free OpenRouter account.",
                      "Open Keys and press Create key.",
                      "Copy the key (it starts with sk-or-).",
                      "Paste it below. That's it.",
                    ].map((text, i) => (
                      <li key={text} className="flex gap-3 text-sm">
                        <span className="shrink-0 h-5 w-5 rounded-full bg-secondary text-[11px] font-semibold flex items-center justify-center">
                          {i + 1}
                        </span>
                        <span className="text-muted-foreground">{text}</span>
                      </li>
                    ))}
                  </ol>
                  <Button asChild variant="outline" className="w-full rounded-full">
                    <a href="https://openrouter.ai/settings/keys" target="_blank" rel="noopener noreferrer">
                      Get my key on OpenRouter <ExternalLink className="h-3.5 w-3.5 ml-1.5" />
                    </a>
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Opens in a new tab — nothing you've written here is lost.
                  </p>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
              <label htmlFor="or-key" className="text-sm font-medium flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-muted-foreground" /> Your OpenRouter key
              </label>
              <div className="relative">
                <Input
                  id="or-key"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  type={showKey ? "text" : "password"}
                  placeholder="sk-or-..."
                  autoComplete="off"
                  spellCheck={false}
                  className="pr-10 font-mono text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowKey((v) => !v)}
                  aria-label={showKey ? "Hide key" : "Show key"}
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full flex items-center justify-center text-muted-foreground"
                >
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <Button onClick={connect} className="w-full rounded-full" disabled={!apiKey.trim()}>
                Continue <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
              <p className="text-xs text-muted-foreground">
                Stored only in this browser. PVault has no server — nothing is uploaded.
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="rounded-2xl border border-border bg-card p-4 flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Check className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">Key connected</p>
                <p className="text-xs text-muted-foreground truncate font-mono">
                  {saved.apiKey.slice(0, 10)}••••{saved.apiKey.slice(-4)}
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={disconnect} className="text-muted-foreground">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <div>
              <h2 className="text-lg font-semibold tracking-tight">Pick a model</h2>
              <p className="text-sm text-muted-foreground">
                Best picks first. Free models cost nothing to run — start there.
              </p>
            </div>

            <div className="flex gap-2 items-center">
              <div className="relative flex-1 min-w-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search models…"
                  className="pl-9"
                />
              </div>
              <button
                onClick={() => setFreeOnly((v) => !v)}
                className={cn(
                  "shrink-0 h-10 px-4 rounded-xl text-sm font-medium transition-colors",
                  freeOnly ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground",
                )}
              >
                Free
              </button>
            </div>

            {loadingModels ? (
              <div className="py-16 flex justify-center text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : (
              <div className="space-y-2">
                {visible.map((m) => {
                  const active = saved.model === m.id;
                  const free = isFreeModel(m);
                  return (
                    <button
                      key={m.id}
                      onClick={() => pickModel(m)}
                      className={cn(
                        "w-full text-left rounded-2xl border p-3.5 transition-colors",
                        active ? "border-primary bg-primary/5" : "border-border bg-card hover:bg-secondary/60",
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate flex-1">{m.name}</span>
                        {free && (
                          <Badge className="rounded-full text-[10px] bg-primary/10 text-primary hover:bg-primary/10 border-0">
                            Free
                          </Badge>
                        )}
                        {active && <Check className="h-4 w-4 text-primary shrink-0" />}
                      </div>
                      <p className="text-xs text-muted-foreground font-mono truncate mt-0.5">{m.id}</p>
                      {!!m.context_length && (
                        <p className="text-[11px] text-muted-foreground mt-1">
                          {Math.round(m.context_length / 1000)}k context
                        </p>
                      )}
                    </button>
                  );
                })}
                {visible.length === 0 && (
                  <p className="text-center text-sm text-muted-foreground py-12">No models match that search.</p>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
