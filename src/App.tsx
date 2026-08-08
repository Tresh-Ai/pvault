import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { PromptEditor } from "./components/PromptEditor";
import ProjectView from "./pages/ProjectView";
import WorkflowView from "./pages/WorkflowView";
import Changelog from "./pages/Changelog";
import ChatView from "./pages/ChatView";
import AISettings from "./pages/AISettings";
import Insights from "./pages/Insights";
import { Settings } from "./pages/Settings";
import { CommandPalette } from "./components/command-palette";

const queryClient = new QueryClient();

function SettingsRoute() {
  const navigate = useNavigate();
  return <Settings onBack={() => navigate("/")} />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <CommandPalette />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/settings" element={<SettingsRoute />} />
          <Route path="/insights" element={<Insights />} />
          <Route path="/changelog" element={<Changelog />} />
          <Route path="/project/:projectId" element={<ProjectView />} />
          <Route path="/project/:projectId/prompt/new" element={<PromptEditor />} />
          <Route path="/project/:projectId/prompt/edit" element={<PromptEditor />} />
          <Route path="/project/:projectId/workflow/:workflowId" element={<WorkflowView />} />
          <Route path="/ai" element={<AISettings />} />
          <Route path="/project/:projectId/chat/:chatId" element={<ChatView />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
