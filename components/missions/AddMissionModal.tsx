'use client'

import { useState, useLayoutEffect } from 'react';
import type { MissionType } from '@/types/missions';
import { ALL_LOCATIONS } from '@/lib/mockData';
import { getAllPanels } from '@/lib/panelStorage';

// Get global cargo types from localStorage
const GLOBAL_LABELS_STORAGE_KEY = 'global_labels';
const LOCATION_LABELS_STORAGE_KEY = 'location_labels';
const AREA_NAMES_STORAGE_KEY = 'area_custom_names';

const getGlobalLabels = (): string[] => {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(GLOBAL_LABELS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

type LabelAssignmentType = 'send' | 'receive' | 'both';

interface LabelAssignment {
  label: string;
  type: LabelAssignmentType;
}

const getAllLocationLabels = (): Record<string, LabelAssignment[]> => {
  if (typeof window === 'undefined') return {};
  try {
    const stored = localStorage.getItem(LOCATION_LABELS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

const getLocationNames = (): Record<string, string> => {
  if (typeof window === 'undefined') return {};
  try {
    const stored = localStorage.getItem(AREA_NAMES_STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

interface AddMissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateMission: (mission: {
    robotName: null;
    startPoint: string | null;
    destination: string | null;
    type: MissionType;
    cargoType: string | null;
    numberOfPieces: number | null;
    selectedArea: string | null;
  }) => void;
  sendToLocations: string[];
  receiveFromLocations: string[];
  selectedAreas: string[]; // Areas selected in step 1 of edit modal
}

export function AddMissionModal({
  isOpen,
  onClose,
  onCreateMission,
  sendToLocations,
  receiveFromLocations,
  selectedAreas,
}: AddMissionModalProps) {
  const [selectedType, setSelectedType] = useState<MissionType | null>(null);
  const [cargoType, setCargoType] = useState<string>('');
  const [numberOfPieces, setNumberOfPieces] = useState<string>('');
  const [selectedArea, setSelectedArea] = useState<string>('');
  const [availableCargoTypes, setAvailableCargoTypes] = useState<string[]>([]);
  const [locationLabelAssignments, setLocationLabelAssignments] = useState<Record<string, LabelAssignment[]>>({});
  const [locationNames, setLocationNames] = useState<Record<string, string>>({});
  const [areaWarning, setAreaWarning] = useState<string | null>(null);

  useLayoutEffect(() => {
    if (isOpen) {
      // Load data first, then reset form state in the same render cycle
      // useLayoutEffect runs synchronously before browser paint, preventing flicker
      const labels = getGlobalLabels();
      const assignments = getAllLocationLabels();
      const names = getLocationNames();
      
      // Batch all state updates together
      setAvailableCargoTypes(labels);
      setLocationLabelAssignments(assignments);
      setLocationNames(names);
      setSelectedType(null);
      setCargoType('');
      setNumberOfPieces('');
      setSelectedArea('');
      setAreaWarning(null);
    }
  }, [isOpen, selectedAreas]);

  if (!isOpen) {
    return null;
  }

  const handleSelectType = (type: MissionType) => {
    setSelectedType(type);
    setAreaWarning(null);
  };

  // Check if an area has a panel connected that can see missions for that area
  const checkAreaHasPanel = (area: string, missionType: MissionType): boolean => {
    const allPanels = getAllPanels();
    
    if (missionType === 'Send') {
      // For Send missions, check if any panel has this area in their selectedAreas or receiveFromLocations
      // (so they can receive missions sent to this area)
      return allPanels.some(panel => {
        const hasInSelectedAreas = panel.selectedAreas?.includes(area) || false;
        const hasInReceiveFrom = panel.receiveFromLocations?.includes(area) || false;
        return hasInSelectedAreas || hasInReceiveFrom;
      });
    } else {
      // For Receive missions, check if any panel has this area in their selectedAreas or sendToLocations
      // (so they can send missions from this area)
      return allPanels.some(panel => {
        const hasInSelectedAreas = panel.selectedAreas?.includes(area) || false;
        const hasInSendTo = panel.sendToLocations?.includes(area) || false;
        return hasInSelectedAreas || hasInSendTo;
      });
    }
  };

  const handleSelectArea = (area: string) => {
    setSelectedArea(area);
    setAreaWarning(null);
    
    // Check if the destination/source area has a connected panel
    if (selectedType) {
      let targetAreas: string[] = [];
      if (selectedType === 'Send') {
        // For Send: check if sendToLocations have panels connected
        targetAreas = sendToLocations;
      } else {
        // For Receive: check if receiveFromLocations have panels connected
        targetAreas = receiveFromLocations;
      }
      
      // Check if any of the target areas have a connected panel
      const hasPanel = targetAreas.some(targetArea => {
        return checkAreaHasPanel(targetArea, selectedType);
      });
      
      if (!hasPanel && targetAreas.length > 0) {
        const areaDisplayName = locationNames[targetAreas[0]] || targetAreas[0];
        setAreaWarning(`Area "${areaDisplayName}" doesn't have a panel connected, and nobody can see this mission. Report it.`);
      } else if (targetAreas.length === 0) {
        setAreaWarning(`No ${selectedType === 'Send' ? 'Send to' : 'Receive from'} areas configured. Please configure in panel settings.`);
      }
    }
  };

  // Check if Origin areas can send (have cargo types with 'send' or 'both')
  const canOriginAreasSend = (): boolean => {
    if (selectedAreas.length === 0) return false;
    
    return selectedAreas.some(area => {
      const assignments = locationLabelAssignments[area] || [];
      return assignments.some(a => a.type === 'send' || a.type === 'both');
    });
  };

  // Check if Origin areas can receive (have cargo types with 'receive' or 'both')
  const canOriginAreasReceive = (): boolean => {
    if (selectedAreas.length === 0) return false;
    
    return selectedAreas.some(area => {
      const assignments = locationLabelAssignments[area] || [];
      return assignments.some(a => a.type === 'receive' || a.type === 'both');
    });
  };

  // Get available cargo types based on selected mission type and origin areas
  const getAvailableCargoTypes = (): string[] => {
    if (!selectedType || selectedAreas.length === 0) return [];
    
    // Collect all cargo types that origin areas can handle for this mission type
    const validCargoTypes = new Set<string>();
    
    selectedAreas.forEach(area => {
      const assignments = locationLabelAssignments[area] || [];
      assignments.forEach(assignment => {
        if (selectedType === 'Send') {
          // For SEND: only include cargo types that origin area can send
          if (assignment.type === 'send' || assignment.type === 'both') {
            validCargoTypes.add(assignment.label);
          }
        } else if (selectedType === 'Receive') {
          // For RECEIVE: only include cargo types that origin area can receive
          if (assignment.type === 'receive' || assignment.type === 'both') {
            validCargoTypes.add(assignment.label);
          }
        }
      });
    });
    
    return Array.from(validCargoTypes);
  };

  // Get available areas based on selected cargo type and mission type
  // For Send: show origin areas (selectedAreas) that can send the selected cargo type
  // For Receive: show origin areas (selectedAreas) that can receive the selected cargo type
  const getAvailableAreas = (): string[] => {
    // Use origin areas (selectedAreas) instead of sendToLocations/receiveFromLocations
    if (selectedAreas.length === 0) return [];
    
    // If no cargo type is selected yet, return all origin areas
    if (!cargoType) {
      return selectedAreas;
    }
    
    // Filter origin areas based on cargo type and mission type capability
    return selectedAreas.filter(area => {
      const assignments = locationLabelAssignments[area] || [];
      
      // If area has no cargo type assignments, include it (backward compatibility)
      if (assignments.length === 0) {
        return true;
      }
      
      if (selectedType === 'Send') {
        // For Send: show origin areas that can send this cargo type
        return assignments.some(a => 
          a.label === cargoType && (a.type === 'send' || a.type === 'both')
        );
      } else if (selectedType === 'Receive') {
        // For Receive: show origin areas that can receive this cargo type
        return assignments.some(a => 
          a.label === cargoType && (a.type === 'receive' || a.type === 'both')
        );
      }
      return false;
    });
  };

  const handleCreateMission = () => {
    if (!selectedType || !cargoType || !selectedArea) return;
    
    onCreateMission({
      robotName: null,
      startPoint: null,
      destination: null,
      type: selectedType,
      cargoType: cargoType,
      numberOfPieces: numberOfPieces.trim() ? parseInt(numberOfPieces.trim(), 10) : null,
      selectedArea: selectedArea,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 transition-opacity p-2 sm:p-4">
      <div className="bg-white rounded-lg shadow-xl p-4 sm:p-6 w-full max-w-md transform transition-all max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4 sm:mb-6 gap-2">
          <h2 className="text-lg sm:text-xl font-bold text-gray-800">Create New Mission</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex flex-col gap-4">
          {!selectedType ? (
            <>
              {/* If no areas in step 1, show configuration message */}
              {selectedAreas.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600 mb-4">No areas configured in panel settings.</p>
                  <p className="text-sm text-gray-500">Configure Panel Settings → Edit Panel</p>
                </div>
              ) : (
                <>
                  {/* If areas in step 1 but no send/receive configured, show message */}
                  {sendToLocations.length === 0 && receiveFromLocations.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-600 mb-2">Areas are configured, but no Send or Receive destinations are set.</p>
                      <p className="text-sm text-gray-500">Please configure at least "Send to Areas" or "Receive From Areas" in panel settings.</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      {/* Show SEND button only if:
                          1. sendToLocations is configured (step 2)
                          2. Origin areas can send (have cargo types with 'send' or 'both') */}
                      {sendToLocations.length > 0 && canOriginAreasSend() && (
                        <button
                          onClick={() => handleSelectType('Send')}
                          className="w-full px-6 py-3 sm:py-4 bg-green-600 text-white font-semibold text-base sm:text-lg rounded-md shadow-sm hover:bg-green-700 active:bg-green-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-75 transition-colors touch-manipulation"
                        >
                          SEND
                        </button>
                      )}
                      {/* Show RECEIVE button only if:
                          1. receiveFromLocations is configured (step 3)
                          2. Origin areas can receive (have cargo types with 'receive' or 'both') */}
                      {receiveFromLocations.length > 0 && canOriginAreasReceive() && (
                        <button
                          onClick={() => handleSelectType('Receive')}
                          className="w-full px-6 py-3 sm:py-4 bg-blue-600 text-white font-semibold text-base sm:text-lg rounded-md shadow-sm hover:bg-blue-700 active:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 transition-colors touch-manipulation"
                        >
                          RECEIVE
                        </button>
                      )}
                      {/* Show message if no buttons are available */}
                      {(!canOriginAreasSend() || sendToLocations.length === 0) && 
                       (!canOriginAreasReceive() || receiveFromLocations.length === 0) && (
                        <div className="text-center py-4">
                          <p className="text-gray-600 text-sm">
                            No send or receive options available. Configure cargo types in Origin areas.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </>
          ) : (
            <>
              {/* Cargo Type Selection - Show after selecting Send/Receive */}
              {selectedType && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Cargo Type
                  </label>
                  {getAvailableCargoTypes().length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {getAvailableCargoTypes().map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => {
                            setCargoType(type);
                            setSelectedArea(''); // Reset area selection when cargo type changes
                            setAreaWarning(null); // Reset warning when cargo type changes
                          }}
                          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                            cargoType === type
                              ? 'bg-blue-600 text-white'
                              : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">
                      {selectedType === 'Send' 
                        ? 'No cargo types available for sending from origin areas. Please configure cargo types with "Send" or "Both" in panel settings.'
                        : 'No cargo types available for receiving in origin areas. Please configure cargo types with "Receive" or "Both" in panel settings.'}
                    </p>
                  )}
                </div>
              )}

              {/* Area Selection - Show after selecting Cargo Type */}
              {selectedType && cargoType && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {selectedType === 'Send' ? 'Select Area to Send From' : 'Select Area to Receive to'}
                  </label>
                  {getAvailableAreas().length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                      {getAvailableAreas().map((area) => (
                        <button
                          key={area}
                          type="button"
                          onClick={() => handleSelectArea(area)}
                          className={`px-3 py-2.5 sm:py-2 border rounded-md text-sm font-semibold transition-colors touch-manipulation active:scale-95 ${
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
                      {selectedType === 'Send' 
                        ? (selectedAreas.length === 0
                            ? 'No origin areas configured. Please configure in panel settings.'
                            : 'No origin areas available for sending this cargo type. Please configure cargo types in origin areas.')
                        : (selectedAreas.length === 0
                            ? 'No origin areas configured. Please configure in panel settings.'
                            : 'No origin areas available for receiving this cargo type. Please configure cargo types in origin areas.')}
                    </p>
                  )}
                  {/* Warning message if area doesn't have a connected panel */}
                  {areaWarning && (
                    <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-md">
                      <p className="text-sm text-amber-800 font-medium">{areaWarning}</p>
                    </div>
                  )}
                </div>
              )}

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Pieces
                </label>
                <input
                  type="number"
                  value={numberOfPieces}
                  onChange={(e) => setNumberOfPieces(e.target.value)}
                  placeholder="Enter number of pieces..."
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <button
                onClick={handleCreateMission}
                disabled={!selectedType || !cargoType || !selectedArea}
                className={`w-full px-6 py-3 sm:py-4 text-white font-semibold text-base sm:text-lg rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-opacity-75 transition-colors touch-manipulation ${
                  selectedType === 'Send'
                    ? cargoType && selectedArea
                      ? 'bg-green-600 hover:bg-green-700 active:bg-green-800 focus:ring-green-500'
                      : 'bg-green-400 cursor-not-allowed'
                    : cargoType && selectedArea
                      ? 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 focus:ring-blue-500'
                      : 'bg-blue-400 cursor-not-allowed'
                }`}
              >
                Create {selectedType} Mission
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

