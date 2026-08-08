import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, BarChart3, Clock, Flame, Star, Hash } from "lucide-react";
import { getUsageStats, type UsageStats } from "@/lib/search";
import type { Prompt } from "@/lib/database";

function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2.5">
      <p className="text-xl font-semibold tabular-nums leading-none">{value}</p>
      <p className="mt-1 text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
    </div>
  );
}

function PromptRow({
  prompt,
  projectName,
  meta,
  onOpen,
}: {
  prompt: Prompt;
  projectName?: string;
  meta: string;
  onOpen: () => void;
}) {
  return (
    <button
      onClick={onOpen}
      className="w-full text-left rounded-lg border border-border bg-card px-3 py-2.5 hover:border-foreground/20 transition-colors"
    >
      <div className="flex items-center gap-2">
        <span className="flex-1 truncate text-sm font-medium">{prompt.title || "Untitled prompt"}</span>
        <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{meta}</span>
      </div>
      {projectName && <p className="mt-0.5 truncate text-xs text-muted-foreground">{projectName}</p>}
    </button>
  );
}

function Section({
  title,
  icon: Icon,
  children,
  empty,
}: {
  title: string;
  icon: typeof Flame;
  children: React.ReactNode;
  empty: boolean;
}) {
  return (
    <section>
      <h2 className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {title}
      </h2>
      {empty ? <p className="text-sm text-muted-foreground">Nothing here yet.</p> : <div className="space-y-2">{children}</div>}
    </section>
  );
}

export default function Insights() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<UsageStats | null>(null);

  useEffect(() => {
    getUsageStats().then(setStats).catch(() => setStats(null));
  }, []);

  const openPrompt = (p: Prompt) => navigate(`/project/${p.projectId}/prompt/edit?promptId=${p.id}`);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex h-12 max-w-2xl items-center gap-2 px-4">
          <button
            onClick={() => navigate(-1)}
            aria-label="Back"
            className="-ml-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h1 className="flex items-center gap-2 text-base font-semibold tracking-tight">
            <BarChart3 className="h-4 w-4" /> Insights
          </h1>
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-7 px-4 py-5 pb-20">
        <p className="text-sm text-muted-foreground">
          Counted on this device only. Nothing is uploaded anywhere.
        </p>

        {stats && (
          <>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
              <StatTile label="Projects" value={stats.totals.projects} />
              <StatTile label="Prompts" value={stats.totals.prompts} />
              <StatTile label="Flows" value={stats.totals.flows} />
              <StatTile label="Tools" value={stats.totals.tools} />
              <StatTile label="Chats" value={stats.totals.chats} />
            </div>

            <Section title="Most used prompts" icon={Flame} empty={stats.mostUsed.length === 0}>
              {stats.mostUsed.map((p) => (
                <PromptRow
                  key={p.id}
                  prompt={p}
                  projectName={stats.projectNames[p.projectId]}
                  meta={`${p.usageCount} ${p.usageCount === 1 ? "run" : "runs"}`}
                  onOpen={() => openPrompt(p)}
                />
              ))}
            </Section>

            <Section title="Recently used" icon={Clock} empty={stats.recentlyUsed.length === 0}>
              {stats.recentlyUsed.map((p) => (
                <PromptRow
                  key={p.id}
                  prompt={p}
                  projectName={stats.projectNames[p.projectId]}
                  meta={new Date(p.lastUsedAt!).toLocaleDateString()}
                  onOpen={() => openPrompt(p)}
                />
              ))}
            </Section>

            <Section title="Favorites" icon={Star} empty={stats.favorites.length === 0}>
              {stats.favorites.map((p) => (
                <PromptRow
                  key={p.id}
                  prompt={p}
                  projectName={stats.projectNames[p.projectId]}
                  meta="favorite"
                  onOpen={() => openPrompt(p)}
                />
              ))}
            </Section>

            {stats.topTags.length > 0 && (
              <section>
                <h2 className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  <Hash className="h-3.5 w-3.5" /> Top tags
                </h2>
                <div className="flex flex-wrap gap-1.5">
                  {stats.topTags.map(({ tag, count }) => (
                    <span key={tag} className="rounded-md bg-secondary px-2 py-1 text-xs">
                      #{tag} <span className="text-muted-foreground tabular-nums">{count}</span>
                    </span>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}
