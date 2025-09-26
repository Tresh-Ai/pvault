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
  format: 'text' | 'json';
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
  url?: string;
  category: string;
  notes?: string;
  tags: string[];
  usageCount: number;
  lastUsedAt?: Date;
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

// LocalStorage keys
const STORAGE_KEYS = {
  PROJECTS: 'pvault_projects',
  PROMPTS: 'pvault_prompts', 
  TOOLS: 'pvault_tools',
  EXPORTS: 'pvault_exports',
  SETTINGS: 'pvault_settings'
};

// LocalStorage helpers
const storage = {
  get<T>(key: string): T[] {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data, (key, value) => {
        // Convert ISO date strings back to Date objects
        if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
          return new Date(value);
        }
        return value;
      }) : [];
    } catch {
      return [];
    }
  },
  
  set<T>(key: string, data: T[]): void {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  }
};

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
    const projects = storage.get<Project>(STORAGE_KEYS.PROJECTS);
    projects.push(project);
    storage.set(STORAGE_KEYS.PROJECTS, projects);
    return project;
  },

  async updateProject(id: string, data: Partial<Omit<Project, 'id' | 'createdAt'>>): Promise<void> {
    const projects = storage.get<Project>(STORAGE_KEYS.PROJECTS);
    const index = projects.findIndex(p => p.id === id);
    if (index !== -1) {
      projects[index] = { ...projects[index], ...data, updatedAt: new Date() };
      storage.set(STORAGE_KEYS.PROJECTS, projects);
    }
  },

  async deleteProject(id: string): Promise<void> {
    // Delete associated prompts and tools
    const prompts = storage.get<Prompt>(STORAGE_KEYS.PROMPTS);
    const tools = storage.get<Tool>(STORAGE_KEYS.TOOLS);
    const projects = storage.get<Project>(STORAGE_KEYS.PROJECTS);
    
    storage.set(STORAGE_KEYS.PROMPTS, prompts.filter(p => p.projectId !== id));
    storage.set(STORAGE_KEYS.TOOLS, tools.filter(t => t.projectId !== id));
    storage.set(STORAGE_KEYS.PROJECTS, projects.filter(p => p.id !== id));
  },

  async getAllProjects(): Promise<Project[]> {
    return storage.get<Project>(STORAGE_KEYS.PROJECTS);
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
    const prompts = storage.get<Prompt>(STORAGE_KEYS.PROMPTS);
    prompts.push(prompt);
    storage.set(STORAGE_KEYS.PROMPTS, prompts);
    return prompt;
  },

  async updatePrompt(id: string, data: Partial<Omit<Prompt, 'id' | 'createdAt'>>): Promise<void> {
    const prompts = storage.get<Prompt>(STORAGE_KEYS.PROMPTS);
    const index = prompts.findIndex(p => p.id === id);
    if (index !== -1) {
      prompts[index] = { ...prompts[index], ...data, updatedAt: new Date() };
      storage.set(STORAGE_KEYS.PROMPTS, prompts);
    }
  },

  async incrementPromptUsage(id: string): Promise<void> {
    const prompts = storage.get<Prompt>(STORAGE_KEYS.PROMPTS);
    const index = prompts.findIndex(p => p.id === id);
    if (index !== -1) {
      prompts[index].usageCount += 1;
      prompts[index].lastUsedAt = new Date();
      storage.set(STORAGE_KEYS.PROMPTS, prompts);
    }
  },

  async togglePromptFavorite(id: string): Promise<void> {
    const prompts = storage.get<Prompt>(STORAGE_KEYS.PROMPTS);
    const index = prompts.findIndex(p => p.id === id);
    if (index !== -1) {
      prompts[index].isFavorite = !prompts[index].isFavorite;
      storage.set(STORAGE_KEYS.PROMPTS, prompts);
    }
  },

  async deletePrompt(id: string): Promise<void> {
    const prompts = storage.get<Prompt>(STORAGE_KEYS.PROMPTS);
    storage.set(STORAGE_KEYS.PROMPTS, prompts.filter(p => p.id !== id));
  },

  async getProjectPrompts(projectId: string): Promise<Prompt[]> {
    const prompts = storage.get<Prompt>(STORAGE_KEYS.PROMPTS);
    return prompts.filter(p => p.projectId === projectId);
  },

  // Tools
  async createTool(data: Omit<Tool, 'id' | 'createdAt' | 'updatedAt' | 'usageCount' | 'lastUsedAt'>): Promise<Tool> {
    const now = new Date();
    const tool: Tool = {
      id: uuidv4(),
      ...data,
      usageCount: 0,
      createdAt: now,
      updatedAt: now,
    };
    const tools = storage.get<Tool>(STORAGE_KEYS.TOOLS);
    tools.push(tool);
    storage.set(STORAGE_KEYS.TOOLS, tools);
    return tool;
  },

  async incrementToolUsage(id: string): Promise<void> {
    const tools = storage.get<Tool>(STORAGE_KEYS.TOOLS);
    const index = tools.findIndex(t => t.id === id);
    if (index !== -1) {
      tools[index].usageCount += 1;
      tools[index].lastUsedAt = new Date();
      tools[index].updatedAt = new Date();
      storage.set(STORAGE_KEYS.TOOLS, tools);
    }
  },

  async updateTool(id: string, data: Partial<Omit<Tool, 'id' | 'createdAt'>>): Promise<void> {
    const tools = storage.get<Tool>(STORAGE_KEYS.TOOLS);
    const index = tools.findIndex(t => t.id === id);
    if (index !== -1) {
      tools[index] = { ...tools[index], ...data, updatedAt: new Date() };
      storage.set(STORAGE_KEYS.TOOLS, tools);
    }
  },

  async deleteTool(id: string): Promise<void> {
    const tools = storage.get<Tool>(STORAGE_KEYS.TOOLS);
    storage.set(STORAGE_KEYS.TOOLS, tools.filter(t => t.id !== id));
  },

  async getProjectTools(projectId: string): Promise<Tool[]> {
    const tools = storage.get<Tool>(STORAGE_KEYS.TOOLS);
    return tools.filter(t => t.projectId === projectId);
  },

  // Search
  async searchProjects(query: string): Promise<Project[]> {
    const projects = storage.get<Project>(STORAGE_KEYS.PROJECTS);
    return projects.filter(project => 
      project.name.toLowerCase().includes(query.toLowerCase()) ||
      project.description?.toLowerCase().includes(query.toLowerCase()) ||
      project.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
    );
  },

  async searchPrompts(query: string, projectId?: string): Promise<Prompt[]> {
    const prompts = storage.get<Prompt>(STORAGE_KEYS.PROMPTS);
    let filtered = prompts.filter(prompt =>
      prompt.title.toLowerCase().includes(query.toLowerCase()) ||
      prompt.content.toLowerCase().includes(query.toLowerCase()) ||
      prompt.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
    );

    if (projectId) {
      filtered = filtered.filter(prompt => prompt.projectId === projectId);
    }

    return filtered;
  },

  async searchTools(query: string, projectId?: string): Promise<Tool[]> {
    const tools = storage.get<Tool>(STORAGE_KEYS.TOOLS);
    let filtered = tools.filter(tool =>
      tool.name.toLowerCase().includes(query.toLowerCase()) ||
      tool.notes?.toLowerCase().includes(query.toLowerCase()) ||
      tool.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
    );

    if (projectId) {
      filtered = filtered.filter(tool => tool.projectId === projectId);
    }

    return filtered;
  },

  // Export
  async recordExport(data: Omit<ExportRecord, 'id' | 'createdAt'>): Promise<ExportRecord> {
    const exportRecord: ExportRecord = {
      id: uuidv4(),
      ...data,
      createdAt: new Date(),
    };
    const exports = storage.get<ExportRecord>(STORAGE_KEYS.EXPORTS);
    exports.push(exportRecord);
    storage.set(STORAGE_KEYS.EXPORTS, exports);
    return exportRecord;
  },

  // Settings
  async getSettings(): Promise<Settings> {
    const settings = storage.get<Settings>(STORAGE_KEYS.SETTINGS);
    return settings[0] || {
      theme: 'light',
      sortPreference: 'mostRecent',
      protectWithPIN: false,
    };
  },

  async updateSettings(newSettings: Partial<Settings>): Promise<void> {
    const defaultSettings: Settings = {
      theme: 'light',
      sortPreference: 'mostRecent',
      protectWithPIN: false,
    };
    const settings = [{ ...defaultSettings, ...newSettings }];
    storage.set(STORAGE_KEYS.SETTINGS, settings);
  },
};