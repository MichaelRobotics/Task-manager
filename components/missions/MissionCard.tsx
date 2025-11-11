'use client'

import { useState } from 'react';
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
  onSendMissionWithArea?: (id: number, area: string) => void; // For missions created by this panel - Send with area selection
  onReceiveMissionWithArea?: (id: number, area: string) => void; // For missions created by this panel - Receive with area selection
  panelSelectedAreas?: string[]; // Origin areas for this panel
  panelSendTo?: string[]; // Send to areas for this panel
  panelReceiveFrom?: string[]; // Receive from areas for this panel
}

export function MissionCard({ 
  mission,
  displayType,
  isCreatedByThisPanel,
  onCancelMission, 
  onSendMission, 
  onReceiveMission,
  onSendMissionWithArea,
  onReceiveMissionWithArea,
  panelSelectedAreas = [],
  panelSendTo = [],
  panelReceiveFrom = []
}: MissionCardProps) {
  const [showAreaModal, setShowAreaModal] = useState(false);
  const [selectedArea, setSelectedArea] = useState<string>('');
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
    if (mission.status === 'Pending') {
      // For Pending missions created by this panel:
      // - Send: Don't show "To" (will be set when another panel accepts)
      // - Receive: Don't show "From" (will be set when another panel accepts)
      if (mission.type === 'Send') {
        effectiveStartPoint = mission.startPoint;
        effectiveDestination = null; // Don't show "To" for Pending Send missions
      } else if (mission.type === 'Receive') {
        effectiveStartPoint = null; // Don't show "From" for Pending Receive missions
        effectiveDestination = mission.destination;
      }
    } else {
      // For non-Pending missions, show both
      effectiveStartPoint = mission.startPoint;
      effectiveDestination = mission.destination;
    }
  } else {
    // Another panel created this mission
    const missionIsSet = mission.status === 'Active' || mission.status === 'In queue' || mission.status === 'Completed';
    
    if (missionIsSet) {
      // For missions that have been set, show both From and To
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
        // From: startPoint (area in panel that gets mission - set when they clicked Send)
        // To: area in origin panel where they want to receive to (origin panel's selectedAreas, step 1)
        effectiveStartPoint = mission.startPoint;
        if (originSelectedAreas.length > 0) {
          effectiveDestination = originSelectedAreas[0];
        } else {
          effectiveDestination = mission.destination || mission.startPoint;
        }
      } else if (displayType === 'Receive' && mission.type === 'Send') {
        // Original Send mission shown as Receive in sending panel
        // From: area in origin panel (the area that created the Send mission)
        // To: destination (area in panel that gets mission - set when they clicked Receive)
        if (originSelectedAreas.length > 0) {
          effectiveStartPoint = originSelectedAreas[0];
        } else {
          effectiveStartPoint = null;
        }
        effectiveDestination = mission.destination;
      }
    } else {
      // For Pending missions from another panel:
      // - Send: Don't show "From" (will be set when this panel clicks Send and selects area)
      // - Receive: Don't show "To" (will be set when this panel clicks Receive and selects area)
      if (displayType === 'Send') {
        // Send mission: Don't show "From" for Pending
        effectiveStartPoint = null;
        // Show "To" (destination from origin panel)
        if (mission.type === 'Send') {
          effectiveDestination = mission.destination;
        } else {
          // Receive mission shown as Send
          if (originSelectedAreas.length > 0) {
            effectiveDestination = originSelectedAreas[0];
          } else {
            effectiveDestination = mission.destination || mission.startPoint;
          }
        }
      } else if (displayType === 'Receive') {
        // Receive mission: Don't show "To" for Pending
        effectiveDestination = null;
        // Show "From" (startPoint from origin panel)
        if (mission.type === 'Receive') {
          effectiveStartPoint = mission.startPoint;
        } else {
          // Send mission shown as Receive
          if (originSelectedAreas.length > 0) {
            effectiveStartPoint = originSelectedAreas[0];
          } else {
            effectiveStartPoint = null;
          }
        }
      }
    }
  }

  // Get available areas based on displayType (how this mission appears in current panel)
  // Only show areas that can actually handle the specific cargo type
  const getAvailableAreas = (): string[] => {
    if (!mission.cargoType) return [];
    const LOCATION_LABELS_STORAGE_KEY = 'location_labels';
    const locationLabels = typeof window !== 'undefined' 
      ? JSON.parse(localStorage.getItem(LOCATION_LABELS_STORAGE_KEY) || '{}')
      : {};
    
    if (displayType === 'Send') {
      // For Send missions: show ONLY areas that can send this specific cargo type (where to send FROM)
      return panelSelectedAreas.filter(area => {
        const assignments = locationLabels[area] || [];
        // Only include areas that have the specific cargo type assigned with 'send' or 'both'
        return assignments.some((a: { label: string; type: string }) => 
          a.label === mission.cargoType && (a.type === 'send' || a.type === 'both')
        );
      });
    } else {
      // For Receive missions: show ONLY areas that can receive this specific cargo type (where to receive TO)
      return panelSelectedAreas.filter(area => {
        const assignments = locationLabels[area] || [];
        // Only include areas that have the specific cargo type assigned with 'receive' or 'both'
        return assignments.some((a: { label: string; type: string }) => 
          a.label === mission.cargoType && (a.type === 'receive' || a.type === 'both')
        );
      });
    }
  };

  const handleOpenAreaModal = () => {
    setSelectedArea('');
    setShowAreaModal(true);
  };

  const handleCloseAreaModal = () => {
    setShowAreaModal(false);
    setSelectedArea('');
  };

  const handleConfirmArea = () => {
    if (!selectedArea) return;
    
    if (displayType === 'Send' && onSendMissionWithArea) {
      // For Send missions: selecting where to send FROM
      onSendMissionWithArea(mission.id, selectedArea);
    } else if (displayType === 'Receive' && onReceiveMissionWithArea) {
      // For Receive missions: selecting where to receive TO
      onReceiveMissionWithArea(mission.id, selectedArea);
    }
    
    handleCloseAreaModal();
  };

  const availableAreas = getAvailableAreas();

  const locationNames = getLocationNames();

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
            onClick={handleOpenAreaModal}
            className="px-5 py-2.5 sm:px-4 sm:py-1.5 bg-green-500 text-white text-sm sm:text-sm font-medium rounded-md shadow-sm hover:bg-green-600 active:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-400 transition-colors touch-manipulation"
          >
            Send
          </button>
        )}
        {mission.status === 'Pending' && !isCreatedByThisPanel && displayType === 'Receive' && (
          <button
            onClick={handleOpenAreaModal}
            className="px-5 py-2.5 sm:px-4 sm:py-1.5 bg-blue-500 text-white text-sm sm:text-sm font-medium rounded-md shadow-sm hover:bg-blue-600 active:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors touch-manipulation"
          >
            Receive
          </button>
        )}
      </div>

      {/* Area Selection Modal */}
      {showAreaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md m-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                {displayType === 'Send' 
                  ? 'Select Area to Send From' 
                  : 'Select Area to Receive to'}
              </h3>
              <button
                onClick={handleCloseAreaModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-4">
              {availableAreas.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {availableAreas.map((area) => (
                    <button
                      key={area}
                      type="button"
                      onClick={() => setSelectedArea(area)}
                      className={`px-3 py-2 border rounded-md text-sm font-semibold transition-colors ${
                        selectedArea === area
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                      }`}
                    >
                      {locationNames[area] || area}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  No areas available for this cargo type.
                </p>
              )}
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleConfirmArea}
                disabled={!selectedArea}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

