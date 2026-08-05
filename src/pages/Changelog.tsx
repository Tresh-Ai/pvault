import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";

interface Release {
  version: string;
  label?: string;
  date: string;
  current?: boolean;
  sections: { title: string; items: string[] }[];
}

const RELEASES: Release[] = [
  {
    version: "1.1",
    date: "August 2026",
    current: true,
    sections: [
      {
        title: "PVault AI",
        items: [
          "Built-in AI chat: bring your own OpenRouter key and run saved prompts without leaving PVault.",
          "Guided AI setup page explaining why OpenRouter and how to get a key, with a searchable model list that puts free and high-quality models first.",
          "ChatGPT-style chat: fixed auto-growing composer, expand-to-editor, stop streaming, editable and copyable messages, regenerate, and a subtle jump-to-latest.",
          "Tap + in the chat to pull in any saved prompt, tool or flow as context.",
        ],
      },
      {
        title: "Flows & chats",
        items: [
          "Run a flow directly in the AI, with every step handed over in order.",
          "New Chats tab in each project so you can see where a prompt or flow was used.",
          "Open any prompt straight in ChatGPT, Claude or Gemini from the editor.",
        ],
      },
      {
        title: "Fixes",
        items: [
          "Theme now applies on every page and survives a refresh, including system mode.",
          "Project tabs no longer overflow their pill on small phones.",
          "Chat drafts and in-progress answers survive an accidental refresh.",
          "Undo and redo moved into the scrollable editor toolbar so the top bar stays stable.",
        ],
      },
    ],
  },
  {
    version: "1.0",
    date: "July 2026",
    sections: [

      {
        title: "Design",
        items: [
          "Complete visual rebuild: minimalist black-and-white system with a single green accent.",
          "New minimalist vault logo used across the app, favicon and installed app icons.",
          "Compact navigation bars, centered hero, pill-radiused controls and flat inputs with no focus outlines.",
          "Always-visible card menus (edit, export, delete) instead of hover-only actions.",
        ],
      },
      {
        title: "Editor",
        items: [
          "Rebuilt prompt editor with separate title and content fields - no more merged, glitchy title.",
          "Markdown format with live preview that matches exported output.",
          "Markdown formatting toolbar: bold, italic, links, code, headings, lists, checklists and quotes.",
          "Autosave with a configurable frequency, plus manual save-now from the editor.",
          "Automatic #hashtag extraction into tags and single-step version history with restore.",
        ],
      },
      {
        title: "Features",
        items: [
          "Workflows: chain prompts, tools and notes into repeatable sequences and run them step by step.",
          "Projects with Prompts, Tools and Flows tabs, scoped search and filters.",
          "Export prompts as .txt, .md or .json, plus full JSON backup from Settings.",
          "Newsletter signup so PVault stays free to use.",
        ],
      },
      {
        title: "Offline & PWA",
        items: [
          "Proper service worker with precaching for genuine offline use.",
          "Install-as-app prompt with platform-specific instructions, including iOS.",
          "localStorage-only persistence for stability - no database to break offline.",
        ],
      },
      {
        title: "Onboarding & SEO",
        items: [
          "Modern onboarding: welcome screen, seven feature slides and theme setup.",
          "Guided in-app tour after onboarding pointing out projects, search, creating and settings.",
          "Full SEO pass: titles, descriptions, OpenGraph and Twitter cards, JSON-LD, sitemap and robots.",
        ],
      },
    ],
  },
  {
    version: "0.9",
    label: "Beta",
    date: "Earlier",
    sections: [
      {
        title: "Beta",
        items: [
          "First working build: projects, prompts and tools with local persistence.",
          "Basic search, favorites, usage tracking and text/JSON exports.",
          "Original template-based interface, later replaced entirely in 1.0.",
        ],
      },
    ],
  },
];

export default function Changelog() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-40 bg-background/85 backdrop-blur-md border-b border-border">
        <div className="max-w-2xl mx-auto px-4 h-12 flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 rounded-full"
            onClick={() => navigate(-1)}
            aria-label="Back"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-sm font-medium">Changelog</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 pb-20">
        <p className="text-[10px] font-medium tracking-widest uppercase text-muted-foreground mb-2">
          What's new
        </p>
        <h2 className="text-3xl font-semibold tracking-tight mb-8">Release notes</h2>

        <div className="space-y-12">
          {RELEASES.map((release) => (
            <section key={release.version}>
              <div className="flex items-center gap-2 mb-5">
                <h3 className="text-xl font-semibold tracking-tight">v{release.version}</h3>
                {release.current && <Badge className="rounded-full text-[10px]">Current</Badge>}
                {release.label && (
                  <Badge variant="secondary" className="rounded-full text-[10px]">
                    {release.label}
                  </Badge>
                )}
                <span className="text-xs text-muted-foreground ml-auto">{release.date}</span>
              </div>

              <div className="space-y-6 border-l border-border pl-5">
                {release.sections.map((section) => (
                  <div key={section.title}>
                    <h4 className="text-xs font-medium tracking-widest uppercase text-muted-foreground mb-2">
                      {section.title}
                    </h4>
                    <ul className="space-y-1.5">
                      {section.items.map((item) => (
                        <li key={item} className="text-sm leading-relaxed flex gap-2">
                          <span className="mt-[7px] h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                          <span className="text-muted-foreground">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
