import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const PROMPT_CATEGORIES = ["Writing", "Code", "Outreach", "Research", "Creative", "Analysis", "Other"];

interface PromptCreationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onContinue: (category: string, format: 'text' | 'json') => void;
}

export function PromptCreationModal({ open, onOpenChange, onContinue }: PromptCreationModalProps) {
  const [category, setCategory] = useState("Other");
  const [format, setFormat] = useState<'text' | 'json'>('text');

  const handleContinue = () => {
    onContinue(category, format);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[90vw] max-w-md rounded-lg">
        <DialogHeader>
          <DialogTitle>New Prompt Setup</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div>
            <Label htmlFor="category" className="text-base font-medium">Category</Label>
            <p className="text-sm text-muted-foreground mb-3">How would you categorize this prompt?</p>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROMPT_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="format" className="text-base font-medium">Format</Label>
            <p className="text-sm text-muted-foreground mb-3">What type of content will this be?</p>
            <Select value={format} onValueChange={(value) => setFormat(value as 'text' | 'json')}>
              <SelectTrigger id="format">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Text</SelectItem>
                <SelectItem value="json">JSON</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleContinue} className="flex-1">
            Continue
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}