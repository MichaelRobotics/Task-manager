'use client'

import type { MissionStatus } from '@/types/missions';

interface MobileFilterButtonProps {
  currentFilter: MissionStatus;
  onCycleFilter: () => void;
}

const filterOrder: MissionStatus[] = ['Pending', 'Active', 'Completed'];

const getStatusDisplayText = (status: MissionStatus): string => {
  if (status === 'Pending') return 'Ordered';
  if (status === 'In queue') return 'Departure';
  return status;
};

export function MobileFilterButton({ currentFilter, onCycleFilter }: MobileFilterButtonProps) {
  const classes = `
    px-4 py-2 rounded-md font-medium text-sm transition-all duration-200
    bg-blue-500 text-white shadow-sm
  `;

  return (
    <button onClick={onCycleFilter} className={classes}>
      {getStatusDisplayText(currentFilter)}
    </button>
  );
}



