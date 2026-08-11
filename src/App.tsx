import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Routes, Route } from "react-router-dom";
import NotFound from "./pages/NotFound";
import { PromptEditor } from "./components/PromptEditor";
import ProjectView from "./pages/ProjectView";
import WorkflowView from "./pages/WorkflowView";
import Changelog from "./pages/Changelog";
import ChatView from "./pages/ChatView";
import Library from "./pages/Library";
import Auth from "./pages/Auth";
import OpenRouterCallback from "./pages/OpenRouterCallback";
import { ProjectsList } from "./pages/ProjectsList";
import { Settings } from "./pages/Settings";
import { CommandPalette } from "./components/command-palette";
import { AppShell } from "./components/layout/app-shell";
import { OnboardingGate } from "./components/onboarding-gate";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <CommandPalette />
        <OnboardingGate>
          <Routes>
            {/* Chat-first shell */}
            <Route element={<AppShell />}>
              <Route path="/" element={<ChatView />} />
              <Route path="/c/:chatId" element={<ChatView />} />
              <Route path="/library/projects" element={<ProjectsList />} />
              <Route path="/library/:kind" element={<Library />} />
              <Route path="/project/:projectId" element={<ProjectView />} />
              <Route path="/project/:projectId/chat/:chatId" element={<ChatView />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/changelog" element={<Changelog />} />
            </Route>

            {/* Full-screen surfaces */}
            <Route path="/project/:projectId/prompt/new" element={<PromptEditor />} />
            <Route path="/project/:projectId/prompt/edit" element={<PromptEditor />} />
            <Route path="/project/:projectId/workflow/:workflowId" element={<WorkflowView />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/oauth/openrouter" element={<OpenRouterCallback />} />

            {/* Legacy paths */}
            <Route path="/ai" element={<Navigate to="/settings" replace />} />
            <Route path="/insights" element={<Navigate to="/library/prompts" replace />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </OnboardingGate>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
