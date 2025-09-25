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
  icon = <Plus className="h-6 w-6" />, 
  className 
}: FloatingActionButtonProps) {
  return (
    <Button
      onClick={onClick}
      size="lg"
      className={cn(
        "fixed bottom-6 right-6 h-14 w-14 rounded-full bg-gradient-primary shadow-elevated",
        "hover:scale-105 transition-all duration-200 z-50",
        className
      )}
    >
      {icon}
    </Button>
  );
}