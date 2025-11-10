'use client'

import { resetLocalStorage } from '@/lib/resetStorage';

interface AdminActionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeletePanel: () => void;
  onChangePanel: () => void;
  onEditPanel: () => void;
}

export function AdminActionsModal({ isOpen, onClose, onDeletePanel, onChangePanel, onEditPanel }: AdminActionsModalProps) {
  if (!isOpen) {
    return null;
  }

  const handleResetStorage = () => {
    if (confirm('Are you sure you want to reset all localStorage data? This will delete all panels, missions, cargo types, and custom area names. This action cannot be undone.')) {
      resetLocalStorage();
      // Reload the page to reflect the changes
      window.location.reload();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 transition-opacity p-2 sm:p-4">
      <div className="bg-white rounded-lg shadow-xl p-4 sm:p-6 w-full max-w-sm transform transition-all">
        <div className="flex justify-between items-center mb-4 sm:mb-6 gap-2">
          <h2 className="text-lg sm:text-xl font-bold text-gray-800">Admin Actions</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex flex-col gap-3 sm:gap-4">
          <button
            onClick={onEditPanel}
            className="w-full px-4 py-3 bg-green-600 text-white font-semibold rounded-md shadow-sm hover:bg-green-700 active:bg-green-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-75 transition-colors touch-manipulation"
          >
            Edit Panel
          </button>
          <button
            onClick={onChangePanel}
            className="w-full px-4 py-3 bg-blue-600 text-white font-semibold rounded-md shadow-sm hover:bg-blue-700 active:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 transition-colors touch-manipulation"
          >
            Change Panel
          </button>
          <button
            onClick={onDeletePanel}
            className="w-full px-4 py-3 bg-red-600 text-white font-semibold rounded-md shadow-sm hover:bg-red-700 active:bg-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-75 transition-colors touch-manipulation"
          >
            Delete Current Panel
          </button>
          <button
            onClick={handleResetStorage}
            className="w-full px-4 py-3 bg-orange-600 text-white font-semibold rounded-md shadow-sm hover:bg-orange-700 active:bg-orange-800 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-opacity-75 transition-colors touch-manipulation"
          >
            Reset All Data
          </button>
        </div>
      </div>
    </div>
  );
}

