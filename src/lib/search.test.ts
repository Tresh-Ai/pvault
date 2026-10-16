import { describe, it, expect, beforeEach, beforeAll } from "vitest";
import { searchEverything } from "./search";
import { dbHelpers } from "./database";
import { workflowHelpers } from "./workflows";
import { chatHelpers } from "./chats";

describe("searchEverything", () => {
  beforeAll(() => {
    let store: Record<string, string> = {};
    const localStorageMock = {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => {
        store[key] = value.toString();
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        store = {};
      },
    };
    Object.defineProperty(globalThis, "localStorage", {
      value: localStorageMock,
      writable: true,
    });
  });

  beforeEach(() => {
    localStorage.clear();
  });

  it("returns empty results for empty or whitespace query", async () => {
    const results = await searchEverything("   ");
    expect(results).toEqual([]);
  });

  it("scores and finds matching projects, prompts, tools, flows and chats", async () => {
    const project = await dbHelpers.createProject({ name: "Alpha Project", description: "Test project", tags: ["tech"] });
    await dbHelpers.createPrompt({ projectId: project.id, title: "Alpha Prompt", content: "Write code", category: "Code", tags: ["dev"], format: "text" });
    await dbHelpers.createTool({ projectId: project.id, name: "Alpha Tool", notes: "Utility", category: "Other", tags: [], url: "https://example.com" });
    await workflowHelpers.createWorkflow({ projectId: project.id, name: "Alpha Workflow", description: "Flow desc", steps: [{ id: "1", type: "note", label: "Step one" }] });
    await chatHelpers.createChat(project.id, "Alpha Chat");

    const results = await searchEverything("alpha");
    expect(results.length).toBe(5);

    const kinds = results.map((r) => r.kind);
    expect(kinds).toContain("project");
    expect(kinds).toContain("prompt");
    expect(kinds).toContain("tool");
    expect(kinds).toContain("flow");
    expect(kinds).toContain("chat");
  });

  it("finds matching chat message content without allocating whole-chat concatenated string", async () => {
    const project = await dbHelpers.createProject({ name: "Project", description: "", tags: [] });
    const chat = await chatHelpers.createChat(project.id, "General Chat");
    chat.messages.push(chatHelpers.newMessage("user", "Need help with quantum computing"));
    await chatHelpers.saveChat(chat);

    const results = await searchEverything("quantum");
    expect(results.length).toBe(1);
    expect(results[0].title).toBe("General Chat");
    expect(results[0].kind).toBe("chat");
  });
});
