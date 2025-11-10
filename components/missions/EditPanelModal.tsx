'use client'

import { useState, useEffect, useMemo } from 'react';
import { ALL_LOCATIONS } from '@/lib/mockData';
import { getAllPanels, getPanelByUserId } from '@/lib/panelStorage';

interface EditPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEditPanel: (selectedAreas: string[], sendTo: string[], receiveFrom: string[]) => void;
  onCreatePanel?: (userId: string, selectedAreas: string[], sendTo: string[], receiveFrom: string[]) => void;
  currentUserId: string;
  currentSendTo: string[];
  currentReceiveFrom: string[];
  isCreateMode?: boolean; // If true, this is for creating a new panel
}

// Areas are now individual locations (A1, A2, etc.)
// Get locations for specific areas (areas are now location codes)
const getLocationsForAreas = (selectedLocations: string[]): string[] => {
  return selectedLocations; // Selected locations are the areas themselves
};

// Label storage key - global labels (shared across all locations)
const GLOBAL_LABELS_STORAGE_KEY = 'global_labels';
const LOCATION_LABELS_STORAGE_KEY = 'location_labels'; // Which labels are assigned to which locations
const AREA_NAMES_STORAGE_KEY = 'area_custom_names';

// Get all global labels
const getGlobalLabels = (): string[] => {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(GLOBAL_LABELS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

// Save global labels
const saveGlobalLabels = (labels: string[]): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(GLOBAL_LABELS_STORAGE_KEY, JSON.stringify(labels));
};

// Label assignment type: 'send', 'receive', or 'both'
type LabelAssignmentType = 'send' | 'receive' | 'both';

interface LabelAssignment {
  label: string;
  type: LabelAssignmentType;
}

// Get labels assigned to a specific location
const getLocationLabels = (location: string): LabelAssignment[] => {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(LOCATION_LABELS_STORAGE_KEY);
    const locationLabels: Record<string, LabelAssignment[]> = stored ? JSON.parse(stored) : {};
    return locationLabels[location] || [];
  } catch {
    return [];
  }
};

