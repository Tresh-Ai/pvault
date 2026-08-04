import { v4 as uuidv4 } from "uuid";

export interface ChatAttachment {
  kind: "prompt" | "workflow" | "tool";
  id: string;
  label: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
  /** Prompts / flows / tools that were pulled into this message. */
  attachments?: ChatAttachment[];
  error?: boolean;
}

export interface Chat {
  id: string;
  projectId: string;
  title: string;
  model?: string;
  messages: ChatMessage[];
  /** Flat index of every prompt/flow/tool ever used in this chat - powers "where did I use this?" */
  usedPromptIds: string[];
  usedWorkflowIds: string[];
  usedToolIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

const KEY = "pvault_chats";

function read(): Chat[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    return JSON.parse(raw, (_k, v) =>
      typeof v === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(v) ? new Date(v) : v,
    ) as Chat[];
  } catch {
    return [];
  }
}

function write(items: Chat[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
  } catch (e) {
    console.error("Failed to save chats", e);
  }
}

function byRecent(a: Chat, b: Chat) {
  return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
}

export const chatHelpers = {
  async getProjectChats(projectId: string): Promise<Chat[]> {
    return read()
      .filter((c) => c.projectId === projectId)
      .sort(byRecent);
  },

  async getAllChats(): Promise<Chat[]> {
    return read().sort(byRecent);
  },

  async getChat(id: string): Promise<Chat | undefined> {
    return read().find((c) => c.id === id);
  },

  async createChat(projectId: string, title = "New chat", attachments: ChatAttachment[] = []): Promise<Chat> {
    const now = new Date();
    const chat: Chat = {
      id: uuidv4(),
      projectId,
      title,
      messages: [],
      usedPromptIds: attachments.filter((a) => a.kind === "prompt").map((a) => a.id),
      usedWorkflowIds: attachments.filter((a) => a.kind === "workflow").map((a) => a.id),
      usedToolIds: attachments.filter((a) => a.kind === "tool").map((a) => a.id),
      createdAt: now,
      updatedAt: now,
    };
    const all = read();
    all.push(chat);
    write(all);
    return chat;
  },

  async saveChat(chat: Chat): Promise<void> {
    const all = read();
    const i = all.findIndex((c) => c.id === chat.id);
    const next = { ...chat, updatedAt: new Date() };
    if (i === -1) all.push(next);
    else all[i] = next;
    write(all);
  },

  async deleteChat(id: string): Promise<void> {
    write(read().filter((c) => c.id !== id));
  },

  async deleteProjectChats(projectId: string): Promise<void> {
    write(read().filter((c) => c.projectId !== projectId));
  },

  /** Every chat where a given prompt / flow / tool was used. */
  async findChatsUsing(kind: ChatAttachment["kind"], id: string): Promise<Chat[]> {
    const field =
      kind === "prompt" ? "usedPromptIds" : kind === "workflow" ? "usedWorkflowIds" : "usedToolIds";
    return read()
      .filter((c) => (c[field] as string[] | undefined)?.includes(id))
      .sort(byRecent);
  },

  trackUsage(chat: Chat, attachments: ChatAttachment[]): Chat {
    const add = (list: string[] = [], kind: ChatAttachment["kind"]) => [
      ...new Set([...list, ...attachments.filter((a) => a.kind === kind).map((a) => a.id)]),
    ];
    return {
      ...chat,
      usedPromptIds: add(chat.usedPromptIds, "prompt"),
      usedWorkflowIds: add(chat.usedWorkflowIds, "workflow"),
      usedToolIds: add(chat.usedToolIds, "tool"),
    };
  },

  newMessage(role: ChatMessage["role"], content: string, attachments?: ChatAttachment[]): ChatMessage {
    return { id: uuidv4(), role, content, createdAt: new Date(), attachments };
  },
};
