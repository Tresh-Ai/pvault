import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Menu, Plus } from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { UpdateDialog } from "@/components/update-dialog";
import { QuickCreate, type QuickKind } from "@/components/quick-create";

const WIDTH_KEY = "pvault_sidebar_width";
const MIN = 220;
const MAX = 420;

/** Chat-first shell: resizable sidebar on desktop, slide-over on mobile. */
export function AppShell() {
  const [open, setOpen] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);
  const [width, setWidth] = useState(() => {
    const saved = Number(localStorage.getItem(WIDTH_KEY));
    return saved >= MIN && saved <= MAX ? saved : 268;
  });
  const dragging = useRef(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => setOpen(false), [location.pathname]);

  const quickKind = useMemo<QuickKind | null>(() => {
    const path = location.pathname;
    if (path.startsWith("/library/projects")) return "project";
    if (path.startsWith("/library/prompts")) return "prompt";
    if (path.startsWith("/library/tools")) return "tool";
    if (path.startsWith("/library/flows")) return "flow";
    return null;
  }, [location.pathname]);

  const onDrag = useCallback((e: PointerEvent) => {
    if (!dragging.current) return;
    const next = Math.min(MAX, Math.max(MIN, e.clientX));
    setWidth(next);
  }, []);

  const stopDrag = useCallback(() => {
    if (!dragging.current) return;
    dragging.current = false;
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
    setWidth((w) => {
      localStorage.setItem(WIDTH_KEY, String(w));
      return w;
    });
  }, []);

  useEffect(() => {
    window.addEventListener("pointermove", onDrag);
    window.addEventListener("pointerup", stopDrag);
    return () => {
      window.removeEventListener("pointermove", onDrag);
      window.removeEventListener("pointerup", stopDrag);
    };
  }, [onDrag, stopDrag]);

  const startDrag = () => {
    dragging.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  const onChatRoute = location.pathname === "/" || location.pathname.startsWith("/c/") ||
    location.pathname.includes("/chat/");
  // Project pages own their floating button (new prompt, tool, flow or chat).
  const onProjectRoute = location.pathname.startsWith("/project/");

  return (
    <div className="flex h-[100dvh] w-full overflow-hidden bg-background">
      <aside
        className="hidden md:flex shrink-0 relative"
        style={{ width }}
      >
        <AppSidebar />
        <div
          onPointerDown={startDrag}
          onDoubleClick={() => {
            setWidth(268);
            localStorage.setItem(WIDTH_KEY, "268");
          }}
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize sidebar"
          className="absolute right-0 top-0 h-full w-1.5 translate-x-1/2 cursor-col-resize bg-border/60 hover:bg-primary/50 transition-colors"
        />
      </aside>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="left"
          className="w-[86vw] max-w-[320px] p-0 border-border [&>button:last-child]:hidden"
        >
          <AppSidebar onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex-1 min-w-0 flex flex-col border-l border-border md:border-l-0">
        <div className="md:hidden shrink-0 h-11 flex items-center px-2">
          <button
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            className="h-9 w-9 rounded-lg flex items-center justify-center text-muted-foreground"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>

        <main className="flex-1 min-h-0 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {quickKind ? (
        <>
          <button
            onClick={() => setQuickOpen(true)}
            aria-label={`Create ${quickKind}`}
            title={`Create ${quickKind}`}
            className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-foreground text-background shadow-elevated flex items-center justify-center active:scale-95 transition-transform"
          >
            <Plus className="h-6 w-6" strokeWidth={2.5} />
          </button>
          <QuickCreate kind={quickKind} open={quickOpen} onOpenChange={setQuickOpen} />
        </>
      ) : (
        !onChatRoute && !onProjectRoute && (
          <button
            onClick={() => navigate("/")}
            aria-label="New chat"
            title="New chat"
            className="md:hidden fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-foreground text-background shadow-elevated flex items-center justify-center active:scale-95 transition-transform"
          >
            <Plus className="h-6 w-6" strokeWidth={2.5} />
          </button>
        )
      )}

      <UpdateDialog />
    </div>
  );
}
