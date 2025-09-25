import Dexie, { Table } from 'dexie';
import { v4 as uuidv4 } from 'uuid';

// Database schema interfaces
export interface Project {
  id: string;
  name: string;
  description?: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Prompt {
  id: string;
  projectId: string;
  title: string;
  content: string;
  tags: string[];
  category: string;
  createdAt: Date;
  updatedAt: Date;
  lastUsedAt?: Date;
  usageCount: number;
  isFavorite: boolean;
}

export interface Tool {
  id: string;
  projectId: string;
  name: string;
  url: string;
  category: string;
  notes?: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ExportRecord {
  id: string;
  projectId?: string;
  name: string;
  format: 'txt' | 'json';
  promptIds: string[];
  createdAt: Date;
  fileSize?: number;
}

export interface Settings {
  theme: 'light' | 'dark' | 'system';
  sortPreference: 'mostRecent' | 'mostUsed' | 'alpha';
  protectWithPIN: boolean;
  pinHash?: string;
}

// Database class
export class PVaultDatabase extends Dexie {
  projects!: Table<Project>;
  prompts!: Table<Prompt>;
  tools!: Table<Tool>;
  exports!: Table<ExportRecord>;
  settings!: Table<Settings>;

  constructor() {
    super('PVaultDatabase');
    
    this.version(1).stores({
      projects: '++id, name, tags, createdAt',
      prompts: '++id, projectId, title, tags, lastUsedAt, isFavorite, category',
      tools: '++id, projectId, name, category, tags',
      exports: '++id, projectId, createdAt',
      settings: 'theme'
    });
  }
}

export const db = new PVaultDatabase();

// Helper functions for database operations
export const dbHelpers = {
  // Projects
  async createProject(data: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project> {
    const now = new Date();
    const project: Project = {
      id: uuidv4(),
      ...data,
      createdAt: now,
      updatedAt: now,
    };
    await db.projects.add(project);
    return project;
  },

  async updateProject(id: string, data: Partial<Omit<Project, 'id' | 'createdAt'>>): Promise<void> {
    await db.projects.update(id, { ...data, updatedAt: new Date() });
  },

  async deleteProject(id: string): Promise<void> {
    // Delete associated prompts and tools
    await db.prompts.where('projectId').equals(id).delete();
    await db.tools.where('projectId').equals(id).delete();
    await db.projects.delete(id);
  },

  // Prompts
  async createPrompt(data: Omit<Prompt, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>): Promise<Prompt> {
    const now = new Date();
    const prompt: Prompt = {
      id: uuidv4(),
      ...data,
      createdAt: now,
      updatedAt: now,
      usageCount: 0,
    };
    await db.prompts.add(prompt);
    return prompt;
  },

  async updatePrompt(id: string, data: Partial<Omit<Prompt, 'id' | 'createdAt'>>): Promise<void> {
    await db.prompts.update(id, { ...data, updatedAt: new Date() });
  },

  async incrementPromptUsage(id: string): Promise<void> {
    const prompt = await db.prompts.get(id);
    if (prompt) {
      await db.prompts.update(id, {
        usageCount: prompt.usageCount + 1,
        lastUsedAt: new Date(),
      });
    }
  },

  async togglePromptFavorite(id: string): Promise<void> {
    const prompt = await db.prompts.get(id);
    if (prompt) {
      await db.prompts.update(id, { isFavorite: !prompt.isFavorite });
    }
  },

  // Tools
  async createTool(data: Omit<Tool, 'id' | 'createdAt' | 'updatedAt'>): Promise<Tool> {
    const now = new Date();
    const tool: Tool = {
      id: uuidv4(),
      ...data,
      createdAt: now,
      updatedAt: now,
    };
    await db.tools.add(tool);
    return tool;
  },

  async updateTool(id: string, data: Partial<Omit<Tool, 'id' | 'createdAt'>>): Promise<void> {
    await db.tools.update(id, { ...data, updatedAt: new Date() });
  },

  // Search
  async searchProjects(query: string): Promise<Project[]> {
    return db.projects
      .filter(project => 
        project.name.toLowerCase().includes(query.toLowerCase()) ||
        project.description?.toLowerCase().includes(query.toLowerCase()) ||
        project.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
      )
      .toArray();
  },

  async searchPrompts(query: string, projectId?: string): Promise<Prompt[]> {
    let collection = db.prompts.filter(prompt =>
      prompt.title.toLowerCase().includes(query.toLowerCase()) ||
      prompt.content.toLowerCase().includes(query.toLowerCase()) ||
      prompt.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
    );

    if (projectId) {
      collection = collection.and(prompt => prompt.projectId === projectId);
    }

    return collection.toArray();
  },

  async searchTools(query: string, projectId?: string): Promise<Tool[]> {
    let collection = db.tools.filter(tool =>
      tool.name.toLowerCase().includes(query.toLowerCase()) ||
      tool.notes?.toLowerCase().includes(query.toLowerCase()) ||
      tool.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
    );

    if (projectId) {
      collection = collection.and(tool => tool.projectId === projectId);
    }

    return collection.toArray();
  },

  // Export
  async recordExport(data: Omit<ExportRecord, 'id' | 'createdAt'>): Promise<ExportRecord> {
    const exportRecord: ExportRecord = {
      id: uuidv4(),
      ...data,
      createdAt: new Date(),
    };
    await db.exports.add(exportRecord);
    return exportRecord;
  },

  // Settings
  async getSettings(): Promise<Settings> {
    const settings = await db.settings.get('light');
    return settings || {
      theme: 'light',
      sortPreference: 'mostRecent',
      protectWithPIN: false,
    };
  },

  async updateSettings(settings: Partial<Settings>): Promise<void> {
    const defaultSettings: Settings = {
      theme: 'light',
      sortPreference: 'mostRecent',
      protectWithPIN: false,
    };
    await db.settings.put({ ...defaultSettings, ...settings });
  },
};