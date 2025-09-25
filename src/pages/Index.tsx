import { useState } from "react";
import { Project } from "@/lib/database";
import { ProjectsList } from "./ProjectsList";
import { ProjectView } from "./ProjectView";

const Index = () => {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  return (
    <div className="min-h-screen bg-background">
      {selectedProject ? (
        <ProjectView 
          project={selectedProject} 
          onBack={() => setSelectedProject(null)} 
        />
      ) : (
        <ProjectsList onProjectSelect={setSelectedProject} />
      )}
    </div>
  );
};

export default Index;
