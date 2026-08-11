import { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Menu, Plus } from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { Logo } from "@/components/logo";
import { UpdateDialog } from "@/components/update-dialog";

/** ChatGPT-style shell: persistent sidebar on desktop, slide-over on mobile. */
export function AppShell() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => setOpen(false), [location.pathname]);

  return (
    <div className="flex h-[100dvh] w-full overflow-hidden bg-background">
      <aside className="hidden md:flex w-[266px] shrink-0 border-r border-border">
        <AppSidebar />
      </aside>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-[86vw] max-w-[300px] p-0 border-border">
          <AppSidebar onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex-1 min-w-0 flex flex-col">
        <div className="md:hidden shrink-0 h-12 flex items-center gap-1 px-2 border-b border-border bg-background/85 backdrop-blur-md">
          <button
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            className="h-9 w-9 rounded-lg flex items-center justify-center text-muted-foreground"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex-1 flex justify-center">
            <Logo withWordmark />
          </div>
          <button
            onClick={() => navigate("/")}
            aria-label="New chat"
            className="h-9 w-9 rounded-lg flex items-center justify-center text-muted-foreground"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>

        <main className="flex-1 min-h-0 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      <UpdateDialog />
    </div>
  );
}
