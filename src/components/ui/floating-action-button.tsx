import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";

interface FloatingActionButtonProps {
  onClick: () => void;
  icon?: React.ReactNode;
  className?: string;
}

export function FloatingActionButton({
  onClick,
  icon = <Plus className="h-6 w-6" strokeWidth={2.5} />,
  className,
}: FloatingActionButtonProps) {
  return (
    <Button
      onClick={onClick}
      aria-label="Create"
      className={cn(
        "fixed bottom-6 right-6 h-14 w-14 rounded-full p-0",
        "bg-foreground text-background hover:bg-foreground/90",
        "shadow-elevated transition-transform duration-200 hover:scale-105 active:scale-95 z-50",
        className
      )}
    >
      {icon}
    </Button>
  );
}
