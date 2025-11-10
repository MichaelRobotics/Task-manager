'use client'

import type { Mission } from '@/types/missions';

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

  // Determine what to display based on displayType and original mission
  // For In queue/Active/Completed missions, always show both from and to
  // For Pending missions, convert based on display type
  const missionIsActiveOrInQueueOrCompleted = mission.status === 'Active' || mission.status === 'In queue' || mission.status === 'Completed';
  
  // Helper to remove "Point " prefix and get area name
  const getAreaDisplayName = (location: string | null): string | null => {
    if (!location) return null;
    const areaCode = location.replace(/^Point /, '');
    const locationNames = getLocationNames();
    // Return custom name if exists, otherwise return area code
    return locationNames[areaCode] || areaCode;
  };
  
  const effectiveDestination = missionIsActiveOrInQueueOrCompleted
    ? mission.destination // In queue/Active/Completed missions always show destination
    : displayType === 'Send' && mission.type === 'Receive' 
    ? mission.startPoint 
    : displayType === 'Receive' && mission.type === 'Send'
    ? null // Don't show destination when Send appears as Receive (pending)
    : mission.destination;
  
  const effectiveStartPoint = missionIsActiveOrInQueueOrCompleted
    ? mission.startPoint // In queue/Active/Completed missions always show start point
    : displayType === 'Send' && mission.type === 'Receive'
    ? null // Don't show start point when Receive appears as Send (pending)
    : displayType === 'Receive' && mission.type === 'Send'
    ? mission.destination // Show destination as start point when Send appears as Receive (pending)
    : mission.startPoint;

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

