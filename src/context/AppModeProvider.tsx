import React, { createContext, useState, useEffect } from 'react';
import { AppMode } from "@/types";

interface AppModeContextType {
  mode: AppMode;
  setMode: (mode: AppMode, reload?: boolean) => void;
  toggleMode: () => void;
}

export const AppModeContext = createContext<AppModeContextType | undefined>(undefined);

export const AppModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode] = useState<AppMode>(() => {
    return (localStorage.getItem('app_mode') as AppMode) || 'nursery';
  });

  const setMode = (newMode: AppMode, reload = true) => {
    localStorage.setItem('app_mode', newMode);
    if (reload) {
      window.location.reload();
    }
  };

  const toggleMode = () => {
    setMode(mode === 'nursery' ? 'summer_camp' : 'nursery');
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', mode);
  }, [mode]);

  return (
    <AppModeContext.Provider value={{ mode, setMode, toggleMode }}>
      {children}
    </AppModeContext.Provider>
  );
};
