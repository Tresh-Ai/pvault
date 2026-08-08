import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Moon, Sun, Monitor, Trash2, Download, Upload, ScrollText, ChevronRight, Sparkle, BarChart3 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { dbHelpers } from "@/lib/database";
import { downloadBackup, importFromFile } from "@/lib/backup";
import { applyTheme as applyStoredTheme, type ThemeChoice } from "@/lib/theme";


interface SettingsProps {
  onBack: () => void;
}

export function Settings({ onBack }: SettingsProps) {
  const [settings, setSettings] = useState({
    theme: 'light' as 'light' | 'dark' | 'system',
    sortPreference: 'mostRecent' as 'mostRecent' | 'mostUsed' | 'alpha',
    protectWithPIN: false,
    autosaveInterval: 1200,
  });
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const currentSettings = await dbHelpers.getSettings();
      if (currentSettings) {
        setSettings({
          theme: currentSettings.theme ?? 'light',
          sortPreference: currentSettings.sortPreference ?? 'mostRecent',
          protectWithPIN: currentSettings.protectWithPIN ?? false,
          autosaveInterval: currentSettings.autosaveInterval ?? 1200,
        });
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const updateSetting = async (key: string, value: any) => {
    try {
      const newSettings = { ...settings, [key]: value };
      await dbHelpers.updateSettings(newSettings);
      setSettings(newSettings);

      // Apply theme immediately
      if (key === 'theme') {
        applyTheme(value);
      }

      toast({
        title: "Settings updated",
        description: "Your preferences have been saved.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update settings.",
        variant: "destructive",
      });
    }
  };

  const applyTheme = (theme: string) => {
    applyStoredTheme(theme as ThemeChoice);
  };


  const exportData = async () => {
    try {
      downloadBackup();
      toast({
        title: "Backup downloaded",
        description: "Projects, prompts, tools, flows and chats are all in the file.",
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Unable to export your data.",
        variant: "destructive",
      });
    }
  };

  const handleImportFile = async (file?: File | null) => {
    if (!file) return;
    try {
      const summary = await importFromFile(file);
      const added = Object.values(summary.added).reduce((a, b) => a + b, 0);
      const updated = Object.values(summary.updated).reduce((a, b) => a + b, 0);
      toast({
        title: "Import complete",
        description: `${added} added, ${updated} updated. Nothing existing was deleted.`,
      });
      setTimeout(() => window.location.reload(), 900);
    } catch (error) {
      toast({
        title: "Import failed",
        description: error instanceof Error ? error.message : "Unable to read that file.",
        variant: "destructive",
      });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };


  const clearAllData = async () => {
    if (confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
      try {
        localStorage.removeItem('pvault_projects');
        localStorage.removeItem('pvault_prompts');
        localStorage.removeItem('pvault_tools');
        localStorage.removeItem('pvault_settings');
        localStorage.removeItem('pvault_exports');

        toast({
          title: "Data cleared",
          description: "All data has been removed from your device.",
        });

        // Reload to reset state
        window.location.reload();
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to clear data.",
          variant: "destructive",
        });
      }
    }
  };

  const themeIcons = {
    light: Sun,
    dark: Moon,
    system: Monitor,
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-2xl mx-auto px-4">
          <div className="h-12 flex items-center gap-2">
            <button
              onClick={onBack}
              aria-label="Back"
              className="shrink-0 h-8 w-8 -ml-1 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <h1 className="text-base font-semibold tracking-tight">Settings</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-6 pb-24 space-y-6">
        {/* Appearance */}
        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>Customize how PVault looks and feels</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Theme</p>
                <p className="text-sm text-muted-foreground">Choose your preferred theme</p>
              </div>
              <Select
                value={settings.theme}
                onValueChange={(value) => updateSetting('theme', value)}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(themeIcons).map(([theme, Icon]) => (
                    <SelectItem key={theme} value={theme}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        <span className="capitalize">{theme}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Organization */}
        <Card>
          <CardHeader>
            <CardTitle>Organization</CardTitle>
            <CardDescription>Control how your content is organized</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Default Sort</p>
                <p className="text-sm text-muted-foreground">How to sort prompts and tools</p>
              </div>
              <Select
                value={settings.sortPreference}
                onValueChange={(value) => updateSetting('sortPreference', value)}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mostRecent">Most Recent</SelectItem>
                  <SelectItem value="mostUsed">Most Used</SelectItem>
                  <SelectItem value="alpha">Alphabetical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Autosave</p>
                <p className="text-sm text-muted-foreground">How often the editor saves while you type</p>
              </div>
              <Select
                value={String(settings.autosaveInterval ?? 1200)}
                onValueChange={(value) => updateSetting('autosaveInterval', Number(value))}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="600">Instant (0.6s)</SelectItem>
                  <SelectItem value="1200">Fast (1.2s)</SelectItem>
                  <SelectItem value="3000">Relaxed (3s)</SelectItem>
                  <SelectItem value="10000">Slow (10s)</SelectItem>
                  <SelectItem value="0">Off (manual only)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card>
          <CardHeader>
            <CardTitle>Data Management</CardTitle>
            <CardDescription>Export or clear your data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={exportData} variant="outline" className="w-full justify-start">
              <Download className="h-4 w-4 mr-2" />
              Export All Data
            </Button>
            
            <Separator />
            
            <Button onClick={clearAllData} variant="destructive" className="w-full justify-start">
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All Data
            </Button>
          </CardContent>
        </Card>

        {/* About */}
        <Card>
          <CardHeader>
            <CardTitle>About PVault</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>Version 1.1</p>
              <p>Your offline AI prompt vault</p>
              <p>All data is stored locally on your device</p>
            </div>
            <Separator className="my-4" />
            <Button
              variant="outline"
              className="w-full justify-between mb-2"
              onClick={() => navigate('/ai')}
            >
              <span className="flex items-center">
                <Sparkle className="h-4 w-4 mr-2" />
                PVault AI
              </span>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="w-full justify-between"
              onClick={() => navigate('/changelog')}
            >
              <span className="flex items-center">
                <ScrollText className="h-4 w-4 mr-2" />
                Changelog
              </span>
              <ChevronRight className="h-4 w-4" />
            </Button>

          </CardContent>
        </Card>
      </div>
    </div>
  );
}
