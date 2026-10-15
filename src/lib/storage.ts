import { VideoProject, AISettings } from './types';

const PROJECTS_STORAGE_KEY = 'viralclipper_projects';
const SETTINGS_STORAGE_KEY = 'viralclipper_ai_settings';
const ACTIVE_PROJECT_ID_KEY = 'viralclipper_active_project_id';

export class LocalStorageManager {
  static getSettings(): AISettings {
    if (typeof window === 'undefined') {
      return { provider: 'google', apiKey: '', modelName: 'gemini-1.5-flash' };
    }
    try {
      const data = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn('Failed to parse settings from storage:', e);
    }
    return { provider: 'google', apiKey: '', modelName: 'gemini-1.5-flash' };
  }

  static saveSettings(settings: AISettings): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save settings to storage:', e);
    }
  }

  static getProjects(): VideoProject[] {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(PROJECTS_STORAGE_KEY);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn('Failed to parse projects from storage:', e);
    }
    return [];
  }

  static saveProject(project: VideoProject): void {
    if (typeof window === 'undefined') return;
    try {
      const projects = this.getProjects();
      const existingIdx = projects.findIndex((p) => p.id === project.id);
      if (existingIdx >= 0) {
        projects[existingIdx] = { ...project, updatedAt: Date.now() };
      } else {
        projects.unshift({ ...project, updatedAt: Date.now() });
      }
      localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects));
      localStorage.setItem(ACTIVE_PROJECT_ID_KEY, project.id);
    } catch (e) {
      console.error('Failed to save project:', e);
    }
  }

  static deleteProject(projectId: string): void {
    if (typeof window === 'undefined') return;
    try {
      const projects = this.getProjects().filter((p) => p.id !== projectId);
      localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects));
    } catch (e) {
      console.error('Failed to delete project:', e);
    }
  }

  static getActiveProjectId(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(ACTIVE_PROJECT_ID_KEY);
  }
}
