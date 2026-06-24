// Import process polyfill first to ensure it's available for all other modules
import './process-polyfill';

// Patch localStorage and sessionStorage to automatically neutralize expired Facebook/Instagram CDN URLs
(function() {
  const isCdnUrlExpired = (url) => {
    if (!url || typeof url !== 'string') return false;
    const lowercase = url.toLowerCase();
    if (lowercase.includes('fbcdn.net') || lowercase.includes('cdninstagram.com')) {
      try {
        const cleanUrl = url.replace(/&amp;/g, '&');
        const urlObj = new URL(cleanUrl);
        const oe = urlObj.searchParams.get('oe') || urlObj.searchParams.get('amp;oe');
        if (oe) {
          const expirationSec = parseInt(oe, 16);
          if (!isNaN(expirationSec)) {
            const currentSec = Math.floor(Date.now() / 1000);
            return expirationSec < currentSec;
          }
        }
      } catch (_) {}
    }
    return false;
  };

  const clean = (obj, tracker) => {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj === 'string') {
      if (isCdnUrlExpired(obj)) {
        tracker.modified = true;
        return null;
      }
      return obj;
    }
    if (Array.isArray(obj)) {
      for (let i = 0; i < obj.length; i++) {
        obj[i] = clean(obj[i], tracker);
      }
      return obj;
    }
    if (typeof obj === 'object') {
      for (const k in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, k)) {
          obj[k] = clean(obj[k], tracker);
        }
      }
      return obj;
    }
    return obj;
  };

  const patchStorage = (storageName) => {
    try {
      const storage = window[storageName];
      if (!storage) return;
      const originalGetItem = storage.getItem;
      storage.getItem = function(key) {
        const value = originalGetItem.call(storage, key);
        if (!value || typeof value !== 'string') return value;
        
        if (value.startsWith('{') || value.startsWith('[')) {
          try {
            const parsed = JSON.parse(value);
            const tracker = { modified: false };
            const cleaned = clean(parsed, tracker);
            if (tracker.modified) {
              return JSON.stringify(cleaned);
            }
          } catch (_) {}
        } else {
          if (isCdnUrlExpired(value)) {
            return null;
          }
        }
        return value;
      };
    } catch (e) {
      console.warn(`Failed to patch ${storageName}.getItem:`, e);
    }
  };

  patchStorage('localStorage');
  patchStorage('sessionStorage');
})();

import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
