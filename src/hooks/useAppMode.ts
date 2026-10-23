import { useContext } from "react";
import { AppModeContext } from "@/context/AppModeProvider";

export const useAppMode = () => {
  const context = useContext(AppModeContext);
  if (context === undefined) {
    throw new Error('useAppMode must be used within an AppModeProvider');
  }
  return context;
};
