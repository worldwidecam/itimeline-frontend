import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import api, { updateUserPreferences } from '../utils/api';

// Key for localStorage
const BLUR_PREFERENCE_KEY = 'emailBlurPreference';

// Create the context
const EmailBlurContext = createContext();

// Custom hook to use the email blur context
export const useEmailBlur = () => useContext(EmailBlurContext);

// Provider component
export const EmailBlurProvider = ({ children }) => {
  const { user } = useAuth();
  const [blurEmail, setBlurEmail] = useState(false);
  
  // Load the blur email preference when the user changes
  useEffect(() => {
    const loadEmailBlurPreference = async () => {
      // First check localStorage for the preference
      const savedPreference = localStorage.getItem(BLUR_PREFERENCE_KEY);
      
      if (savedPreference !== null) {
        // If we have a saved preference, use it
        setBlurEmail(savedPreference === 'true');
      } else if (user) {
        // If no saved preference but user is logged in, try to fetch from server
        // (commented out until backend is ready)
        /*
        try {
          const response = await api.get('/api/profile/preferences');
          if (response.data?.blurEmail !== undefined) {
            const shouldBlur = Boolean(response.data.blurEmail);
            setBlurEmail(shouldBlur);
            localStorage.setItem(BLUR_PREFERENCE_KEY, shouldBlur.toString());
          }
        } catch (error) {
          // Only log unexpected errors
          if (error.response?.status !== 404) {
            console.warn('Error loading email blur preference:', error.message);
          }
          // Default to false if there's an error
          setBlurEmail(false);
        }
        */
      } else {
        // Default to false if not logged in and no saved preference
        setBlurEmail(false);
      }
    };
    
    loadEmailBlurPreference();
  }, [user]);
  
  // Function to toggle the blur preference
  const toggleBlurEmail = () => {
    const newValue = !blurEmail;
    setBlurEmail(newValue);
    localStorage.setItem(BLUR_PREFERENCE_KEY, newValue.toString());
    // Persist to server when logged in (fire-and-forget)
    if (user && user.id) {
      try {
        updateUserPreferences({ email_blur: newValue });
      } catch (_) {}
    }
  };
  
  // Function to blur an email address
  const getBlurredEmail = (email) => {
    if (!email || !blurEmail) return email;
    
    // Simple email blurring logic - replace characters with dots except for first and last characters
    // and keep the @ symbol and domain
    const [username, domain] = email.split('@');
    
    if (username.length <= 2) {
      // If username is very short, just return the first character and dots
      return `${username.charAt(0)}${'•'.repeat(username.length - 1)}@${domain}`;
    }
    
    // Keep first and last character of username, blur the rest
    const blurredUsername = `${username.charAt(0)}${'•'.repeat(username.length - 2)}${username.charAt(username.length - 1)}`;
    
    return `${blurredUsername}@${domain}`;
  };
  
  // Function to completely mask an email with privacy dots
  const getPrivacyEmail = (email) => {
    if (!email || !blurEmail) return email;
    
    // For input fields, replace all characters with dots except for @ and domain extension
    const [username, domain] = email.split('@');
    const domainParts = domain.split('.');
    const extension = domainParts.pop(); // Get the extension (.com, .org, etc.)
    const domainName = domainParts.join('.');
    
    const maskedUsername = '•'.repeat(username.length);
    const maskedDomain = '•'.repeat(domainName.length);
    
    return `${maskedUsername}@${maskedDomain}.${extension}`;
  };
  
  // Value object to be provided by the context
  const value = {
    blurEmail,
    getBlurredEmail,
    toggleBlurEmail,
    getPrivacyEmail // Add this to make it available to components
  };
  
  return (
    <EmailBlurContext.Provider value={value}>
      {children}
    </EmailBlurContext.Provider>
  );
};

export default EmailBlurContext;
