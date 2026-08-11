import { v4 as uuidv4 } from "uuid";

export type WorkflowStepKind = "prompt" | "tool" | "note";

export interface WorkflowStep {
  id: string;
  kind: WorkflowStepKind;
  refId?: string;
  label: string;
  note?: string;
}

export interface Workflow {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  steps: WorkflowStep[];
  runCount: number;
  lastRunAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const KEY = "pvault_workflows";

function read(): Workflow[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    return JSON.parse(raw, (_k, v) =>
      typeof v === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(v) ? new Date(v) : v,
    ) as Workflow[];
  } catch {
    return [];
  }
}

function write(items: Workflow[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
  } catch (e) {
    console.error("Failed to save workflows", e);
  }
}

export const workflowHelpers = {
  async getProjectWorkflows(projectId: string): Promise<Workflow[]> {
    return read()
      .filter((w) => w.projectId === projectId)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  },

  async getAllWorkflows(): Promise<Workflow[]> {
    return read().sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  },


  async getWorkflow(id: string): Promise<Workflow | undefined> {
    return read().find((w) => w.id === id);
  },

  async createWorkflow(data: {
    projectId: string;
    name: string;
    description?: string;
    steps?: WorkflowStep[];
  }): Promise<Workflow> {
    const now = new Date();
    const workflow: Workflow = {
      id: uuidv4(),
      projectId: data.projectId,
      name: data.name,
      description: data.description,
      steps: data.steps ?? [],
      runCount: 0,
      createdAt: now,
      updatedAt: now,
    };
    const all = read();
    all.push(workflow);
    write(all);
    return workflow;
  },

  async updateWorkflow(
    id: string,
    data: Partial<Omit<Workflow, "id" | "createdAt" | "projectId">>,
  ): Promise<void> {
    const all = read();
    const i = all.findIndex((w) => w.id === id);
    if (i !== -1) {
      all[i] = { ...all[i], ...data, updatedAt: new Date() };
      write(all);
    }
  },

  async deleteWorkflow(id: string): Promise<void> {
    write(read().filter((w) => w.id !== id));
  },

  async deleteProjectWorkflows(projectId: string): Promise<void> {
    write(read().filter((w) => w.projectId !== projectId));
  },

  async markRun(id: string): Promise<void> {
    const all = read();
    const i = all.findIndex((w) => w.id === id);
    if (i !== -1) {
      all[i].runCount = (all[i].runCount || 0) + 1;
      all[i].lastRunAt = new Date();
      write(all);
    }
  },

  newStep(kind: WorkflowStepKind, label: string, refId?: string): WorkflowStep {
    return { id: uuidv4(), kind, label, refId };
  },
};
