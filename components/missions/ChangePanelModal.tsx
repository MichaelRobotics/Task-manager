'use client'

import { useState, useEffect } from 'react';
import { getAllPanels, savePanel, type StoredPanel } from '@/lib/panelStorage';
import { ALL_LOCATIONS } from '@/lib/mockData';

interface ChangePanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string;
  onSelectPanel: (userId: string, selectedAreas: string[], sendTo: string[], receiveFrom: string[]) => void;
  onOpenCreatePanel: () => void;
}

export function ChangePanelModal({
  isOpen,
  onClose,
  currentUserId,
  onSelectPanel,
  onOpenCreatePanel,
}: ChangePanelModalProps) {
  const [panels, setPanels] = useState<StoredPanel[]>([]);

  useEffect(() => {
    if (isOpen) {
      setPanels(getAllPanels());
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleSelectPanel = (panel: StoredPanel) => {
    onSelectPanel(
      panel.userId,
      panel.selectedAreas || [],
      panel.sendToLocations,
      panel.receiveFromLocations
    );
    onClose();
  };

  const handleCreateNew = () => {
    onClose();
    onOpenCreatePanel();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 transition-opacity p-2 sm:p-4">
      <div className="bg-white rounded-lg shadow-xl p-4 sm:p-6 w-full max-w-md transform transition-all max-h-[95vh] sm:max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4 gap-2">
          <h2 className="text-lg sm:text-xl font-bold text-gray-800">Change Panel</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-3 mb-4">
          {panels.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No panels available. Create a new one!</p>
          ) : (
            panels.map((panel) => (
              <button
                key={panel.id}
                onClick={() => handleSelectPanel(panel)}
                className={`w-full text-left px-4 py-3 rounded-md border-2 transition-colors ${
                  panel.userId === currentUserId
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50'
                }`}
              >
                <div className="font-semibold text-gray-800">{panel.userId}</div>
                <div className="text-xs text-gray-500 mt-1">
                  Origin: {(panel.selectedAreas || []).length > 0 ? panel.selectedAreas.join(', ') : 'None'}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Send To: {panel.sendToLocations.join(', ')} | Receive From: {panel.receiveFromLocations.join(', ')}
                </div>
                {panel.userId === currentUserId && (
                  <div className="text-xs text-blue-600 mt-1 font-medium">Current Panel</div>
                )}
              </button>
            ))
          )}
        </div>

        <button
          onClick={handleCreateNew}
          className="w-full px-4 py-3 sm:py-3 bg-blue-600 text-white font-semibold rounded-md shadow-sm hover:bg-blue-700 active:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 transition-colors touch-manipulation"
        >
          Create Panel
        </button>
      </div>
    </div>
  );
}



