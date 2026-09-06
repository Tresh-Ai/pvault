import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Folder, Lock, Sparkle } from "lucide-react";

import { cn } from "@/lib/utils";

interface OnboardingSlidesProps {
  onComplete: () => void;
  onBack: () => void;
}

const slides = [
  {
    icon: Folder,
    tag: "01 · Projects",
    title: "A project holds everything.",
    description:
      "Prompts, tools, flows and chats for one piece of work, in one place. Open a project and your whole context is right there.",
  },
  {
    icon: Sparkle,
    tag: "02 · PVault AI",
    title: "A companion for better prompts.",
    description:
      "Connect a model in Settings and PVault AI helps you write, sharpen and reuse prompts, using what you already have saved.",
  },
  {
    icon: Lock,
    tag: "03 · Yours",
    title: "Offline and private.",
    description:
      "Everything stays on your device. We will point out the rest of the app with small tips as you go.",
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
