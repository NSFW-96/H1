// Utility to clear Firestore cache to force a reload of data
// Run this in your browser console if you're seeing stale data

function clearFirestoreCache() {
  try {
    // Clear indexedDB for Firestore
    const request = indexedDB.deleteDatabase('firebaseLocalStorageDb');
    
    request.onsuccess = function() {
      console.log('Firestore cache cleared successfully');
      console.log('Please refresh the page to fetch fresh data');
    };
    
    request.onerror = function() {
      console.error('Error clearing Firestore cache');
    };
    
    // Also clear localStorage for good measure
    localStorage.removeItem('firebase:previous_websocket_failure');
    
    // Remove other Firebase related localStorage items
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('firebase:')) {
        localStorage.removeItem(key);
      }
    }
    
    console.log('Additional Firebase cache cleared from localStorage');
    console.log('Please refresh the page and log in again to see updated data');
  } catch (e) {
    console.error('Error during cache clearing:', e);
  }
}

// To use this function, open your browser console and run:
// clearFirestoreCache()

export default clearFirestoreCache; 