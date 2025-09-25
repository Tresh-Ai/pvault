import { saveAs } from 'file-saver';
import { Prompt } from './database';

export const exportHelpers = {
  async exportPromptsAsTxt(prompts: Prompt[], filename: string): Promise<void> {
    const content = prompts
      .map(prompt => `### ${prompt.title}\n${prompt.content}\n\n---\n`)
      .join('\n');
    
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    saveAs(blob, `${filename}.txt`);
  },

  async exportPromptsAsJson(prompts: Prompt[], filename: string): Promise<void> {
    const exportData = prompts.map(prompt => ({
      id: prompt.id,
      title: prompt.title,
      content: prompt.content,
      tags: prompt.tags,
      category: prompt.category,
      createdAt: prompt.createdAt.toISOString(),
      isFavorite: prompt.isFavorite,
    }));

    const content = JSON.stringify(exportData, null, 2);
    const blob = new Blob([content], { type: 'application/json;charset=utf-8' });
    saveAs(blob, `${filename}.json`);
  },

  getFileSize(content: string): number {
    return new Blob([content]).size;
  },
};