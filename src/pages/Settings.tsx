import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  ChevronRight,
  CloudUpload,
  Download,
  LogOut,
  Monitor,
  Moon,
  RefreshCw,
  ScrollText,
  Sun,
  Trash2,
  Upload,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { dbHelpers } from "@/lib/database";
import { downloadBackup, importFromFile } from "@/lib/backup";
import { applyTheme as applyStoredTheme, type ThemeChoice } from "@/lib/theme";
import { ProviderSetup } from "@/components/settings/provider-setup";
import { useSession } from "@/hooks/use-session";
import { supabase } from "@/integrations/supabase/client";
import {
  getProfile,
  isSyncEnabled,
  lastSyncedAt,
  pullFromCloud,
  pushToCloud,
  setSyncEnabled,
  updateProfile,
} from "@/lib/cloud";

export function Settings() {
  const [settings, setSettings] = useState({
    theme: "light" as ThemeChoice,
    sortPreference: "mostRecent" as "mostRecent" | "mostUsed" | "alpha",
    autosaveInterval: 1200,
  });
  const [sync, setSync] = useState(isSyncEnabled());
  const [syncedAt, setSyncedAt] = useState(lastSyncedAt());
  const [displayName, setDisplayName] = useState("");
  const [busy, setBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useSession();

  useEffect(() => {
    dbHelpers.getSettings().then((s) =>
      setSettings({
        theme: s.theme ?? "light",
        sortPreference: s.sortPreference ?? "mostRecent",
        autosaveInterval: s.autosaveInterval ?? 1200,
      }),
    );
  }, []);

  useEffect(() => {
    if (!user) return;
    getProfile(user.id).then((p) => setDisplayName(p?.display_name ?? ""));
  }, [user]);

  const updateSetting = async (key: string, value: unknown) => {
    const next = { ...settings, [key]: value };
    await dbHelpers.updateSettings(next);
    setSettings(next as typeof settings);
    if (key === "theme") applyStoredTheme(value as ThemeChoice);
    toast({ title: "Settings updated" });
  };

  const saveName = async () => {
    if (!user) return;
    try {
      await updateProfile(user.id, { display_name: displayName.trim() || null });
      toast({ title: "Profile saved" });
    } catch {
      toast({ title: "Could not save profile", variant: "destructive" });
    }
  };

  const toggleSync = async (on: boolean) => {
    if (on && !user) {
      navigate("/auth");
      return;
    }
    setSyncEnabled(on);
    setSync(on);
    if (on) {
      try {
        setBusy(true);
        await pushToCloud();
        setSyncedAt(lastSyncedAt());
        toast({ title: "Cloud backup on", description: "Your workspace is now backed up after every change." });
      } catch (error) {
        toast({
          title: "Sync failed",
          description: error instanceof Error ? error.message : "Try again.",
          variant: "destructive",
        });
      } finally {
        setBusy(false);
      }
    }
  };

  const syncNow = async (direction: "up" | "down") => {
    try {
      setBusy(true);
      if (direction === "up") {
        await pushToCloud();
        toast({ title: "Backed up" });
      } else {
        const found = await pullFromCloud();
        toast({
          title: found ? "Restored from cloud" : "Nothing in the cloud yet",
          description: found ? "Reloading…" : undefined,
        });
        if (found) setTimeout(() => window.location.reload(), 800);
      }
      setSyncedAt(lastSyncedAt());
    } catch (error) {
      toast({
        title: "Sync failed",
        description: error instanceof Error ? error.message : "Try again.",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  const handleImportFile = async (file?: File | null) => {
    if (!file) return;
    try {
      const summary = await importFromFile(file);
      const added = Object.values(summary.added).reduce((a, b) => a + b, 0);
      const updated = Object.values(summary.updated).reduce((a, b) => a + b, 0);
      toast({ title: "Import complete", description: `${added} added, ${updated} updated. Nothing was deleted.` });
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

  const clearAllData = () => {
    if (!confirm("Clear everything stored on this device? This cannot be undone.")) return;
    ["pvault_projects", "pvault_prompts", "pvault_tools", "pvault_workflows", "pvault_chats", "pvault_exports"].forEach(
      (k) => localStorage.removeItem(k),
    );
    window.location.reload();
  };

  const themeIcons = { light: Sun, dark: Moon, system: Monitor };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24 space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>

      {/* AI provider - the first thing anyone should set up */}
      <Card>
        <CardHeader>
          <CardTitle>AI connection</CardTitle>
          <CardDescription>
            Pick a provider, connect it, choose a model. Keys stay on this device.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProviderSetup />
        </CardContent>
      </Card>

      {/* Account + cloud */}
      <Card>
        <CardHeader>
          <CardTitle>Account and cloud</CardTitle>
          <CardDescription>
            PVault works fully offline. An account is optional and only adds backup across devices.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {user ? (
            <>
              <div>
                <p className="text-sm font-medium">Profile</p>
                <p className="text-xs text-muted-foreground mb-2">{user.email}</p>
                <div className="flex gap-2">
                  <Input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Display name"
                  />
                  <Button className="rounded-full shrink-0" onClick={saveName}>
                    Save
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium">Cloud backup</p>
                  <p className="text-sm text-muted-foreground">
                    {syncedAt ? `Last synced ${syncedAt.toLocaleString()}` : "Not synced yet"}
                  </p>
                </div>
                <Switch checked={sync} onCheckedChange={toggleSync} disabled={busy} />
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" disabled={busy} onClick={() => syncNow("up")}>
                  <CloudUpload className="h-4 w-4 mr-2" />
                  Back up now
                </Button>
                <Button variant="outline" className="flex-1" disabled={busy} onClick={() => syncNow("down")}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Restore
                </Button>
              </div>

              <Button
                variant="ghost"
                className="w-full justify-start text-muted-foreground"
                onClick={async () => {
                  await supabase.auth.signOut();
                  setSyncEnabled(false);
                  setSync(false);
                  toast({ title: "Signed out", description: "Your local workspace is untouched." });
                }}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign out
              </Button>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Already using PVault? Sign in whenever you like, your existing local data stays and can be pushed up.
              </p>
              <Button className="w-full rounded-full" onClick={() => navigate("/auth")}>
                Sign in or create an account
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Appearance and editor */}
      <Card>
        <CardHeader>
          <CardTitle>Appearance and editor</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Theme</p>
              <p className="text-sm text-muted-foreground">Light, dark or follow the system</p>
            </div>
            <Select value={settings.theme} onValueChange={(v) => updateSetting("theme", v)}>
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

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Default sort</p>
              <p className="text-sm text-muted-foreground">How prompts and tools are ordered</p>
            </div>
            <Select value={settings.sortPreference} onValueChange={(v) => updateSetting("sortPreference", v)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mostRecent">Most recent</SelectItem>
                <SelectItem value="mostUsed">Most used</SelectItem>
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
              onValueChange={(v) => updateSetting("autosaveInterval", Number(v))}
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

      {/* Data */}
      <Card>
        <CardHeader>
          <CardTitle>Your data</CardTitle>
          <CardDescription>Back it up to a file, bring it in, or wipe this device</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button onClick={downloadBackup} variant="outline" className="w-full justify-start">
            <Download className="h-4 w-4 mr-2" />
            Download backup
          </Button>
          <div>
            <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="w-full justify-start">
              <Upload className="h-4 w-4 mr-2" />
              Import data
            </Button>
            <p className="mt-2 text-xs text-muted-foreground">
              Import adds to what you already have. Matching items are updated, nothing is deleted.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => handleImportFile(e.target.files?.[0])}
            />
          </div>
          <Separator />
          <Button onClick={clearAllData} variant="destructive" className="w-full justify-start">
            <Trash2 className="h-4 w-4 mr-2" />
            Clear all data
          </Button>
        </CardContent>
      </Card>

      {/* About */}
      <Card>
        <CardHeader>
          <CardTitle>About PVault</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1.5 text-sm text-muted-foreground">
            <p>Version 2.0</p>
            <p>A local-first AI workspace: chat, prompts, tools, flows and projects in one place.</p>
          </div>
          <Separator className="my-4" />
          <Button variant="outline" className="w-full justify-between" onClick={() => navigate("/changelog")}>
            <span className="flex items-center">
              <ScrollText className="h-4 w-4 mr-2" />
              Changelog
            </span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
