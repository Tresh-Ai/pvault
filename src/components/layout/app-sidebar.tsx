import { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  FileText,
  Folder,
  GitBranch,
  MessageSquare,
  Search,
  Settings,
  Trash2,
  Wrench,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { openCommandPalette } from "@/components/command-palette";
import { chatHelpers, type Chat } from "@/lib/chats";
import { useSession } from "@/hooks/use-session";
import { cn } from "@/lib/utils";

const SETS = [
  { label: "Projects", href: "/library/projects", icon: Folder },
  { label: "Flows", href: "/library/flows", icon: GitBranch },
  { label: "Prompts", href: "/library/prompts", icon: FileText },
  { label: "Tools", href: "/library/tools", icon: Wrench },
];

interface AppSidebarProps {
  onNavigate?: () => void;
}

export function AppSidebar({ onNavigate }: AppSidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [chats, setChats] = useState<Chat[]>([]);
  const { user } = useSession();

  useEffect(() => {
    chatHelpers.getAllChats().then(setChats).catch(() => setChats([]));
  }, [location.pathname]);

  const go = (href: string) => {
    onNavigate?.();
    navigate(href);
  };

  const removeChat = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await chatHelpers.deleteChat(id);
    setChats((prev) => prev.filter((c) => c.id !== id));
    if (location.pathname.includes(id)) navigate("/");
  };

  return (
    <div className="flex h-full w-full flex-col bg-secondary/40">
      {/* Brand */}
      <div className="flex items-center gap-2 px-3 h-14 shrink-0">
        <button onClick={() => go("/")} className="min-w-0" aria-label="PVault home">
          <Logo withWordmark />
        </button>
      </div>


      <div className="px-2 space-y-1 shrink-0">
        <button
          onClick={() => {
            onNavigate?.();
            openCommandPalette();
          }}
          className="w-full h-9 rounded-lg px-2.5 flex items-center gap-2.5 text-sm text-muted-foreground hover:bg-background/70 transition-colors"
        >
          <Search className="h-4 w-4 shrink-0" />
          <span className="truncate">Search</span>
          <span className="ml-auto text-[10px] tracking-wider hidden md:inline">⌘K</span>
        </button>

        {SETS.map(({ label, href, icon: Icon }) => (
          <NavLink
            key={href}
            to={href}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                "w-full h-9 rounded-lg px-2.5 flex items-center gap-2.5 text-sm transition-colors",
                isActive ? "bg-background text-foreground font-medium" : "text-muted-foreground hover:bg-background/70",
              )
            }
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="truncate">{label}</span>
          </NavLink>
        ))}
      </div>

      {/* Chat history */}
      <div className="mt-4 flex-1 min-h-0 overflow-y-auto px-2 pb-2">
        <p className="px-2.5 pb-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
          Chats
        </p>
        {chats.length === 0 ? (
          <p className="px-2.5 py-2 text-xs text-muted-foreground">
            Your conversations will show up here.
          </p>
        ) : (
          <div className="space-y-0.5">
            {chats.map((chat) => {
              const active = location.pathname === `/c/${chat.id}`;
              return (
                <div
                  key={chat.id}
                  onClick={() => go(`/c/${chat.id}`)}
                  className={cn(
                    "group h-9 rounded-lg px-2.5 flex items-center gap-2 text-sm cursor-pointer transition-colors",
                    active ? "bg-background text-foreground" : "text-muted-foreground hover:bg-background/70",
                  )}
                >
                  <MessageSquare className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate flex-1">{chat.title || "New chat"}</span>
                  <button
                    onClick={(e) => removeChat(e, chat.id)}
                    aria-label="Delete chat"
                    className="shrink-0 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Settings + profile */}
      <div className="shrink-0 border-t border-border p-2">
        <button
          onClick={() => go("/settings")}
          className="w-full rounded-lg px-2.5 py-2 flex items-center gap-2.5 text-sm text-muted-foreground hover:bg-background/70 transition-colors"
        >
          <span className="h-7 w-7 shrink-0 rounded-full bg-background border border-border flex items-center justify-center text-[11px] font-semibold text-foreground">
            {user?.email?.[0]?.toUpperCase() ?? <Settings className="h-3.5 w-3.5" />}
          </span>
          <span className="min-w-0 text-left">
            <span className="block truncate text-foreground text-[13px] leading-tight">Settings</span>
            <span className="block truncate text-[11px] leading-tight">
              {user?.email ?? "Local only"}
            </span>
          </span>
        </button>
      </div>
    </div>
  );
}
