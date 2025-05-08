import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import api from '../utils/api';

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
      if (!user) {
        setBlurEmail(false);
        return;
      }
      
      try {
        const response = await api.get('/api/profile/preferences');
        if (response.data) {
          setBlurEmail(response.data.blurEmail || false);
        }
      } catch (error) {
        console.error('Error loading email blur preference:', error);
        // Default to false if there's an error
        setBlurEmail(false);
      }
    };
    
    loadEmailBlurPreference();
  }, [user]);
  
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
    setBlurEmail,
    getBlurredEmail,
    getPrivacyEmail
  };
  
  return (
    <EmailBlurContext.Provider value={value}>
      {children}
    </EmailBlurContext.Provider>
  );
};

export default EmailBlurContext;
