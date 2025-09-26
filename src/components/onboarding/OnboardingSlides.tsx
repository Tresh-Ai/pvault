import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, FileText, Wrench, Download, Vault } from "lucide-react";
import { cn } from "@/lib/utils";

interface OnboardingSlidesProps {
  onComplete: () => void;
  onBack: () => void;
}

const slides = [
  {
    icon: FileText,
    title: "Save prompts like notes,\nbut smarter",
    description: "Store your AI prompts with tags, categories, and usage tracking. Never lose a great prompt again.",
    gradient: "from-purple-500 to-blue-500",
  },
  {
    icon: Wrench,
    title: "Organize tools & resources\nby project",
    description: "Keep related prompts and AI tools together in projects. Everything you need in one place.",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    icon: Download,
    title: "Export to text anytime,\nreuse anywhere",
    description: "Export your prompts as .txt or .json files. Your data stays with you, works offline.",
    gradient: "from-cyan-500 to-emerald-500",
  },
  {
    icon: Vault,
    title: "Your AI vault is ready",
    description: "Everything is stored locally and privately. Start building your personal AI knowledge base.",
    gradient: "from-emerald-500 to-purple-500",
  },
];

export function OnboardingSlides({ onComplete, onBack }: OnboardingSlidesProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      onComplete();
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    } else {
      onBack();
    }
  };

  const slide = slides[currentSlide];
  const Icon = slide.icon;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Slide Content */}
        <div className="text-center mb-12">
          <div className={cn(
            "w-24 h-24 mx-auto mb-8 rounded-3xl flex items-center justify-center",
            "bg-gradient-to-br", slide.gradient
          )}>
            <Icon className="h-12 w-12 text-white" />
          </div>
          
          <h2 className="text-2xl font-bold mb-4 leading-tight whitespace-pre-line">
            {slide.title}
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
            {slide.description}
          </p>
        </div>

        {/* Progress Dots */}
        <div className="flex justify-center gap-2 mb-8">
          {slides.map((_, index) => (
            <div
              key={index}
              className={cn(
                "w-2 h-2 rounded-full transition-all duration-300",
                index === currentSlide ? "bg-primary w-6" : "bg-muted"
              )}
            />
          ))}
        </div>

        {/* Navigation */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={prevSlide}
            className="flex-1"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Button
            onClick={nextSlide}
            className="flex-1"
          >
            {currentSlide === slides.length - 1 ? "Get Started" : "Next"}
            {currentSlide < slides.length - 1 && <ChevronRight className="h-4 w-4 ml-2" />}
          </Button>
        </div>
      </div>
    </div>
  );
}