'use client'

import { useState, useEffect } from 'react';
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

export function MissionsDashboard() {
  const [missions, setMissions] = useState<PanelMission[]>([]);
  const [filter, setFilter] = useState<MissionStatus>('Pending');
  const [userId, setUserId] = useState<string | null>(null);
  const [panelSendTo, setPanelSendTo] = useState<string[]>([]);
  const [panelReceiveFrom, setPanelReceiveFrom] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isAdminActionsModalOpen, setIsAdminActionsModalOpen] = useState(false);
  const [isChangePanelModalOpen, setIsChangePanelModalOpen] = useState(false);
  const [isEditPanelModalOpen, setIsEditPanelModalOpen] = useState(false);

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
        // Filter missions for this panel
        const panelMissions = getMissionsForPanel(
          userId,
          storedPanel.sendToLocations,
          storedPanel.receiveFromLocations
        );
        setMissions(panelMissions);
      } else {
        // Panel doesn't exist - clear state
        setPanelSendTo([]);
        setPanelReceiveFrom([]);
        setMissions([]);
      }
    } else {
      // No userId selected - clear state
      setPanelSendTo([]);
      setPanelReceiveFrom([]);
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
      setFilter('Pending');
      // Filter missions for the selected panel
      const panelMissions = getMissionsForPanel(
        nextPanel.userId,
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

    // Reload missions for the updated panel
    const panelMissions = getMissionsForPanel(userId, sendTo, receiveFrom);
    setMissions(panelMissions);

    setIsEditPanelModalOpen(false);
  };

  // Change Panel Flow
  const handleOpenChangePanelModal = () => {
    setIsAdminActionsModalOpen(false);
    setIsChangePanelModalOpen(true);
  };

  const handleSelectPanel = (selectedUserId: string, sendTo: string[], receiveFrom: string[]) => {
    setUserId(selectedUserId);
    setPanelSendTo(sendTo);
    setPanelReceiveFrom(receiveFrom);
    setFilter('Pending');
    // Filter missions for the selected panel
    const panelMissions = getMissionsForPanel(selectedUserId, sendTo, receiveFrom);
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
    setFilter('Pending');
    // Filter missions for the new panel
    const panelMissions = getMissionsForPanel(newUserId, sendTo, receiveFrom);
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
      // For Send missions, selected area is the destination (from Send to Areas)
      newMission.destination = `Point ${missionDetails.selectedArea}`;
      // Start point will be assigned when operator clicks "Send" button (from selectedAreas in step 1)
    } else if (newMission.type === 'Receive' && missionDetails.selectedArea) {
      // For Receive missions, selected area is the start point (from Receive From Areas)
      newMission.startPoint = `Point ${missionDetails.selectedArea}`;
      // Destination will be assigned when operator clicks "Receive" button (from selectedAreas in step 1)
    }

    // Save mission to global storage
    saveMission(newMission);

    // Reload missions filtered for current panel
    const panelMissions = getMissionsForPanel(userId, panelSendTo, panelReceiveFrom);
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
    const panelMissions = getMissionsForPanel(userId, panelSendTo, panelReceiveFrom);
    setMissions(panelMissions);
  };

  const handleSendMission = (id: number) => {
    if (!userId) return;
    const allMissions = getAllMissions();
    const updatedMissions = allMissions.map((mission) => {
      if (mission.id === id) {
        const assignedRobot = ROBOT_NAMES[Math.floor(Math.random() * ROBOT_NAMES.length)];
        const assignedStartPoint = panelReceiveFrom[Math.floor(Math.random() * panelReceiveFrom.length)];
        
        // Select destination from panel's "Send To" areas (step 3 of edit modal)
        const selectedDestination = panelSendTo.length > 0 
          ? panelSendTo[Math.floor(Math.random() * panelSendTo.length)]
          : null;
        
        const updated = {
          ...mission,
          status: 'In queue' as MissionStatus,
          robotName: assignedRobot,
          startPoint: `Point ${assignedStartPoint}`,
          destination: selectedDestination ? `Point ${selectedDestination}` : mission.destination || mission.startPoint,
          assignedToPanelId: userId,
        };
        saveMission(updated);
        return updated;
      }
      return mission;
    });
    saveMissions(updatedMissions);

    // Reload missions filtered for current panel
    const panelMissions = getMissionsForPanel(userId, panelSendTo, panelReceiveFrom);
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
    const panelMissions = getMissionsForPanel(userId, panelSendTo, panelReceiveFrom);
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
          const panelMissions = getMissionsForPanel(userId, panelSendTo, panelReceiveFrom);
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
          const panelMissions = getMissionsForPanel(userId, panelSendTo, panelReceiveFrom);
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
          />

          <main className="container mx-auto p-4 md:p-6">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 px-2 sm:px-0">{getStatusDisplayText(filter)} Missions</h1>

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
        selectedAreas={[...new Set([...panelSendTo, ...panelReceiveFrom])]}
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

