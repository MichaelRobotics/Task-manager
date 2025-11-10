// Utility function to reset all localStorage used by the task manager app
// This can be called from the browser console or from within the app

export function resetLocalStorage(): void {
  if (typeof window === 'undefined') {
    console.log('This function must be run in a browser environment');
    return;
  }

  const STORAGE_KEYS = [
    'global_labels',
    'location_labels',
    'area_custom_names',
    'all_missions',
    'mission_panels',
  ];

  console.log('Clearing localStorage...');
  
  STORAGE_KEYS.forEach(key => {
    if (localStorage.getItem(key)) {
      localStorage.removeItem(key);
      console.log(`✓ Removed: ${key}`);
    } else {
      console.log(`- Not found: ${key}`);
    }
  });

  // Also clear any other keys that might exist
  const allKeys = Object.keys(localStorage);
  const remainingKeys = allKeys.filter(key => 
    key.includes('mission') || 
    key.includes('panel') || 
    key.includes('label') || 
    key.includes('area')
  );
  
  if (remainingKeys.length > 0) {
    console.log('\nClearing additional related keys...');
    remainingKeys.forEach(key => {
      localStorage.removeItem(key);
      console.log(`✓ Removed: ${key}`);
    });
  }

  console.log('\n✅ localStorage has been reset!');
  console.log('Please refresh the page to see the changes.');
}

// Make it available globally in browser
if (typeof window !== 'undefined') {
  (window as any).resetLocalStorage = resetLocalStorage;
}

