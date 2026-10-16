import { describe, it, expect, beforeEach } from "vitest";
import { dbHelpers } from "./database";

// Simple in-memory localStorage mock for node environment
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    clear: () => {
      store = {};
    },
    removeItem: (key: string) => {
      delete store[key];
    },
  };
})();

Object.defineProperty(globalThis, "localStorage", {
  value: localStorageMock,
  writable: true,
});

describe("dbHelpers batch collection fetching", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("fetches collections and computes project counts in single pass", async () => {
    const project = await dbHelpers.createProject({
      name: "Test Project",
      description: "Sample",
      tags: ["test"],
    });

    await dbHelpers.createPrompt({
      projectId: project.id,
      title: "Prompt 1",
      content: "Content 1",
      category: "Writing",
      format: "text",
      tags: [],
      isFavorite: false,
    });

    await dbHelpers.createTool({
      projectId: project.id,
      name: "Tool 1",
      category: "Utility",
      tags: [],
    });

    const [projects, prompts, tools] = await Promise.all([
      dbHelpers.getAllProjects(),
      dbHelpers.getAllPrompts(),
      dbHelpers.getAllTools(),
    ]);

    expect(projects).toHaveLength(1);
    expect(prompts).toHaveLength(1);
    expect(tools).toHaveLength(1);

    const counts: Record<string, { prompts: number; tools: number }> = {};
    for (const p of projects) {
      counts[p.id] = { prompts: 0, tools: 0 };
    }
    for (const pr of prompts) {
      if (counts[pr.projectId]) counts[pr.projectId].prompts++;
    }
    for (const t of tools) {
      if (counts[t.projectId]) counts[t.projectId].tools++;
    }

    expect(counts[project.id]).toEqual({ prompts: 1, tools: 1 });
  });
});
