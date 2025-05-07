import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

// Simple test to check if the App component renders
test('renders App component', () => {
  render(<App />);
  // This is a very basic test just to see if the component renders without crashing
  expect(document.body).toBeDefined();
});
