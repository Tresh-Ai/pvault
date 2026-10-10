import { describe, it, expect, beforeEach, vi } from "vitest";
import { searchEverything } from "./search";
import { dbHelpers } from "./database";
import { workflowHelpers } from "./workflows";
import { chatHelpers } from "./chats";

describe("searchEverything", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns empty array for whitespace/empty query", async () => {
    const results = await searchEverything("   ");
    expect(results).toEqual([]);
  });

  it("correctly matches and ranks projects, prompts, tools, flows, and chats", async () => {
    vi.spyOn(dbHelpers, "getAllProjects").mockResolvedValue([
      { id: "p1", name: "Authentication Service", description: "Auth stuff", tags: ["security"], createdAt: new Date(), updatedAt: new Date() },
    ]);
    vi.spyOn(dbHelpers, "getAllPrompts").mockResolvedValue([
      {
        id: "pr1",
        projectId: "p1",
        title: "Auth Prompt",
        content: "Write an auth function",
        tags: ["auth"],
        category: "Code",
        format: "text",
        createdAt: new Date(),
        updatedAt: new Date(),
        usageCount: 0,
        isFavorite: false,
        versions: [],
      },
    ]);
    vi.spyOn(dbHelpers, "getAllTools").mockResolvedValue([
      {
        id: "t1",
        projectId: "p1",
        name: "OAuth Debugger",
        notes: "Tool for auth testing",
        category: "API",
        tags: ["auth"],
        usageCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    vi.spyOn(workflowHelpers, "getAllWorkflows").mockResolvedValue([
      {
        id: "f1",
        projectId: "p1",
        name: "Auth Setup Flow",
        description: "Steps to setup auth",
        steps: [{ id: "s1", kind: "prompt", label: "Generate tokens" }],
        runCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    vi.spyOn(chatHelpers, "getAllChats").mockResolvedValue([
      {
        id: "c1",
        projectId: "p1",
        title: "Auth Discussion",
        messages: [{ id: "m1", role: "user", content: "How does auth work?", createdAt: new Date() }],
        usedPromptIds: [],
        usedWorkflowIds: [],
        usedToolIds: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "c2",
        projectId: "p1",
        title: "General Chat",
        messages: [{ id: "m2", role: "user", content: "Authentication details inside message", createdAt: new Date() }],
        usedPromptIds: [],
        usedWorkflowIds: [],
        usedToolIds: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    const results = await searchEverything("auth");
    expect(results.length).toBeGreaterThan(0);

    const resultKinds = results.map((r) => r.kind);
    expect(resultKinds).toContain("project");
    expect(resultKinds).toContain("prompt");
    expect(resultKinds).toContain("tool");
    expect(resultKinds).toContain("flow");
    expect(resultKinds).toContain("chat");

    const c1Result = results.find((r) => r.id === "c1");
    const c2Result = results.find((r) => r.id === "c2");
    expect(c1Result).toBeDefined();
    expect(c2Result).toBeDefined();
    expect(c1Result!.score).toBeGreaterThan(c2Result!.score);
  });
});