// Get all location label assignments
const getAllLocationLabels = (): Record<string, LabelAssignment[]> => {
  if (typeof window === 'undefined') return {};
  try {
    const stored = localStorage.getItem(LOCATION_LABELS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

// Save labels for a specific location
const saveLocationLabels = (location: string, assignments: LabelAssignment[]): void => {
  if (typeof window === 'undefined') return;
  const allLocationLabels = getAllLocationLabels();
  allLocationLabels[location] = assignments;
  localStorage.setItem(LOCATION_LABELS_STORAGE_KEY, JSON.stringify(allLocationLabels));
};

// Get custom location names
const getLocationNames = (): Record<string, string> => {
  if (typeof window === 'undefined') return {};
  try {
    const stored = localStorage.getItem(AREA_NAMES_STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

// Save custom location names
const saveLocationNames = (names: Record<string, string>): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(AREA_NAMES_STORAGE_KEY, JSON.stringify(names));
};

export function EditPanelModal({ 
  isOpen, 
  onClose, 
  onEditPanel,
  onCreatePanel,
  currentUserId,
  currentSendTo,
  currentReceiveFrom,
  isCreateMode = false
}: EditPanelModalProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [selectedSendTo, setSelectedSendTo] = useState<string[]>(currentSendTo);
  const [selectedReceiveFrom, setSelectedReceiveFrom] = useState<string[]>(currentReceiveFrom);
  const [newPanelId, setNewPanelId] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  // Label management - global labels and location assignments
  const [globalLabels, setGlobalLabels] = useState<string[]>(getGlobalLabels());
  const [locationLabelAssignments, setLocationLabelAssignments] = useState<Record<string, LabelAssignment[]>>(getAllLocationLabels());
  const [showAddLabelModal, setShowAddLabelModal] = useState(false);
  const [newLabelInput, setNewLabelInput] = useState('');
  const [labelModalLocation, setLabelModalLocation] = useState<string | null>(null);
  const [labelModalType, setLabelModalType] = useState<LabelAssignmentType>('both');
  const [selectedExistingLabel, setSelectedExistingLabel] = useState<string | null>(null);
  
  // Custom location names
  const [locationNames, setLocationNames] = useState<Record<string, string>>(getLocationNames());
  const [editingLocationName, setEditingLocationName] = useState<string | null>(null);
  const [newLocationName, setNewLocationName] = useState('');

  // Normalize dependencies to ensure consistent array size
  const normalizedUserId = useMemo(() => currentUserId || '', [currentUserId]);
  const normalizedIsCreateMode = useMemo(() => Boolean(isCreateMode), [isCreateMode]);

  // Update state when props change
  useEffect(() => {
    if (!isOpen) return;
    
    // Load panel data from storage
    if (!normalizedIsCreateMode && normalizedUserId) {
      const storedPanel = getPanelByUserId(normalizedUserId);
      if (storedPanel) {
        // Auto-select Origin areas (step 1) from storage - these are the areas selected in step 1
        const originAreas = storedPanel.selectedAreas || [];
        setSelectedAreas(originAreas);
        // Use stored data for steps 2 and 3 to ensure consistency
        setSelectedSendTo(storedPanel.sendToLocations);
        setSelectedReceiveFrom(storedPanel.receiveFromLocations);
      } else {
        // Fallback to props if storage doesn't have the panel
        const sendTo = Array.isArray(currentSendTo) ? currentSendTo : [];
        const receiveFrom = Array.isArray(currentReceiveFrom) ? currentReceiveFrom : [];
        // Try to reconstruct origin from sendTo and receiveFrom union (for old panels)
        const originAreas = [...new Set([...sendTo, ...receiveFrom])];
        setSelectedAreas(originAreas);
        setSelectedSendTo(sendTo);
        setSelectedReceiveFrom(receiveFrom);
      }
    } else {
      // In create mode, start with empty selection
      setSelectedAreas([]);
      setSelectedSendTo([]);
      setSelectedReceiveFrom([]);
    }
    setNewPanelId('');
    setCurrentPage(1);
    setError(null);
    setShowAddLabelModal(false);
    setNewLabelInput('');
    setLabelModalLocation(null);
    // Load global labels and location assignments
    setGlobalLabels(getGlobalLabels());
    setLocationLabelAssignments(getAllLocationLabels());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, normalizedUserId, normalizedIsCreateMode]);

  // Load global labels and location assignments when component mounts or when needed
  useEffect(() => {
    setGlobalLabels(getGlobalLabels());
    setLocationLabelAssignments(getAllLocationLabels());
  }, []);

  // Get areas that are already selected in other panels
  const getAreasInOtherPanels = (): Record<string, string> => {
    const allPanels = getAllPanels();
    const areasInOtherPanels: Record<string, string> = {};
    
    allPanels.forEach(panel => {
      // Skip the current panel
      if (panel.userId === currentUserId) return;
      
      // Get step 1 areas from this panel (or fallback to union if not stored)
      const panelStep1Areas = panel.selectedAreas || [...new Set([...panel.sendToLocations, ...panel.receiveFromLocations])];
      
      panelStep1Areas.forEach(area => {
        // If area is not already assigned to another panel, mark it
        if (!areasInOtherPanels[area]) {
          areasInOtherPanels[area] = panel.userId;
        }
      });
    });
    
    return areasInOtherPanels;
  };

  if (!isOpen) {
    return null;
  }

  const handleNext = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (currentPage === 1) {
      // In create mode, require panel name before proceeding
      if (isCreateMode && !newPanelId.trim()) {
        setError('Please enter a Panel ID before proceeding.');
        return;
      }
      if (selectedAreas.length === 0) {
        setError('Please select at least one area.');
        return;
      }
      setError(null);
      setCurrentPage(2);
    } else if (currentPage === 2) {
      setError(null);
      setCurrentPage(3);
    }
  };

  const handlePrevious = () => {
    if (currentPage === 2) {
      setCurrentPage(1);
      setError(null);
    } else if (currentPage === 3) {
      setCurrentPage(2);
      setError(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isCreateMode) {
      if (!newPanelId.trim()) {
        setError('Panel ID cannot be empty.');
        return;
      }
      if (selectedSendTo.length === 0 && selectedReceiveFrom.length === 0) {
        setError('Please select at least one location in "Send To" or "Receive From".');
        return;
      }
      if (onCreatePanel) {
        onCreatePanel(newPanelId.trim(), selectedAreas, selectedSendTo, selectedReceiveFrom);
      }
    } else {
      if (selectedSendTo.length === 0 && selectedReceiveFrom.length === 0) {
        setError('Please select at least one location in "Send To" or "Receive From".');
        return;
      }
      onEditPanel(selectedAreas, selectedSendTo, selectedReceiveFrom);
    }
    handleClose();
  };

  const handleClose = () => {
    setSelectedAreas([]);
    setSelectedSendTo(currentSendTo);
    setSelectedReceiveFrom(currentReceiveFrom);
    setNewPanelId('');
    setCurrentPage(1);
    setError(null);
    setShowAddLabelModal(false);
    setNewLabelInput('');
    setLabelModalLocation(null);
    setEditingLocationName(null);
    setNewLocationName('');
    onClose();
  };

  // Label management functions
  const handleOpenAddLabelModal = (location: string, type: LabelAssignmentType = 'both') => {
    setLabelModalLocation(location);
    setLabelModalType(type);
    setNewLabelInput('');
    setShowAddLabelModal(true);
  };

  const handleCloseAddLabelModal = () => {
    setShowAddLabelModal(false);
    setNewLabelInput('');
    setLabelModalLocation(null);
    setLabelModalType('both');
    setSelectedExistingLabel(null);
  };

  const handleCreateAndAddLabel = () => {
    if (!labelModalLocation) return;
    
    // Use selected existing label if available, otherwise use input
    const labelText = selectedExistingLabel || newLabelInput.trim();
    if (!labelText) return;
    
    // Add to global labels if it doesn't exist
    if (!globalLabels.includes(labelText)) {
      const updatedGlobalLabels = [...globalLabels, labelText];
      setGlobalLabels(updatedGlobalLabels);
      saveGlobalLabels(updatedGlobalLabels);
    }
    
    // Assign label to location with type
    const locationLabelList = locationLabelAssignments[labelModalLocation] || [];
    const existingIndex = locationLabelList.findIndex(a => a.label === labelText);
    
    let updatedAssignments = { ...locationLabelAssignments };
    if (existingIndex >= 0) {
      // Update existing assignment type
      const existing = locationLabelList[existingIndex];
      let newType: LabelAssignmentType = labelModalType;
      
      // If already has a type, merge to 'both' if different
      if (existing.type !== labelModalType && existing.type !== 'both' && labelModalType !== 'both') {
        newType = 'both';
      } else if (existing.type === 'both' || labelModalType === 'both') {
        newType = 'both';
      } else {
        newType = labelModalType;
      }
      
      updatedAssignments[labelModalLocation] = [...locationLabelList];
      updatedAssignments[labelModalLocation][existingIndex] = { label: labelText, type: newType };
    } else {
      // Add new assignment
      updatedAssignments[labelModalLocation] = [...locationLabelList, { label: labelText, type: labelModalType }];
    }
    
    setLocationLabelAssignments(updatedAssignments);
    saveLocationLabels(labelModalLocation, updatedAssignments[labelModalLocation]);
    
    handleCloseAddLabelModal();
  };

  const handleAddExistingLabel = (location: string, label: string, type: LabelAssignmentType = 'both') => {
    const locationLabelList = locationLabelAssignments[location] || [];
    const existingIndex = locationLabelList.findIndex(a => a.label === label);
    
    let updatedAssignments = { ...locationLabelAssignments };
    if (existingIndex >= 0) {
      // Update existing assignment type
      const existing = locationLabelList[existingIndex];
      let newType: LabelAssignmentType = type;
      
      // Merge types if different
      if (existing.type !== type && existing.type !== 'both' && type !== 'both') {
        newType = 'both';
      } else if (existing.type === 'both' || type === 'both') {
        newType = 'both';
      } else {
        newType = type;
      }
      
      updatedAssignments[location] = [...locationLabelList];
      updatedAssignments[location][existingIndex] = { label, type: newType };
    } else {
      // Add new assignment
      updatedAssignments[location] = [...locationLabelList, { label, type }];
    }
    
    setLocationLabelAssignments(updatedAssignments);
    saveLocationLabels(location, updatedAssignments[location]);
  };

  const handleRemoveLabelFromLocation = (location: string, label: string) => {
    const updatedAssignments = { ...locationLabelAssignments };
    updatedAssignments[location] = (updatedAssignments[location] || []).filter(a => a.label !== label);
    setLocationLabelAssignments(updatedAssignments);
    saveLocationLabels(location, updatedAssignments[location]);
  };

  const handleRemoveGlobalLabel = (label: string) => {
    // Remove from global labels
    const updatedGlobalLabels = globalLabels.filter(l => l !== label);
    setGlobalLabels(updatedGlobalLabels);
    saveGlobalLabels(updatedGlobalLabels);
    
    // Remove from all location assignments
    const updatedAssignments: Record<string, LabelAssignment[]> = {};
    Object.keys(locationLabelAssignments).forEach(location => {
      updatedAssignments[location] = (locationLabelAssignments[location] || []).filter(a => a.label !== label);
      saveLocationLabels(location, updatedAssignments[location]);
    });
    setLocationLabelAssignments(updatedAssignments);
  };

  // Location name management
  const handleSaveLocationName = (location: string) => {
    if (newLocationName.trim()) {
      const updatedNames = { ...locationNames, [location]: newLocationName.trim() };
      setLocationNames(updatedNames);
      saveLocationNames(updatedNames);
      setEditingLocationName(null);
      setNewLocationName('');
    }
  };

  const handleRemoveLocationName = (location: string) => {
    const updatedNames = { ...locationNames };
    delete updatedNames[location];
    setLocationNames(updatedNames);
    saveLocationNames(updatedNames);
  };


  // Add Cargo Type Modal
  const renderAddLabelModal = () => {
    if (!showAddLabelModal || !labelModalLocation) return null;
    const isInSendTo = selectedSendTo.includes(labelModalLocation);
    const isInReceiveFrom = selectedReceiveFrom.includes(labelModalLocation);

    // Filter existing cargo types that match the input
    const matchingExistingLabels = newLabelInput.trim()
      ? globalLabels.filter(label => 
          label.toLowerCase().includes(newLabelInput.trim().toLowerCase()) &&
          !locationLabelAssignments[labelModalLocation]?.some(a => a.label === label)
        )
      : globalLabels.filter(label => 
          !locationLabelAssignments[labelModalLocation]?.some(a => a.label === label)
        );

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md m-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">
              Add Cargo Type to {locationNames[labelModalLocation] || labelModalLocation}
            </h3>
            <button
              onClick={handleCloseAddLabelModal}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cargo Type Name
            </label>
            <input
              type="text"
              value={selectedExistingLabel || newLabelInput}
              onChange={(e) => {
                setSelectedExistingLabel(null);
                setNewLabelInput(e.target.value);
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleCreateAndAddLabel();
                }
              }}
              placeholder="Enter cargo type name..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              autoFocus
            />
            {matchingExistingLabels.length > 0 && (
              <div className="mt-2">
                <div className="text-xs text-gray-600 font-medium mb-2">
                  Select from existing cargo types:
                </div>
                <div className="flex flex-wrap gap-2">
                  {matchingExistingLabels.map((label) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => {
                        setSelectedExistingLabel(label);
                        setNewLabelInput(label);
                      }}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        selectedExistingLabel === label
                          ? 'bg-blue-600 text-white border-2 border-blue-700'
                          : 'bg-blue-100 text-blue-800 hover:bg-blue-200 border-2 border-transparent'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Cargo direction selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Direction
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setLabelModalType('send')}
                className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  labelModalType === 'send'
                    ? 'bg-green-600 text-white border-2 border-green-700'
                    : 'bg-green-100 text-green-700 hover:bg-green-200 border-2 border-transparent'
                }`}
              >
                Send
              </button>
              <button
                type="button"
                onClick={() => setLabelModalType('receive')}
                className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  labelModalType === 'receive'
                    ? 'bg-red-600 text-white border-2 border-red-700'
                    : 'bg-red-100 text-red-700 hover:bg-red-200 border-2 border-transparent'
                }`}
              >
                Receive
              </button>
              <button
                type="button"
                onClick={() => setLabelModalType('both')}
                className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors relative overflow-hidden ${
                  labelModalType === 'both'
                    ? 'border-2 border-gray-700'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300 border-2 border-transparent'
                }`}
              >
                {labelModalType === 'both' ? (
                  <span className="relative z-10 text-white font-semibold">Both</span>
                ) : (
                  <span>Both</span>
                )}
                {labelModalType === 'both' && (
                  <span className="absolute inset-0 flex">
                    <span className="w-1/2 bg-green-600"></span>
                    <span className="w-1/2 bg-red-600"></span>
                  </span>
                )}
              </button>
            </div>
          </div>


          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={handleCreateAndAddLabel}
              disabled={!newLabelInput.trim() && !selectedExistingLabel}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {selectedExistingLabel ? 'Add Existing Cargo Type' : 'Add Cargo Type'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderLocationGrid = (
    title: string,
    locations: string[],
    selectedLocations: string[],
    setLocations: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    const handleSelect = (location: string) => {
      setLocations((prev) =>
        prev.includes(location) ? prev.filter((loc) => loc !== location) : [...prev, location]
      );
    };

    return (
      <div className="mb-4">
        <div className="grid grid-cols-4 gap-2">
          {locations.map((location) => {
            const isSelected = selectedLocations.includes(location);
            return (
              <button
                type="button"
                key={location}
                onClick={() => handleSelect(location)}
                className={`
                  px-3 py-2 border rounded-md text-sm font-semibold transition-colors
                  ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                  }
                `}
              >
                {location}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const renderProgressBar = () => {
    const progress = (currentPage / 3) * 100;
    return (
      <div className="mb-6">
        <div className="flex justify-between mb-2">
          <span className={`text-sm font-medium ${currentPage >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
            Step 1: Select Work Areas
          </span>
          <span className={`text-sm font-medium ${currentPage >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
            Step 2: Send to Areas
          </span>
          <span className={`text-sm font-medium ${currentPage >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
            Step 3: Receive From Areas
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    );
  };

  const renderPage1 = () => (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h3 className="text-lg font-semibold text-gray-800">
          Select Area that Operator will create missions from - in this panel
        </h3>
        
      </div>

      <div className="grid grid-cols-4 gap-3 mb-6">
        {(() => {
          const areasInOtherPanels = getAreasInOtherPanels();
          return ALL_LOCATIONS.map((location) => {
            const isSelected = selectedAreas.includes(location);
            const customName = locationNames[location];
            const locationLabelList = locationLabelAssignments[location] || [];
            const isInSendTo = selectedSendTo.includes(location);
            const isInReceiveFrom = selectedReceiveFrom.includes(location);
            const isInOtherPanel = areasInOtherPanels[location] && !isSelected;
            const otherPanelId = areasInOtherPanels[location];
            return (
            <div key={location} className="relative">
              {editingLocationName === location ? (
                <div
                  className={`
                    w-full px-4 py-6 border-2 rounded-lg text-base font-semibold transition-all relative
                    ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-lg scale-105'
                        : 'bg-gray-50 text-gray-700 border-gray-300'
                    }
                  `}
                >
                  <div className="flex items-center justify-center gap-1">
                    <input
                      type="text"
                      value={newLocationName}
                      onChange={(e) => setNewLocationName(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleSaveLocationName(location);
                        } else if (e.key === 'Escape') {
                          setEditingLocationName(null);
                          setNewLocationName('');
                        }
                      }}
                      onBlur={() => {
                        if (newLocationName.trim()) {
                          handleSaveLocationName(location);
                        } else {
                          setEditingLocationName(null);
                          setNewLocationName('');
                        }
                      }}
                      placeholder={location}
                      className="px-2 py-1 text-base font-semibold border border-white rounded bg-white text-gray-800 focus:outline-none focus:ring-blue-500 w-32 text-center"
                      autoFocus
                    />
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  disabled={!!isInOtherPanel}
                  onClick={(e) => {
                    // Don't allow selection if area is in another panel
                    if (isInOtherPanel) return;
                    
                    // If clicking on the text area and location is selected, enable editing
                    const target = e.target as HTMLElement;
                    if (isSelected && (target.tagName === 'SPAN' || target.classList.contains('location-text'))) {
                      e.stopPropagation();
                      setEditingLocationName(location);
                      setNewLocationName(customName || location);
                      return;
                    }
                    // Otherwise, toggle selection
                    setSelectedAreas(prev =>
                      prev.includes(location)
                        ? prev.filter(loc => loc !== location)
                        : [...prev, location]
                    );
                    setError(null);
                    // Filter locations to only include selected areas
                    const updatedSelection = selectedAreas.includes(location)
                      ? selectedAreas.filter(loc => loc !== location)
                      : [...selectedAreas, location];
                    setSelectedSendTo(prev => prev.filter(loc => updatedSelection.includes(loc)));
                    setSelectedReceiveFrom(prev => prev.filter(loc => updatedSelection.includes(loc)));
                  }}
                  className={`
                    w-full px-4 py-6 border-2 rounded-lg text-base font-semibold transition-all relative
                    ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-lg scale-105'
                        : isInOtherPanel
                        ? 'bg-gray-200 text-gray-500 border-gray-300 cursor-not-allowed opacity-60'
                        : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100 hover:border-gray-400'
                    }
                  `}
                >
                  <span className={`location-text ${isSelected ? 'cursor-text' : isInOtherPanel ? 'cursor-not-allowed' : ''}`}>
                    {customName || location}
                  </span>
                  {isSelected && (
                    <span className="absolute top-2 left-2 text-white">✓</span>
                  )}
                  {isInOtherPanel && (
                    <span className="absolute bottom-1 left-1 right-1 text-[10px] text-gray-500 font-normal truncate px-1">
                      {otherPanelId}
                    </span>
                  )}
                </button>
              )}
              
              {/* Labels displayed below location - always show if labels exist, "+ cargo" only when selected */}
              {(locationLabelList.length > 0 || isSelected) && (
                <div className="mt-2 flex flex-wrap gap-1.5 justify-center items-center">
                  {locationLabelList.map((assignment) => {
                    const getLabelColors = () => {
                      if (assignment.type === 'send') {
                        return 'bg-green-500 text-white';
                      } else if (assignment.type === 'receive') {
                        return 'bg-red-500 text-white';
                      } else {
                        return 'text-white relative overflow-hidden';
                      }
                    };
                    
                    return (
                      <span
                        key={assignment.label}
                        className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 relative ${
                          getLabelColors()
                        }`}
                      >
                        {assignment.type === 'both' && (
                          <span className="absolute inset-0 flex rounded-full pointer-events-none">
                            <span className="w-1/2 bg-green-500"></span>
                            <span className="w-1/2 bg-red-500"></span>
                          </span>
                        )}
                        <span className="relative z-10">{assignment.label}</span>
                        {isSelected && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveLabelFromLocation(location, assignment.label);
                            }}
                            className={`relative z-10 font-bold text-xs leading-none ${
                              assignment.type === 'send' ? 'text-white hover:text-green-200' :
                              assignment.type === 'receive' ? 'text-white hover:text-red-200' :
                              'text-white hover:text-gray-200'
                            }`}
                            title="Remove from location"
                          >
                            ×
                          </button>
                        )}
                      </span>
                    );
                  })}
                  {isSelected && (
                    <div className="w-full flex gap-1 justify-center">
                      <button
                        type="button"
                        onClick={() => handleOpenAddLabelModal(location, 'both')}
                        className="px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-0.5 transition-colors bg-blue-100 text-blue-800 hover:bg-blue-200"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        cargo type
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
          });
        })()}
      </div>
      <div className="mt-3 flex items-center gap-2 text-xs flex-wrap">
        <span className="text-gray-600">color = mission direction operator can set in this area, for specific product</span>
        <span className="px-1.5 py-0.5 rounded-full text-xs font-medium bg-green-500 text-white">Send</span>
        <span className="px-1.5 py-0.5 rounded-full text-xs font-medium bg-red-500 text-white">Receive</span>
        <span className="px-1.5 py-0.5 rounded-full text-xs font-medium text-white relative overflow-hidden">
          <span className="absolute inset-0 flex rounded-full pointer-events-none">
            <span className="w-1/2 bg-green-500"></span>
            <span className="w-1/2 bg-red-500"></span>
          </span>
          <span className="relative z-10">Both</span>
        </span>
      </div>
    </div>
  );

  const renderPage2 = () => {
    if (selectedAreas.length === 0) return null;
    
    // Get cargo types that selected areas can send (send or both) from step 1
    const sendCargoTypes = new Set<string>();
    selectedAreas.forEach(area => {
      const assignments = locationLabelAssignments[area] || [];
      assignments.forEach(assignment => {
        if (assignment.type === 'send' || assignment.type === 'both') {
          sendCargoTypes.add(assignment.label);
        }
      });
    });
    
    // Filter ALL_LOCATIONS to only show those that can receive the cargo types we're sending
    const availableLocations = ALL_LOCATIONS.filter(location => {
      // Exclude the selected areas themselves (we don't send to ourselves)
      if (selectedAreas.includes(location)) return false;
      
      const locationAssignments = locationLabelAssignments[location] || [];
      
      // If no cargo types are defined for sending from selected areas, don't show any locations
      if (sendCargoTypes.size === 0) return false;
      
      // Only show locations that have at least one cargo type that:
      // 1. Can receive (receive or both)
      // 2. Matches one of the cargo types we're sending from selected areas
      return locationAssignments.some(assignment => {
        const canReceive = assignment.type === 'receive' || assignment.type === 'both';
        return canReceive && sendCargoTypes.has(assignment.label);
      });
    });
    
    return (
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Areas: You Send To</h3>
        {availableLocations.length > 0 ? (
          <div className="grid grid-cols-4 gap-2">
            {availableLocations.map((location) => {
              const isSelected = selectedSendTo.includes(location);
              const customName = locationNames[location];
              return (
                <button
                  key={location}
                  type="button"
                  onClick={() => {
                    setSelectedSendTo(prev =>
                      prev.includes(location) ? prev.filter(loc => loc !== location) : [...prev, location]
                    );
                  }}
                  className={`px-3 py-2 border rounded-md text-sm font-semibold transition-colors ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                  }`}
                >
                  {customName || location}
                </button>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-gray-500">
            No areas available. Please configure cargo types in step 1 to enable sending.
          </p>
        )}
      </div>
    );
  };

  const renderPage3 = () => {
    if (selectedAreas.length === 0) return null;
    
    // Get cargo types that selected areas can receive (receive or both) from step 1
    const receiveCargoTypes = new Set<string>();
    selectedAreas.forEach(area => {
      const assignments = locationLabelAssignments[area] || [];
      assignments.forEach(assignment => {
        if (assignment.type === 'receive' || assignment.type === 'both') {
          receiveCargoTypes.add(assignment.label);
        }
      });
    });
    
    // Filter ALL_LOCATIONS to only show those that can send the cargo types we can receive
    const availableLocations = ALL_LOCATIONS.filter(location => {
      // Exclude the selected areas themselves (we don't receive from ourselves)
      if (selectedAreas.includes(location)) return false;
      
      const locationAssignments = locationLabelAssignments[location] || [];
      
      // If no cargo types are defined for receiving in selected areas, don't show any locations
      if (receiveCargoTypes.size === 0) return false;
      
      // Only show locations that have at least one cargo type that:
      // 1. Can send (send or both)
      // 2. Matches one of the cargo types we can receive in selected areas
      return locationAssignments.some(assignment => {
        const canSend = assignment.type === 'send' || assignment.type === 'both';
        return canSend && receiveCargoTypes.has(assignment.label);
      });
    });
    
    return (
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Areas: You Receive From</h3>
        {availableLocations.length > 0 ? (
          <div className="grid grid-cols-4 gap-2">
            {availableLocations.map((location) => {
              const isSelected = selectedReceiveFrom.includes(location);
              const customName = locationNames[location];
              return (
                <button
                  key={location}
                  type="button"
                  onClick={() => {
                    setSelectedReceiveFrom(prev =>
                      prev.includes(location) ? prev.filter(loc => loc !== location) : [...prev, location]
                    );
                  }}
                  className={`px-3 py-2 border rounded-md text-sm font-semibold transition-colors ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                  }`}
                >
                  {customName || location}
                </button>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-gray-500">
            No areas available. Please configure cargo types in step 1 to enable receiving.
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 transition-opacity">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl m-4 transform transition-all max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4 relative">
          <h2 className="text-xl font-bold text-gray-800">{isCreateMode ? 'Create Panel' : 'Edit Panel'}</h2>
          {isCreateMode ? (
            <div className="absolute left-1/2 transform -translate-x-1/2">
              <input
                type="text"
                value={newPanelId}
                onChange={(e) => setNewPanelId(e.target.value)}
                placeholder="Enter Panel ID..."
                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-center"
              />
            </div>
          ) : (
            <p className="text-sm text-gray-600 absolute left-1/2 transform -translate-x-1/2">
              <span className="font-semibold">Panel ID:</span> {currentUserId}
            </p>
          )}
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {renderProgressBar()}

        {renderAddLabelModal()}

        <form onSubmit={handleSubmit}>
          {currentPage === 1 && renderPage1()}
          {currentPage === 2 && renderPage2()}
          {currentPage === 3 && renderPage3()}

          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

          <div className="flex justify-between gap-3 mt-6">
            <div>
              {currentPage > 1 && (
                <button
                  type="button"
                  onClick={handlePrevious}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md shadow-sm hover:bg-gray-300 focus:outline-none"
                >
                  Previous
                </button>
              )}
            </div>
            <div className="flex gap-3">
              {currentPage < 3 ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleNext(e);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 focus:outline-none"
                >
                  Next
                </button>
              ) : (
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 focus:outline-none"
                >
                  {isCreateMode ? 'Create Panel' : 'Save Changes'}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}


