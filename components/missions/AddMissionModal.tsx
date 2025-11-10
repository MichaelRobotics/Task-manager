'use client'

import type { MissionType } from '@/types/missions';

interface AddMissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateMission: (mission: {
    robotName: null;
    startPoint: string | null;
    destination: string | null;
    type: MissionType;
  }) => void;
  sendToLocations: string[];
  receiveFromLocations: string[];
}

export function AddMissionModal({
  isOpen,
  onClose,
  onCreateMission,
  sendToLocations,
  receiveFromLocations,
}: AddMissionModalProps) {
  if (!isOpen) {
    return null;
  }

  const handleSelectType = (type: MissionType) => {
    onCreateMission({
      robotName: null,
      startPoint: null,
      destination: null,
      type,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 transition-opacity">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md m-4 transform transition-all">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">Create New Mission</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <button
            onClick={() => handleSelectType('Send')}
            className="w-full px-6 py-4 bg-green-600 text-white font-semibold text-lg rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-75 transition-colors"
          >
            SEND
          </button>
          <button
            onClick={() => handleSelectType('Receive')}
            className="w-full px-6 py-4 bg-blue-600 text-white font-semibold text-lg rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 transition-colors"
          >
            RECEIVE
          </button>
        </div>
      </div>
    </div>
  );
}

