import { Button } from "@/components/ui/button";
import { Vault } from "lucide-react";

interface WelcomeScreenProps {
  onGetStarted: () => void;
}

export function WelcomeScreen({ onGetStarted }: WelcomeScreenProps) {
  return (
    <div className="min-h-screen bg-gradient-primary flex items-center justify-center p-6">
      <div className="text-center text-white max-w-md">
        <div className="mb-8">
          <div className="w-20 h-20 mx-auto mb-6 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
            <Vault className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-4">PVault</h1>
          <p className="text-xl text-white/90 mb-8">
            Your AI memory, organized.
          </p>
        </div>
        
        <div className="space-y-4">
          <Button 
            onClick={onGetStarted}
            size="lg"
            className="w-full bg-white text-primary hover:bg-white/90"
          >
            Get Started
          </Button>
        </div>
      </div>
    </div>
  );
}