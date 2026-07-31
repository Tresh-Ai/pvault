import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { PromptEditor } from "./components/PromptEditor";
import ProjectView from "./pages/ProjectView";
import WorkflowView from "./pages/WorkflowView";
import Changelog from "./pages/Changelog";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/changelog" element={<Changelog />} />
          <Route path="/project/:projectId" element={<ProjectView />} />
          <Route path="/project/:projectId/prompt/new" element={<PromptEditor />} />
          <Route path="/project/:projectId/prompt/edit" element={<PromptEditor />} />
          <Route path="/project/:projectId/workflow/:workflowId" element={<WorkflowView />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
