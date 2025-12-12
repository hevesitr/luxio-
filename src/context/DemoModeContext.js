import React, { createContext, useContext, useState } from 'react';

const DemoModeContext = createContext();

export const DemoModeProvider = ({ children }) => {
  const [isDemoMode, setIsDemoMode] = useState(false);

  const value = {
    isDemoMode,
    setIsDemoMode,
    enableDemoMode: () => setIsDemoMode(true),
    disableDemoMode: () => setIsDemoMode(false),
  };

  return (
    <DemoModeContext.Provider value={value}>
      {children}
    </DemoModeContext.Provider>
  );
};

export const useDemoMode = () => {
  const context = useContext(DemoModeContext);
  if (!context) {
    throw new Error('useDemoMode must be used within a DemoModeProvider');
  }
  return context;
};

export default DemoModeContext;
