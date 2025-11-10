// Script to reset all localStorage used by the task manager app
// Run this in the browser console or as a Node.js script

const STORAGE_KEYS = [
  'global_labels',
  'location_labels',
  'area_custom_names',
  'all_missions',
  'mission_panels',
];

function resetLocalStorage() {
  if (typeof window === 'undefined') {
    console.log('This script must be run in a browser environment');
    return;
  }

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

// If running in browser, make it available globally
if (typeof window !== 'undefined') {
  window.resetLocalStorage = resetLocalStorage;
}

// Export for Node.js if needed
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { resetLocalStorage, STORAGE_KEYS };
}

// Auto-run if executed directly in browser console
if (typeof window !== 'undefined' && window.location) {
  console.log('To reset localStorage, run: resetLocalStorage()');
}

