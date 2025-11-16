'use client'

import { useState, useEffect, useRef } from 'react';
import type { Mission, MissionStatus } from '@/types/missions';
import { initialMissions, ROBOT_NAMES, generateId } from '@/lib/mockData';
import { savePanel, getPanelByUserId, deletePanel, getAllPanels } from '@/lib/panelStorage';
import { getAllMissions, saveMission, saveMissions, deleteMission, getMissionsForPanel, clearAllMissions, type PanelMission } from '@/lib/missionStorage';
import { isAdminLoggedIn } from '@/lib/adminSession';
import { Header } from './Header';
import { MissionCard } from './MissionCard';
import { AddMissionModal } from './AddMissionModal';
import { AdminPasswordModal } from './AdminPasswordModal';
import { AdminActionsModal } from './AdminActionsModal';
import { ChangePanelModal } from './ChangePanelModal';
import { EditPanelModal } from './EditPanelModal';

type Language = 'en' | 'pl' | 'uk';

const LANGUAGE_STORAGE_KEY = 'selected_language';

const getStoredLanguage = (): Language => {
  if (typeof window === 'undefined') return 'en';
  try {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    return (stored as Language) || 'en';
  } catch {
    return 'en';
  }
};

export function MissionsDashboard() {
  const [missions, setMissions] = useState<PanelMission[]>([]);
  const [filter, setFilter] = useState<MissionStatus>('Pending');
  const [userId, setUserId] = useState<string | null>(null);
  const [panelSendTo, setPanelSendTo] = useState<string[]>([]);
  const [panelReceiveFrom, setPanelReceiveFrom] = useState<string[]>([]);
  const [panelSelectedAreas, setPanelSelectedAreas] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isAdminActionsModalOpen, setIsAdminActionsModalOpen] = useState(false);
  const [isChangePanelModalOpen, setIsChangePanelModalOpen] = useState(false);
  const [isEditPanelModalOpen, setIsEditPanelModalOpen] = useState(false);
  const [language, setLanguage] = useState<Language>(getStoredLanguage());
  const hasInitializedWithPanel = useRef(false);

  // On initial load, if panels already exist, default to the first one
  useEffect(() => {
    if (hasInitializedWithPanel.current) return;
    hasInitializedWithPanel.current = true;

    const panels = getAllPanels();
    if (panels.length > 0) {
      setUserId(panels[0].userId);
      setFilter('Pending');
    }
  }, []);

  // Initialize missions storage (empty - no default missions)
  // Clear any old missions that don't have createdByPanelId
  useEffect(() => {
    const allMissions = getAllMissions();
    // Filter out any missions without createdByPanelId (old missions)
    const validMissions = allMissions.filter((m) => m.createdByPanelId !== undefined && m.createdByPanelId !== null);
    
    // If there were invalid missions, save only valid ones
    if (validMissions.length !== allMissions.length) {
      saveMissions(validMissions);
    }
    
    // If no missions at all, ensure empty array
    if (validMissions.length === 0 && allMissions.length === 0) {
      saveMissions([]);
    }
  }, []);

  // Load panel and filter missions when userId or panel config changes
  useEffect(() => {
    if (userId) {
      const storedPanel = getPanelByUserId(userId);
      if (storedPanel) {
        setPanelSendTo(storedPanel.sendToLocations);
        setPanelReceiveFrom(storedPanel.receiveFromLocations);
        setPanelSelectedAreas(
          storedPanel.selectedAreas && storedPanel.selectedAreas.length > 0
            ? storedPanel.selectedAreas
            : [...new Set([...storedPanel.sendToLocations, ...storedPanel.receiveFromLocations])]
        );
        // Filter missions for this panel
        const originAreas =
          storedPanel.selectedAreas && storedPanel.selectedAreas.length > 0
            ? storedPanel.selectedAreas
            : [...new Set([...storedPanel.sendToLocations, ...storedPanel.receiveFromLocations])];
        const panelMissions = getMissionsForPanel(
          userId,
          originAreas,
          storedPanel.sendToLocations,
          storedPanel.receiveFromLocations
        );
        setMissions(panelMissions);
      } else {
        // Panel doesn't exist - clear state
        setPanelSendTo([]);
        setPanelReceiveFrom([]);
        setPanelSelectedAreas([]);
        setMissions([]);
      }
    } else {
      // No userId selected - clear state
      setPanelSendTo([]);
      setPanelReceiveFrom([]);
      setPanelSelectedAreas([]);
      setMissions([]);
    }
  }, [userId]);

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  // Admin Modal Flow
  const handleOpenAdminModal = () => {
    // Check if already logged in this session
    if (isAdminLoggedIn()) {
      // Skip password modal, go directly to actions
      setIsAdminActionsModalOpen(true);
    } else {
      // Show password modal
      setIsAdminModalOpen(true);
    }
  };

  const handleAdminLogin = () => {
    setIsAdminModalOpen(false);
    setIsAdminActionsModalOpen(true);
  };

  const handleCloseAdminActions = () => {
    setIsAdminActionsModalOpen(false);
  };

  const handleDeletePanel = () => {
    if (!userId) return;
    
    // Delete the current panel
    deletePanel(userId);
    
    // Get all remaining panels
    const allPanels = getAllPanels();
    
    if (allPanels.length > 0) {
      // Select the first available panel and switch to its view
      const nextPanel = allPanels[0];
      setUserId(nextPanel.userId);
      setPanelSendTo(nextPanel.sendToLocations);
      setPanelReceiveFrom(nextPanel.receiveFromLocations);
      setPanelSelectedAreas(
        nextPanel.selectedAreas && nextPanel.selectedAreas.length > 0
          ? nextPanel.selectedAreas
          : [...new Set([...nextPanel.sendToLocations, ...nextPanel.receiveFromLocations])]
      );
      setFilter('Pending');
      // Filter missions for the selected panel
      const originAreas =
        nextPanel.selectedAreas && nextPanel.selectedAreas.length > 0
          ? nextPanel.selectedAreas
          : [...new Set([...nextPanel.sendToLocations, ...nextPanel.receiveFromLocations])];
      const panelMissions = getMissionsForPanel(
        nextPanel.userId,
        originAreas,
        nextPanel.sendToLocations,
        nextPanel.receiveFromLocations
      );
      setMissions(panelMissions);
      // Close the admin actions modal to show the panel view
      setIsAdminActionsModalOpen(false);
    } else {
      // No panels left - clear state and show default view with "Create Panel" button
      setUserId(null);
      setPanelSendTo([]);
      setPanelReceiveFrom([]);
      setPanelSelectedAreas([]);
      setMissions([]);
      setIsAdminActionsModalOpen(false);
    }
  };

  // Edit Panel Flow
  const handleOpenEditPanelModal = () => {
    setIsAdminActionsModalOpen(false);
    setIsEditPanelModalOpen(true);
  };

  const handleEditPanel = (selectedAreas: string[], sendTo: string[], receiveFrom: string[]) => {
    if (!userId) return;

    // Update panel in storage
    savePanel({
      userId,
      selectedAreas,
      sendToLocations: sendTo,
      receiveFromLocations: receiveFrom,
    });

    // Update local state
    setPanelSendTo(sendTo);
    setPanelReceiveFrom(receiveFrom);
    setPanelSelectedAreas(selectedAreas);

    // Reload missions for the updated panel
    const panelMissions = getMissionsForPanel(userId, selectedAreas, sendTo, receiveFrom);
    setMissions(panelMissions);

    setIsEditPanelModalOpen(false);
  };

  // Change Panel Flow
  const handleOpenChangePanelModal = () => {
    setIsAdminActionsModalOpen(false);
    setIsChangePanelModalOpen(true);
  };

  const handleSelectPanel = (
    selectedUserId: string,
    originAreas: string[],
    sendTo: string[],
    receiveFrom: string[]
  ) => {
    setUserId(selectedUserId);
    setPanelSendTo(sendTo);
    setPanelReceiveFrom(receiveFrom);
    setPanelSelectedAreas(originAreas.length > 0 ? originAreas : [...new Set([...sendTo, ...receiveFrom])]);
    setFilter('Pending');
    // Filter missions for the selected panel
    const panelMissions = getMissionsForPanel(
      selectedUserId,
      originAreas.length > 0 ? originAreas : [...new Set([...sendTo, ...receiveFrom])],
      sendTo,
      receiveFrom
    );
    setMissions(panelMissions);
  };

  // Create Panel Flow
  const handleOpenCreatePanelModal = () => {
    // Close any other modals that might be open
    setIsEditPanelModalOpen(false);
    setIsAdminActionsModalOpen(false);
    setIsAdminModalOpen(false);
    setIsChangePanelModalOpen(false);
    // Temporarily clear userId to ensure create mode
    // Store the current userId to restore it if user cancels
    const previousUserId = userId;
    setUserId(null);
    // Open Edit Panel modal in create mode
    setIsEditPanelModalOpen(true);
  };

  const handlePanelCreation = (newUserId: string, selectedAreas: string[], sendTo: string[], receiveFrom: string[]) => {
    // Save panel to storage
    savePanel({
      userId: newUserId,
      selectedAreas,
      sendToLocations: sendTo,
      receiveFromLocations: receiveFrom,
    });

    setUserId(newUserId);
    setPanelSendTo(sendTo);
    setPanelReceiveFrom(receiveFrom);
    setPanelSelectedAreas(selectedAreas);
    setFilter('Pending');
    // Filter missions for the new panel
    const panelMissions = getMissionsForPanel(newUserId, selectedAreas, sendTo, receiveFrom);
    setMissions(panelMissions);
    setIsEditPanelModalOpen(false);
  };

  const handleCreateMission = (missionDetails: {
    robotName: null;
    startPoint: string | null;
    destination: string | null;
    type: 'Send' | 'Receive';
    cargoType: string | null;
    numberOfPieces: number | null;
    selectedArea: string | null;
  }) => {
    if (!userId) return;

    const newMission: Mission = {
      ...missionDetails,
      id: generateId(),
      status: 'Pending',
      createdByPanelId: userId, // Track which panel created this mission
      assignedToPanelId: null,
    };

    // Assign location based on mission type and selected area
    if (newMission.type === 'Send' && missionDetails.selectedArea) {
      // For Send missions, selected area is the origin area (where to send FROM)
      // Start point is the selected origin area
      newMission.startPoint = `Point ${missionDetails.selectedArea}`;
      // Destination is from sendToLocations (step 2) - where we want to send to
      // Use first sendTo location as destination
      newMission.destination = panelSendTo.length > 0 ? `Point ${panelSendTo[0]}` : null;
    } else if (newMission.type === 'Receive' && missionDetails.selectedArea) {
      // For Receive missions, selected area is the origin area (where to receive TO)
      // Destination is the selected origin area
      newMission.destination = `Point ${missionDetails.selectedArea}`;
      // Start point is from receiveFromLocations (step 3) - where we want to receive from
      // Use first receiveFrom location as start point
      newMission.startPoint = panelReceiveFrom.length > 0 ? `Point ${panelReceiveFrom[0]}` : null;
    }

    // Save mission to global storage
    saveMission(newMission);

    // Reload missions filtered for current panel
    const panelMissions = getMissionsForPanel(userId, panelSelectedAreas, panelSendTo, panelReceiveFrom);
    setMissions(panelMissions);
    
    // Ensure filter is set to 'Pending' to show the newly created mission
    setFilter('Pending');
    
    handleCloseModal();
  };

  const handleCancelMission = (id: number) => {
    if (!userId) return;
    // Delete from global storage
    deleteMission(id);
    // Reload missions filtered for current panel
    const panelMissions = getMissionsForPanel(userId, panelSelectedAreas, panelSendTo, panelReceiveFrom);
    setMissions(panelMissions);
  };

  const handleSendMission = (id: number) => {
    if (!userId) return;
    const allMissions = getAllMissions();
    const updatedMissions = allMissions.map((mission) => {
      if (mission.id === id) {
        const assignedRobot = ROBOT_NAMES[Math.floor(Math.random() * ROBOT_NAMES.length)];
        const assignedStartPoint = panelReceiveFrom[Math.floor(Math.random() * panelReceiveFrom.length)];
        
        // For Receive missions shown as Send, preserve the original startPoint (where origin panel wants to receive from)
        // and set destination to the origin panel's selected area (where they want to receive to)
        const isReceiveMission = mission.type === 'Receive';
        const originalStartPoint = mission.startPoint; // Preserve original startPoint for Receive missions
        
        // Get origin panel's selected areas to determine where they want to receive to
        let originDestination = null;
        if (isReceiveMission && mission.createdByPanelId) {
          const originPanel = getPanelByUserId(mission.createdByPanelId);
          if (originPanel?.selectedAreas && originPanel.selectedAreas.length > 0) {
            originDestination = `Point ${originPanel.selectedAreas[0]}`;
          }
        }
        
        // Select destination from panel's "Send To" areas (step 3 of edit modal) - only for Send missions
        // For Receive missions, use origin panel's selected area as destination
        const selectedDestination = isReceiveMission 
          ? originDestination
          : (panelSendTo.length > 0 
              ? panelSendTo[Math.floor(Math.random() * panelSendTo.length)]
              : null);
        
        const updated = {
          ...mission,
          status: 'In queue' as MissionStatus,
          robotName: assignedRobot,
          // For Receive missions, preserve original startPoint (where origin wants to receive from)
          // For Send missions, use the assigned start point (where this panel is sending from)
          startPoint: isReceiveMission ? originalStartPoint : `Point ${assignedStartPoint}`,
          destination: selectedDestination ? `Point ${selectedDestination}` : (isReceiveMission ? originDestination : (mission.destination || mission.startPoint)),
          assignedToPanelId: userId,
        };
        saveMission(updated);
        return updated;
      }
      return mission;
    });
    saveMissions(updatedMissions);

    // Reload missions filtered for current panel
    const panelMissions = getMissionsForPanel(userId, panelSelectedAreas, panelSendTo, panelReceiveFrom);
    setMissions(panelMissions);
  };

  const handleReceiveMission = (id: number) => {
    if (!userId) return;
    const allMissions = getAllMissions();
    const updatedMissions = allMissions.map((mission) => {
      if (mission.id === id) {
        const assignedRobot = ROBOT_NAMES[Math.floor(Math.random() * ROBOT_NAMES.length)];
        const assignedDestination = panelSendTo[Math.floor(Math.random() * panelSendTo.length)];
        
        // For Receive missions, we already have startPoint, just need to add destination
        // For Send missions appearing as Receive, startPoint is the original destination
        const missionStartPoint = mission.startPoint || mission.destination;
        
        const updated = {
          ...mission,
          status: 'In queue' as MissionStatus,
          robotName: assignedRobot,
          startPoint: missionStartPoint, // Keep existing startPoint or use destination as startPoint
          destination: `Point ${assignedDestination}`,
          assignedToPanelId: userId,
        };
        saveMission(updated);
        return updated;
      }
      return mission;
    });
    saveMissions(updatedMissions);

    // Reload missions filtered for current panel
    const panelMissions = getMissionsForPanel(userId, panelSelectedAreas, panelSendTo, panelReceiveFrom);
    setMissions(panelMissions);
  };

  // Handle Send mission with area selection (when this panel accepts a Send mission from another panel)
  const handleSendMissionWithArea = (id: number, area: string) => {
    if (!userId) return;
    const allMissions = getAllMissions();
    const updatedMissions = allMissions.map((mission) => {
      if (mission.id === id) {
        const assignedRobot = ROBOT_NAMES[Math.floor(Math.random() * ROBOT_NAMES.length)];
        
        const updated = {
          ...mission,
          status: 'In queue' as MissionStatus,
          robotName: assignedRobot,
          startPoint: `Point ${area}`, // Selected area where this panel is sending from
          destination: mission.destination, // Keep existing destination (where origin panel wants to send to)
          assignedToPanelId: userId,
        };
        saveMission(updated);
        return updated;
      }
      return mission;
    });
    saveMissions(updatedMissions);

    // Reload missions filtered for current panel
    const panelMissions = getMissionsForPanel(userId, panelSelectedAreas, panelSendTo, panelReceiveFrom);
    setMissions(panelMissions);
  };

  // Handle Receive mission with area selection (when this panel accepts a Receive mission from another panel)
  const handleReceiveMissionWithArea = (id: number, area: string) => {
    if (!userId) return;
    const allMissions = getAllMissions();
    const updatedMissions = allMissions.map((mission) => {
      if (mission.id === id) {
        const assignedRobot = ROBOT_NAMES[Math.floor(Math.random() * ROBOT_NAMES.length)];
        
        const updated = {
          ...mission,
          status: 'In queue' as MissionStatus,
          robotName: assignedRobot,
          startPoint: mission.startPoint, // Keep existing startPoint (where origin panel wants to receive from)
          destination: `Point ${area}`, // Selected area where this panel is receiving to
          assignedToPanelId: userId,
        };
        saveMission(updated);
        return updated;
      }
      return mission;
    });
    saveMissions(updatedMissions);

    // Reload missions filtered for current panel
    const panelMissions = getMissionsForPanel(userId, panelSelectedAreas, panelSendTo, panelReceiveFrom);
    setMissions(panelMissions);
  };

  // Handle automatic status transitions: In queue -> Active -> Completed
  useEffect(() => {
    const allMissions = getAllMissions();
    const inQueueMissions = allMissions.filter(m => m.status === 'In queue');
    const activeMissions = allMissions.filter(m => m.status === 'Active');

    const timers: NodeJS.Timeout[] = [];

    // Set up timers for In queue -> Active transitions (5 seconds)
    inQueueMissions.forEach((mission) => {
      const timer = setTimeout(() => {
        const updated = { ...mission, status: 'Active' as MissionStatus };
        saveMission(updated);
        
        // Reload missions for current panel
        if (userId) {
          const panelMissions = getMissionsForPanel(userId, panelSelectedAreas, panelSendTo, panelReceiveFrom);
          setMissions(panelMissions);
        }
      }, 5000);
      timers.push(timer);
    });

    // Set up timers for Active -> Completed transitions (10 seconds)
    activeMissions.forEach((mission) => {
      const timer = setTimeout(() => {
        const updated = { ...mission, status: 'Completed' as MissionStatus };
        saveMission(updated);
        
        // Reload missions for current panel
        if (userId) {
          const panelMissions = getMissionsForPanel(userId, panelSelectedAreas, panelSendTo, panelReceiveFrom);
          setMissions(panelMissions);
        }
      }, 10000);
      timers.push(timer);
    });

    // Cleanup timers on unmount or when missions change
    return () => {
      timers.forEach(timer => clearTimeout(timer));
    };
  }, [missions, userId, panelSendTo, panelReceiveFrom]);

  const filteredMissions = missions.filter((mission) => {
    // When filtering by "Pending", also show "In queue" missions
    if (filter === 'Pending') {
      return mission.status === 'Pending' || mission.status === 'In queue';
    }
    // Otherwise, match exact status
    return mission.status === filter;
  });

  // Helper to get display text for status
  const getStatusDisplayText = (status: MissionStatus) => {
    if (status === 'Pending') return 'Ordered';
    if (status === 'In queue') return 'Departure';
    return status;
  };

  return (
    <div className="min-h-screen bg-gray-100 font-inter pb-20 md:pb-0">
      {userId ? (
        <>
          <Header
            filter={filter}
            setFilter={setFilter}
            onOpenAddMissionModal={handleOpenModal}
            onOpenAdminModal={handleOpenAdminModal}
            userId={userId}
            language={language}
            setLanguage={setLanguage}
          />

          <main className="container mx-auto p-4 md:p-6">
            <div className="flex items-center justify-between mb-4 px-2 sm:px-0">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-800">{getStatusDisplayText(filter)} Missions</h1>
              
              {filter === 'Pending' && (
                <img 
                  src="https://www.logo.wine/a/logo/KUKA/KUKA-Logo.wine.svg" 
                  alt="KUKA Logo" 
                  className="h-12 sm:h-16 md:h-20 w-auto"
                />
              )}
            </div>

            {filteredMissions.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                {filteredMissions.map((mission) => (
                  <MissionCard
                    key={mission.id}
                    mission={mission}
                    displayType={mission.displayType}
                    isCreatedByThisPanel={mission.isCreatedByThisPanel}
                    onCancelMission={handleCancelMission}
                    onSendMission={handleSendMission}
                    onReceiveMission={handleReceiveMission}
                    onSendMissionWithArea={handleSendMissionWithArea}
                    onReceiveMissionWithArea={handleReceiveMissionWithArea}
                    panelSelectedAreas={panelSelectedAreas}
                    panelSendTo={panelSendTo}
                    panelReceiveFrom={panelReceiveFrom}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 mt-10">
                <p>No {filter.toLowerCase()} missions found.</p>
              </div>
            )}
          </main>

          {/* Mobile: Floating Add Mission Button (Bottom Right) */}
          <button
            onClick={handleOpenModal}
            className="fixed bottom-6 right-6 md:hidden z-50 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 flex items-center justify-center"
            aria-label="Add Mission"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
          </button>
        </>
      ) : (
        <div className="flex items-center justify-center" style={{ height: '100vh' }}>
          <button
            onClick={handleOpenCreatePanelModal}
            className="px-6 py-3 sm:py-3 bg-blue-600 text-white font-semibold text-base sm:text-lg rounded-lg shadow-md hover:bg-blue-700 active:bg-blue-800 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 touch-manipulation"
          >
            Create Panel
          </button>
        </div>
      )}

      <AddMissionModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onCreateMission={handleCreateMission}
        sendToLocations={panelSendTo}
        receiveFromLocations={panelReceiveFrom}
        selectedAreas={panelSelectedAreas}
      />

      <AdminPasswordModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        onAdminLogin={handleAdminLogin}
      />

      <AdminActionsModal
        isOpen={isAdminActionsModalOpen}
        onClose={handleCloseAdminActions}
        onDeletePanel={handleDeletePanel}
        onChangePanel={handleOpenChangePanelModal}
        onEditPanel={handleOpenEditPanelModal}
      />

      <ChangePanelModal
        isOpen={isChangePanelModalOpen}
        onClose={() => setIsChangePanelModalOpen(false)}
        currentUserId={userId || ''}
        onSelectPanel={handleSelectPanel}
        onOpenCreatePanel={handleOpenCreatePanelModal}
      />

      <EditPanelModal
        isOpen={isEditPanelModalOpen}
        onClose={() => setIsEditPanelModalOpen(false)}
        onEditPanel={handleEditPanel}
        onCreatePanel={userId ? undefined : handlePanelCreation}
        currentUserId={userId || ''}
        currentSendTo={panelSendTo}
        currentReceiveFrom={panelReceiveFrom}
        isCreateMode={!userId}
      />
    </div>
  );
}

