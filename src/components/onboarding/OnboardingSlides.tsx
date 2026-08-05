import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  ArrowRight,
  FileText,
  Wrench,
  Download,
  Sparkles,
  Eye,
  GitBranch,
  Smartphone,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface OnboardingSlidesProps {
  onComplete: () => void;
  onBack: () => void;
}

const slides = [
  {
    icon: FileText,
    tag: "01 · Capture",
    title: "Prompts you can actually find.",
    description:
      "Save prompts with tags, categories, and usage tracking. Search instantly across everything.",
  },
  {
    icon: Eye,
    tag: "02 · Write",
    title: "Markdown editor with live preview.",
    description:
      "Write in plain text, JSON, or markdown. Toggle preview to see formatted headings, lists, and code blocks - and autosave keeps every keystroke.",
  },
  {
    icon: Wrench,
    tag: "03 · Organize",
    title: "Tools & prompts, side by side.",
    description:
      "Group everything by project. Your AI stack, arranged the way your brain works.",
  },
  {
    icon: GitBranch,
    tag: "04 · Flows",
    title: "Chain prompts into a flow.",
    description:
      "A flow is just an ordered list of steps: a saved prompt, a tool to open, or a note to yourself. Build it once, then play it and work through the steps one tap at a time - or hand the whole flow to the AI and let it run the sequence for you.",
  },
  {
    icon: Sparkle,
    tag: "05 · PVault AI",
    title: "Run your prompts right here.",
    description:
      "Connect your own OpenRouter key in Settings (free models included) and chat inside PVault. Tap + in the chat to pull in any saved prompt, tool or flow - no copy-pasting between apps.",
  },
  {
    icon: MessageSquare,
    tag: "06 · Chats",
    title: "Every run is remembered.",
    description:
      "Each project keeps its own Chats tab, so you can look back and see exactly where a prompt or flow was used, and what the AI said.",
  },
  {
    icon: Download,
    tag: "07 · Reuse",
    title: "Copy, export, ship.",
    description:
      "One tap to copy, or open a prompt straight in ChatGPT, Claude or Gemini. Export as .txt, .md, or .json. Your data, always portable.",
  },
  {
    icon: Smartphone,
    tag: "08 · Install",
    title: "Install it as an app.",
    description:
      "Add PVault to your home screen and it runs full-screen and fully offline - no connection needed, ever.",
  },
  {
    icon: Lock,
    tag: "09 · Private",
    title: "Fully offline. Fully yours.",
    description:
      "Everything lives on your device. No accounts, no tracking, no cloud lock-in. Your AI key stays local too.",
  },
];


export function OnboardingSlides({ onComplete, onBack }: OnboardingSlidesProps) {
  const [i, setI] = useState(0);
  const slide = slides[i];
  const Icon = slide.icon;
  const isLast = i === slides.length - 1;

  const next = () => (isLast ? onComplete() : setI(i + 1));
  const prev = () => (i === 0 ? onBack() : setI(i - 1));

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top progress bar */}
      <div className="px-6 pt-8">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={prev}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <button
            onClick={onComplete}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Skip
          </button>
        </div>
        <div className="flex gap-1.5">
          {slides.map((_, idx) => (
            <div
              key={idx}
              className={cn(
                "h-1 flex-1 rounded-full transition-all duration-500",
                idx < i && "bg-foreground",
                idx === i && "bg-primary",
                idx > i && "bg-border"
              )}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col justify-center px-6 max-w-md mx-auto w-full">
        <div className="mb-8 flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl border border-border flex items-center justify-center bg-secondary">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <span className="text-xs font-medium tracking-widest uppercase text-muted-foreground">
            {slide.tag}
          </span>
        </div>

        <h2 className="text-4xl sm:text-5xl font-semibold leading-[1.05] tracking-tight mb-5">
          {slide.title}
        </h2>
        <p className="text-lg text-muted-foreground leading-relaxed">
          {slide.description}
        </p>
      </div>

      {/* CTA */}
      <div className="px-6 pb-10 max-w-md mx-auto w-full">
        <Button onClick={next} size="lg" className="w-full h-14 rounded-full text-base group">
          {isLast ? "Choose your theme" : "Continue"}
          <ArrowRight className="h-4 w-4 ml-2 transition-transform group-hover:translate-x-1" />
        </Button>
      </div>
    </div>
  );
}
