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
  cargoType: string | null;
  numberOfPieces: number | null;
  createdByPanelId: string | null; // Panel that created this mission
  assignedToPanelId: string | null; // Panel that accepted/took this mission
}

export interface PanelConfig {
  userId: string;
  selectedAreas: string[]; // Step 1 areas - areas where operator works
  sendToLocations: string[];
  receiveFromLocations: string[];
}

