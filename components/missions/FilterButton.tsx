'use client'

interface FilterButtonProps {
  label: string;
  filterName: string;
  currentFilter: string;
  setFilter: (filter: string) => void;
}

export function FilterButton({ label, filterName, currentFilter, setFilter }: FilterButtonProps) {
  const isActive = currentFilter === filterName;

  const classes = `
    px-4 py-2 rounded-md font-medium text-sm transition-all duration-200
    ${isActive ? 'bg-blue-500 text-white shadow-sm' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}
  `;

  return (
    <button onClick={() => setFilter(filterName)} className={classes}>
      {label}
    </button>
  );
}



