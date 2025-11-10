'use client'

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 transition-opacity">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm m-4 transform transition-all">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">Admin Actions</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex flex-col gap-4">
          <button
            onClick={onEditPanel}
            className="w-full px-4 py-3 bg-green-600 text-white font-semibold rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-75"
          >
            Edit Panel
          </button>
          <button
            onClick={onChangePanel}
            className="w-full px-4 py-3 bg-blue-600 text-white font-semibold rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75"
          >
            Change Panel
          </button>
          <button
            onClick={onDeletePanel}
            className="w-full px-4 py-3 bg-red-600 text-white font-semibold rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-75"
          >
            Delete Current Panel
          </button>
        </div>
      </div>
    </div>
  );
}

