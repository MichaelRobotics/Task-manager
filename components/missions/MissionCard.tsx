'use client'

import type { Mission } from '@/types/missions';

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

  const cardClasses = `
    bg-white p-4 rounded-lg shadow-md transition-all duration-300
    border-l-4 
    ${isActive ? 'border-green-500 hover:shadow-lg' : ''}
    ${isPending ? 'border-amber-500 hover:shadow-lg' : ''}
    ${isInQueue ? 'border-blue-500 hover:shadow-lg' : ''}
    ${mission.status === 'Completed' ? 'border-gray-400 opacity-70' : ''}
  `;

  const statusClasses = `
    px-3 py-1 text-xs font-semibold rounded-full self-start ml-2
    ${isActive ? 'bg-green-100 text-green-800' : ''}
    ${isPending ? 'bg-amber-100 text-amber-800' : ''}
    ${isInQueue ? 'bg-blue-100 text-blue-800' : ''}
    ${mission.status === 'Completed' ? 'bg-gray-200 text-gray-700' : ''}
  `;

  // Determine what to display based on displayType and original mission
  // For In queue/Active/Completed missions, always show both from and to
  // For Pending missions, convert based on display type
  const missionIsActiveOrInQueueOrCompleted = mission.status === 'Active' || mission.status === 'In queue' || mission.status === 'Completed';
  
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

  const sendPointLabel = mission.status === 'Pending' ? 'Send point:' : 'From:';
  const receivePointLabel = mission.status === 'Pending' ? 'Receive point:' : 'To:';

  return (
    <div className={cardClasses}>
      {/* Top Row: Points in top left corner, Status in top right */}
      <div className="flex justify-between items-start mb-2">
        {/* Left Side: Points - Always in top left corner with consistent styling */}
        <div className="flex flex-col text-gray-600 text-sm font-medium">
          {effectiveStartPoint && (
            <span>
              <span className="mr-1 font-normal">{sendPointLabel}</span>
              <span className="font-medium">{effectiveStartPoint}</span>
            </span>
          )}
          {effectiveDestination && (
            <span>
              <span className="mr-1 font-normal">{receivePointLabel}</span>
              <span className="font-medium">{effectiveDestination}</span>
            </span>
          )}
        </div>
        {/* Right Side: Status & Type */}
        <div className="flex flex-col items-end gap-1">
          <span className={statusClasses}>
            {mission.status}
          </span>
          {/* Display Mission Type (as it appears in this panel) */}
          <span className="text-xs text-gray-500 font-medium ml-2 px-1">
            {displayType}
          </span>
        </div>
      </div>

      {/* Robot Name - Show for In queue/Active/Completed missions */}
      {(mission.status === 'In queue' || mission.status === 'Active' || mission.status === 'Completed') && mission.robotName && (
        <div className="mb-2">
          <span className="font-bold text-lg text-gray-800">{mission.robotName}</span>
        </div>
      )}

      {/* Destination - Show if it exists (for non-pending missions) */}
      {effectiveDestination && mission.status !== 'Pending' && (
        <div className="text-gray-600 mt-2">
          <span className="text-sm">To: </span>
          <span className="font-medium">{effectiveDestination}</span>
        </div>
      )}

      {/* Action Buttons - All buttons in same position (right aligned) */}
      <div className="mt-4 text-right">
        {mission.status === 'In queue' && (
          <button
            onClick={() => onCancelMission(mission.id)}
            className="px-3 py-1 bg-red-500 text-white text-sm rounded-md shadow-sm hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400"
          >
            Cancel
          </button>
        )}
        {mission.status === 'Pending' && isCreatedByThisPanel && (
          <button
            onClick={() => onCancelMission(mission.id)}
            className="px-3 py-1 bg-red-500 text-white text-sm rounded-md shadow-sm hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400"
          >
            Cancel
          </button>
        )}
        {mission.status === 'Pending' && !isCreatedByThisPanel && displayType === 'Send' && (
          <button
            onClick={() => onSendMission(mission.id)}
            className="px-3 py-1 bg-green-500 text-white text-sm rounded-md shadow-sm hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-400"
          >
            Send
          </button>
        )}
        {mission.status === 'Pending' && !isCreatedByThisPanel && displayType === 'Receive' && (
          <button
            onClick={() => onReceiveMission(mission.id)}
            className="px-3 py-1 bg-blue-500 text-white text-sm rounded-md shadow-sm hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            Receive
          </button>
        )}
      </div>
    </div>
  );
}

