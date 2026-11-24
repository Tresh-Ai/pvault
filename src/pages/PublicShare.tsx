import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Braces, Copy, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/logo";
import { VariablesDialog } from "@/components/variables-dialog";
import { useToast } from "@/hooks/use-toast";
import { decodeShare } from "@/lib/share";
import { extractVariables, fillVariables } from "@/lib/variables";

function readCode() {
  return new URLSearchParams(window.location.hash.slice(1)).get("p") || "";
}

export default function PublicShare() {
  const [code, setCode] = useState(readCode);
  const [fillOpen, setFillOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const on = () => setCode(readCode());
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);

  const prompt = useMemo(() => decodeShare(code), [code]);
  const vars = useMemo(() => (prompt ? extractVariables(prompt.content) : []), [prompt]);

  useEffect(() => {
    if (prompt) document.title = `${prompt.title || "Shared prompt"} | PVault`;
  }, [prompt]);

  const copyText = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: label });
    } catch {
      toast({ title: "Copy failed", variant: "destructive" });
    }
  };

  if (!prompt) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center">
        <Logo />
        <h1 className="text-xl font-semibold">This share link doesn't work</h1>
        <p className="text-sm text-muted-foreground max-w-sm">It may be incomplete. Ask the sender to copy the full link again.</p>
        <Button asChild className="rounded-full"><Link to="/">Open PVault</Link></Button>
      </div>
    );
  }

  const parts = prompt.content.split(/(\{\{\s*[\w.-]+\s*\}\})/g);

  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto max-w-3xl flex items-center justify-between px-5 h-14">
        <Link to="/" aria-label="PVault"><Logo /></Link>
        <span className="text-xs text-muted-foreground">Shared prompt</span>
      </header>
      <main className="mx-auto max-w-3xl px-5 pb-32 pt-6">
        <h1 className="text-3xl font-semibold tracking-tight">{prompt.title || "Untitled prompt"}</h1>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {prompt.category && <Badge variant="secondary" className="rounded-full">{prompt.category}</Badge>}
          {prompt.tags?.map((t) => (
            <span key={t} className="text-xs text-muted-foreground inline-flex items-center"><Hash className="h-3 w-3" />{t}</span>
          ))}
          {vars.length > 0 && (
            <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
              <Braces className="h-3 w-3 text-primary" /> {vars.length} variable{vars.length > 1 ? "s" : ""}
            </span>
          )}
        </div>
        <pre className="mt-6 whitespace-pre-wrap break-words rounded-2xl border border-border bg-card p-5 text-sm leading-relaxed font-sans">
          {parts.map((p, i) =>
            /^\{\{/.test(p) ? (
              <span key={i} className="rounded bg-primary/15 px-1 text-primary font-medium">{p}</span>
            ) : (
              <span key={i}>{p}</span>
            ),
          )}
        </pre>
      </main>

      <div className="fixed inset-x-0 bottom-0 border-t border-border bg-background/95 backdrop-blur">
        <div className="mx-auto max-w-3xl flex gap-2 px-5 py-3">
          <Button
            className="flex-1 rounded-full h-11"
            onClick={() => (vars.length ? setFillOpen(true) : copyText(prompt.content, "Prompt copied"))}
          >
            <Copy className="h-4 w-4 mr-2" />
            {vars.length ? "Fill & copy" : "Copy prompt"}
          </Button>
          {vars.length > 0 && (
            <Button variant="secondary" className="rounded-full h-11" onClick={() => copyText(prompt.content, "Template copied")}>
              Copy template
            </Button>
          )}
        </div>
      </div>

      <VariablesDialog
        open={fillOpen}
        onOpenChange={setFillOpen}
        names={vars}
        confirmLabel="Copy prompt"
        onConfirm={(values) => copyText(fillVariables(prompt.content, values), "Prompt copied")}
      />
    </div>
  );
}
