// Type definitions for the mission management system

export type MissionStatus = 'Pending' | 'In queue' | 'Active' | 'Completed';

export type MissionType = 'Send' | 'Receive';

export interface Mission {
  id: number;
  robotName: string | null;
  startPoint: string | null;
  destination: string | null;
  status: MissionStatus;
  type: MissionType;
  createdByPanelId: string | null; // Panel that created this mission
  assignedToPanelId: string | null; // Panel that accepted/took this mission
}

export interface PanelConfig {
  userId: string;
  sendToLocations: string[];
  receiveFromLocations: string[];
}

