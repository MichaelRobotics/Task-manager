// Mock data and constants for the mission management system

import type { Mission } from '@/types/missions';

// A pool of names to generate sample missions
export const ROBOT_NAMES = ['KMP 3000P omni', 'KMP 1500P'];

export const MISSION_TYPES = ['Send', 'Receive'] as const;

// Master list of all possible locations
export const ALL_LOCATIONS = [
  'A1', 'A2', 'A3', 'A4',
  'B1', 'B2', 'B3', 'B4',
  'C1', 'C2', 'C3', 'C4'
];

// Function to generate a unique ID
let missionIdCounter = 6;

export const generateId = (): number => {
  missionIdCounter += 1;
  return missionIdCounter;
};

// Initial missions data
export const initialMissions: Mission[] = [
  { id: 1, robotName: 'KMP 3000P omni', startPoint: 'Point B1', destination: 'Point A1', status: 'Active', type: 'Send', cargoType: null, numberOfPieces: null, createdByPanelId: null, assignedToPanelId: null },
  { id: 2, robotName: 'KMP 1500P', startPoint: 'Point B2', destination: 'Point A2', status: 'Active', type: 'Receive', cargoType: null, numberOfPieces: null, createdByPanelId: null, assignedToPanelId: null },
  { id: 3, robotName: 'KMP 3000P omni', startPoint: 'Point B1', destination: 'Point C3', status: 'Completed', type: 'Send', cargoType: null, numberOfPieces: null, createdByPanelId: null, assignedToPanelId: null },
  { id: 4, robotName: null, startPoint: null, destination: 'Point C4', status: 'Pending', type: 'Send', cargoType: null, numberOfPieces: null, createdByPanelId: null, assignedToPanelId: null },
  { id: 5, robotName: null, startPoint: 'Point B4', destination: null, status: 'Pending', type: 'Receive', cargoType: null, numberOfPieces: null, createdByPanelId: null, assignedToPanelId: null },
];

// Default panel configuration
export const defaultPanelConfig = {
  userId: 'user-abc-123',
  sendToLocations: ['A1', 'A2', 'A3', 'A4'],
  receiveFromLocations: ['B1', 'B2', 'B3', 'B4'],
};



