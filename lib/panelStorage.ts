// Panel storage utility for managing multiple panels
import type { PanelConfig } from '@/types/missions';

const STORAGE_KEY = 'mission_panels';

export interface StoredPanel extends PanelConfig {
  id: string;
  createdAt: number;
}

export function getAllPanels(): StoredPanel[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function savePanel(panel: PanelConfig): StoredPanel {
  const panels = getAllPanels();
  const newPanel: StoredPanel = {
    ...panel,
    id: `panel-${Date.now()}`,
    createdAt: Date.now(),
  };
  
  // Check if panel with same userId already exists
  const existingIndex = panels.findIndex((p) => p.userId === panel.userId);
  
  if (existingIndex >= 0) {
    panels[existingIndex] = newPanel;
  } else {
    panels.push(newPanel);
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(panels));
  return newPanel;
}

export function getPanelByUserId(userId: string): StoredPanel | null {
  const panels = getAllPanels();
  return panels.find((p) => p.userId === userId) || null;
}

export function deletePanel(userId: string): void {
  const panels = getAllPanels();
  const filtered = panels.filter((p) => p.userId !== userId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}




