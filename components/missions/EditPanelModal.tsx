'use client'

import { useState, useEffect } from 'react';
import { ALL_LOCATIONS } from '@/lib/mockData';

interface EditPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEditPanel: (sendTo: string[], receiveFrom: string[]) => void;
  currentUserId: string;
  currentSendTo: string[];
  currentReceiveFrom: string[];
}

export function EditPanelModal({ 
  isOpen, 
  onClose, 
  onEditPanel,
  currentUserId,
  currentSendTo,
  currentReceiveFrom 
}: EditPanelModalProps) {
  const [selectedSendTo, setSelectedSendTo] = useState<string[]>(currentSendTo);
  const [selectedReceiveFrom, setSelectedReceiveFrom] = useState<string[]>(currentReceiveFrom);
  const [error, setError] = useState<string | null>(null);

  // Update state when props change
  useEffect(() => {
    if (isOpen) {
      setSelectedSendTo(currentSendTo);
      setSelectedReceiveFrom(currentReceiveFrom);
      setError(null);
    }
  }, [isOpen, currentSendTo, currentReceiveFrom]);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedSendTo.length === 0) {
      setError('Please select at least one "Send To" location.');
      return;
    }

    if (selectedReceiveFrom.length === 0) {
      setError('Please select at least one "Receive From" location.');
      return;
    }

    onEditPanel(selectedSendTo, selectedReceiveFrom);
    handleClose();
  };

  const handleClose = () => {
    setSelectedSendTo(currentSendTo);
    setSelectedReceiveFrom(currentReceiveFrom);
    setError(null);
    onClose();
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
        <label className="block text-sm font-medium text-gray-700 mb-2">{title}</label>
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
        <p className="text-xs text-gray-500 mt-1">
          {title === 'Action Points: You Send To'
            ? 'Destinations this panel can send to.'
            : 'Sources this panel can receive from.'}
        </p>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 transition-opacity">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md m-4 transform transition-all max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Edit Panel</h2>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="mb-4 p-3 bg-gray-50 rounded-md">
          <p className="text-sm text-gray-600">
            <span className="font-semibold">Panel ID:</span> {currentUserId}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {renderLocationGrid('Action Points: You Send To', ALL_LOCATIONS, selectedSendTo, setSelectedSendTo)}
          {renderLocationGrid('Action Points: You Receive From', ALL_LOCATIONS, selectedReceiveFrom, setSelectedReceiveFrom)}

          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md shadow-sm hover:bg-gray-300 focus:outline-none"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 focus:outline-none"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


