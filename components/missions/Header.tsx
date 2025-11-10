'use client'

import { FilterButton } from './FilterButton';
import { MobileFilterButton } from './MobileFilterButton';
import type { MissionStatus } from '@/types/missions';

interface HeaderProps {
  filter: MissionStatus;
  setFilter: (filter: MissionStatus) => void;
  onOpenAddMissionModal: () => void;
  onOpenAdminModal: () => void;
  userId: string;
}

const filterOrder: MissionStatus[] = ['Pending', 'Active', 'Completed'];

export function Header({ 
  filter, 
  setFilter, 
  onOpenAddMissionModal, 
  onOpenAdminModal, 
  userId 
}: HeaderProps) {
  const handleCycleFilter = () => {
    const currentIndex = filterOrder.indexOf(filter);
    const nextIndex = (currentIndex + 1) % filterOrder.length;
    setFilter(filterOrder[nextIndex]);
  };

  return (
    <header className="bg-white shadow-md sticky top-0 z-10">
      <nav className="container mx-auto px-4 py-4 flex justify-between items-center">
        {/* Left Side: Filters */}
        {/* Mobile: Single cycling button, Desktop: All buttons */}
        <div className="flex gap-2">
          {/* Mobile: Show single cycling button */}
          <div className="md:hidden">
            <MobileFilterButton currentFilter={filter} onCycleFilter={handleCycleFilter} />
          </div>
          {/* Desktop: Show all filter buttons */}
          <div className="hidden md:flex gap-2">
            <FilterButton
              label="Ordered"
              filterName="Pending"
              currentFilter={filter}
              setFilter={setFilter}
            />
            <FilterButton
              label="Active"
              filterName="Active"
              currentFilter={filter}
              setFilter={setFilter}
            />
            <FilterButton
              label="Completed"
              filterName="Completed"
              currentFilter={filter}
              setFilter={setFilter}
            />
          </div>
        </div>

        {/* Center: Panel ID - Hidden on mobile */}
        <div className="hidden sm:block">
          <span className="text-sm font-medium text-gray-600">Panel ID: {userId}</span>
        </div>

        {/* Right Side: Settings Button Only (Add Mission moved to floating button on mobile) */}
        <div className="flex items-center gap-3">
          {/* Add Mission Button - Hidden on mobile (shown as floating button) */}
          <button
            onClick={onOpenAddMissionModal}
            className="hidden md:flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Add Mission
          </button>
          {/* Settings Button - Always visible */}
          <button
            onClick={onOpenAdminModal}
            className="p-2 bg-gray-200 text-gray-700 rounded-lg shadow-md hover:bg-gray-300 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400"
            title="Settings"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0l-.1.41c-.65.21-1.26.53-1.8.97l-.34-.24c-1.42-.99-3.23.5-2.24 1.92l.24.34c-.44.54-.76 1.15-.97 1.8l-.41.1c-1.56.38-1.56 2.6 0 2.98l.41.1c.21.65.53 1.26.97 1.8l-.24.34c-.99 1.42.8 3.23 2.24 1.92l.34-.24c.54.44 1.15.76 1.8.97l.1.41c.38 1.56 2.6 1.56 2.98 0l.1-.41c.65-.21 1.26-.53 1.8-.97l.34.24c1.42.99 3.23-.5 2.24-1.92l-.24-.34c.44.54.76 1.15.97 1.8l.41-.1c1.56-.38-1.56-2.6 0 2.98l-.41-.1c-.21-.65-.53-1.26-.97-1.8l.24-.34c.99-1.42-.8-3.23-2.24-1.92l-.34.24c-.54-.44-1.15-.76-1.8-.97l-.1-.41zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </nav>
    </header>
  );
}

