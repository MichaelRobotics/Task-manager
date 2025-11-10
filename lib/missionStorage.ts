// Mission storage utility for managing missions across all panels
import type { Mission, MissionType } from '@/types/missions';

const STORAGE_KEY = 'all_missions';

export function getAllMissions(): Mission[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function saveMission(mission: Mission): void {
  const missions = getAllMissions();
  const existingIndex = missions.findIndex((m) => m.id === mission.id);
  
  if (existingIndex >= 0) {
    missions[existingIndex] = mission;
  } else {
    missions.push(mission);
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(missions));
}

export function saveMissions(missions: Mission[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(missions));
}

export function deleteMission(missionId: number): void {
  const missions = getAllMissions();
  const filtered = missions.filter((m) => m.id !== missionId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

export function clearAllMissions(): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
  }
}

export interface PanelMission extends Mission {
  displayType: MissionType; // How this mission appears in this panel (Send or Receive)
  isCreatedByThisPanel: boolean; // Whether this panel created the mission
}

export function getMissionsForPanel(
  panelId: string,
  panelSendTo: string[],
  panelReceiveFrom: string[]
): PanelMission[] {
  const allMissions = getAllMissions();
  
  // Filter out missions without createdByPanelId (old missions from before the update)
  const validMissions = allMissions.filter((m) => m.createdByPanelId !== undefined && m.createdByPanelId !== null);
  
  return validMissions
    .map((mission) => {
      // Check if this panel created the mission
      const isCreatedByThisPanel = mission.createdByPanelId === panelId;
      const assignedToPanelId = mission.assignedToPanelId ?? null;
      const isAssignedToThisPanel = assignedToPanelId === panelId;
      const isMissionAssigned = assignedToPanelId !== null;

      // If mission is assigned to another panel, hide it
      if (isMissionAssigned && !isCreatedByThisPanel && !isAssignedToThisPanel) {
        return null;
      }
      
      // Determine how this mission appears in this panel
      let displayType: MissionType | null = null;
      let shouldShow = false;
      
      // For Completed missions, show in both panels (creating and activating)
      if (mission.status === 'Completed' && mission.startPoint && mission.destination) {
        const startPoint = mission.startPoint.replace('Point ', '');
        const destinationPoint = mission.destination.replace('Point ', '');
        
        // Show in creating panel - always show as original type
        if (isCreatedByThisPanel) {
          displayType = mission.type; // Show as original type (Send or Receive)
          shouldShow = true;
        }
        // Show in activating panel (the one that clicked Send/Receive)
        else {
          // Determine display type based on panel's perspective
          // Priority: Check Receive first (more specific), then Send
          // If panel can Receive From start point, it was a Receive mission for this panel
          const canReceiveFromStart = panelReceiveFrom.includes(startPoint);
          // If panel can Send To destination, it was a Send mission for this panel
          const canSendToDestination = panelSendTo.includes(destinationPoint);
          
          if (canReceiveFromStart) {
            // Panel received this mission → show as Receive
            displayType = 'Receive';
            shouldShow = true;
          } else if (canSendToDestination) {
            // Panel sent this mission → show as Send
            displayType = 'Send';
            shouldShow = true;
          }
        }
      }
      // For In queue/Active missions, show in both panels (creating and activating)
      else if ((mission.status === 'In queue' || mission.status === 'Active') && mission.startPoint && mission.destination) {
        const startPoint = mission.startPoint.replace('Point ', '');
        const destinationPoint = mission.destination.replace('Point ', '');
        
        // Show in creating panel - always show as original type
        if (isCreatedByThisPanel) {
          displayType = mission.type; // Show as original type (Send or Receive)
          shouldShow = true;
        }
        // Show in activating panel (the one that clicked Send/Receive)
        else {
          // Determine display type based on panel's perspective
          // Priority: Check Receive first (more specific), then Send
          // If panel can Receive From start point, it was a Receive mission for this panel
          const canReceiveFromStart = panelReceiveFrom.includes(startPoint);
          // If panel can Send To destination, it was a Send mission for this panel
          const canSendToDestination = panelSendTo.includes(destinationPoint);
          
          if (canReceiveFromStart) {
            // Panel received this mission → show as Receive
            displayType = 'Receive';
            shouldShow = true;
          } else if (canSendToDestination) {
            // Panel sent this mission → show as Send
            displayType = 'Send';
            shouldShow = true;
          }
        }
      }
      // For Pending missions, use location-based filtering
      else if (mission.status === 'Pending') {
        if (mission.type === 'Send' && mission.destination) {
          // Original Send mission
          const destinationPoint = mission.destination.replace('Point ', '');
          
          // If this panel created the mission, always show it as Send
          if (isCreatedByThisPanel) {
            displayType = 'Send';
            shouldShow = true;
          }
          // If another panel created it and this panel can Receive From that destination, show as Receive
          else if (!isMissionAssigned && panelReceiveFrom.includes(destinationPoint)) {
            displayType = 'Receive';
            shouldShow = true;
          }
        } else if (mission.type === 'Receive' && mission.startPoint) {
          // Original Receive mission
          const startPoint = mission.startPoint.replace('Point ', '');
          
          // If this panel created the mission, always show it as Receive
          if (isCreatedByThisPanel) {
            displayType = 'Receive';
            shouldShow = true;
          }
          // If another panel created it and this panel can Send To that start point, show as Send
          else if (!isMissionAssigned && panelSendTo.includes(startPoint)) {
            displayType = 'Send';
            shouldShow = true;
          }
        }
      }
      
      if (!shouldShow || !displayType) {
        return null;
      }
      
      return {
        ...mission,
        displayType,
        isCreatedByThisPanel,
      };
    })
    .filter((mission): mission is PanelMission => mission !== null);
}
