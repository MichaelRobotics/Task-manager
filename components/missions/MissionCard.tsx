'use client'

import type { Mission } from '@/types/missions';
import { getPanelByUserId } from '@/lib/panelStorage';

// Get custom location names from localStorage
const AREA_NAMES_STORAGE_KEY = 'area_custom_names';

const getLocationNames = (): Record<string, string> => {
  if (typeof window === 'undefined') return {};
  try {
    const stored = localStorage.getItem(AREA_NAMES_STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

interface MissionCardProps {
  mission: Mission;
  displayType: 'Send' | 'Receive'; // How this mission appears in current panel
  isCreatedByThisPanel: boolean; // Whether current panel created this mission
  onCancelMission: (id: number) => void;
  onSendMission: (id: number) => void;
  onReceiveMission: (id: number) => void;
}

export function MissionCard({ 
  mission,
  displayType,
  isCreatedByThisPanel,
  onCancelMission, 
  onSendMission, 
  onReceiveMission 
}: MissionCardProps) {
  const isActive = mission.status === 'Active';
  const isPending = mission.status === 'Pending';
  const isInQueue = mission.status === 'In queue';

  // Map status to display text
  const getStatusDisplayText = (status: string) => {
    if (status === 'Pending') return 'Ordered';
    if (status === 'In queue') return 'Departure';
    return status;
  };

  const cardClasses = `
    bg-white p-4 rounded-lg shadow-md transition-all duration-300
    border-l-4 
    ${isActive ? 'border-green-500 hover:shadow-lg' : ''}
    ${isPending ? 'border-amber-500 hover:shadow-lg' : ''}
    ${isInQueue ? 'border-blue-500 hover:shadow-lg' : ''}
    ${mission.status === 'Completed' ? 'border-gray-400 opacity-70' : ''}
  `;

  const statusClasses = `
    px-2 py-0.5 text-xs font-semibold rounded
    ${isActive ? 'bg-green-100 text-green-800' : ''}
    ${isPending ? 'bg-amber-100 text-amber-800' : ''}
    ${isInQueue ? 'bg-blue-100 text-blue-800' : ''}
    ${mission.status === 'Completed' ? 'bg-gray-200 text-gray-700' : ''}
  `;

  // Helper to remove "Point " prefix and get area name
  const getAreaDisplayName = (location: string | null): string | null => {
    if (!location) return null;
    const areaCode = location.replace(/^Point /, '');
    const locationNames = getLocationNames();
    // Return custom name if exists, otherwise return area code
    return locationNames[areaCode] || areaCode;
  };
  
  // Determine what to display based on displayType
  // Use the same logic for all statuses to maintain consistent "From" and "To" values
  // - Send: From = startPoint (area in panel that gets mission), To = destination (area in panel which set mission)
  // - Receive: From = startPoint (area in panel which set mission), To = destination (area in panel that gets mission)
  
  // Get origin panel's selected areas if mission was created by another panel
  const originPanel = !isCreatedByThisPanel && mission.createdByPanelId 
    ? getPanelByUserId(mission.createdByPanelId)
    : null;
  const originSelectedAreas = originPanel?.selectedAreas || [];
  
  let effectiveStartPoint: string | null = null;
  let effectiveDestination: string | null = null;
  
  if (isCreatedByThisPanel) {
    // Panel created this mission - show as original type
    effectiveStartPoint = mission.startPoint;
    effectiveDestination = mission.destination;
  } else {
    // Another panel created this mission
    if (displayType === 'Send' && mission.type === 'Send') {
      // Original Send mission shown as Send in receiving panel
      // From: startPoint (area in panel that gets mission - set when they clicked Send)
      // To: destination from origin panel (where origin panel wants to send to)
      effectiveStartPoint = mission.startPoint;
      effectiveDestination = mission.destination;
    } else if (displayType === 'Receive' && mission.type === 'Receive') {
      // Original Receive mission shown as Receive in sending panel
      // From: startPoint from origin panel (where origin panel wants to receive from)
      // To: destination (area in panel that gets mission - set when they clicked Receive)
      effectiveStartPoint = mission.startPoint;
      effectiveDestination = mission.destination;
    } else if (displayType === 'Send' && mission.type === 'Receive') {
      // Original Receive mission shown as Send in receiving panel
      // From: original startPoint (where origin panel wants to receive from - preserved in handleSendMission)
      // To: area in origin panel where they want to receive to (origin panel's selectedAreas, step 1)
      // After handleSendMission fix, mission.startPoint is preserved for Receive missions
      effectiveStartPoint = mission.startPoint; // Preserved original value (C3 - where origin wants to receive from)
      // Use origin panel's selected area (step 1) as the destination where they want to receive to
      if (originSelectedAreas.length > 0) {
        effectiveDestination = originSelectedAreas[0];
      } else {
        // Fallback to mission.destination if origin areas not available
        effectiveDestination = mission.destination || mission.startPoint;
      }
    } else if (displayType === 'Receive' && mission.type === 'Send') {
      // Original Send mission shown as Receive in sending panel
      // From: area in origin panel (the area that created the Send mission)
      // To: original destination from Send mission (preserved in startPoint after Receive is clicked, or in destination if still pending)
      if (originSelectedAreas.length > 0) {
        // Use the first origin area as the "From" location
        effectiveStartPoint = originSelectedAreas[0];
      } else {
        effectiveStartPoint = null;
      }
      // For Pending: use mission.destination (original Send destination)
      // For set missions: mission.startPoint contains the original destination (set when Receive was clicked)
      effectiveDestination = mission.startPoint || mission.destination; // Use startPoint if set (contains original destination), otherwise use destination
    }
  }

  return (
    <div className={cardClasses}>
      {/* Header: Type on left, Status on right top */}
      <div className="flex justify-between items-start mb-3 gap-2">
        <span className="text-lg sm:text-xl font-bold text-gray-800">{displayType}</span>
        <span className={statusClasses}>
          {getStatusDisplayText(mission.status)}
        </span>
      </div>

      {/* Route Information */}
      <div className="space-y-1 mb-3">
        {/* From */}
        {effectiveStartPoint && (
          <div className="text-sm">
            <span className="text-gray-500">From: </span>
            <span className="text-gray-800 font-medium">{getAreaDisplayName(effectiveStartPoint)}</span>
          </div>
        )}
        {/* To */}
        {effectiveDestination && (
          <div className="text-sm">
            <span className="text-gray-500">To: </span>
            <span className="text-gray-800 font-medium">{getAreaDisplayName(effectiveDestination)}</span>
          </div>
        )}
        {/* Robot Name - Only show for In queue/Active/Completed missions */}
        {(mission.status === 'In queue' || mission.status === 'Active' || mission.status === 'Completed') && mission.robotName && (
          <div className="text-sm">
            <span className="text-gray-500">Robot: </span>
            <span className="text-gray-800 font-medium">{mission.robotName}</span>
          </div>
        )}
      </div>

      {/* Cargo Information */}
      {(mission.cargoType || mission.numberOfPieces) && (
        <div className="mb-3">
          <div className="flex flex-wrap gap-2 items-center">
            {mission.cargoType && (
              <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                {mission.cargoType}
              </span>
            )}
            {mission.numberOfPieces && (
              <span className="text-gray-600 text-xs">
                {mission.numberOfPieces} {mission.numberOfPieces === 1 ? 'piece' : 'pieces'}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
        {mission.status === 'In queue' && (
          <button
            onClick={() => onCancelMission(mission.id)}
            className="px-5 py-2.5 sm:px-4 sm:py-1.5 bg-red-500 text-white text-sm sm:text-sm font-medium rounded-md shadow-sm hover:bg-red-600 active:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400 transition-colors touch-manipulation"
          >
            Cancel
          </button>
        )}
        {mission.status === 'Pending' && isCreatedByThisPanel && (
          <button
            onClick={() => onCancelMission(mission.id)}
            className="px-5 py-2.5 sm:px-4 sm:py-1.5 bg-red-500 text-white text-sm sm:text-sm font-medium rounded-md shadow-sm hover:bg-red-600 active:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400 transition-colors touch-manipulation"
          >
            Cancel
          </button>
        )}
        {mission.status === 'Pending' && !isCreatedByThisPanel && displayType === 'Send' && (
          <button
            onClick={() => onSendMission(mission.id)}
            className="px-5 py-2.5 sm:px-4 sm:py-1.5 bg-green-500 text-white text-sm sm:text-sm font-medium rounded-md shadow-sm hover:bg-green-600 active:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-400 transition-colors touch-manipulation"
          >
            Send
          </button>
        )}
        {mission.status === 'Pending' && !isCreatedByThisPanel && displayType === 'Receive' && (
          <button
            onClick={() => onReceiveMission(mission.id)}
            className="px-5 py-2.5 sm:px-4 sm:py-1.5 bg-blue-500 text-white text-sm sm:text-sm font-medium rounded-md shadow-sm hover:bg-blue-600 active:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors touch-manipulation"
          >
            Receive
          </button>
        )}
      </div>
    </div>
  );
}

