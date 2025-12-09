"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

type UIMode = "modern";

interface UIContextType {
  uiMode: UIMode;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const useUI = (): UIContextType => {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error("useUI must be used within a UIProvider");
  }
  return context;
};

interface UIProviderProps {
  children: ReactNode;
}

export const UIProvider: React.FC<UIProviderProps> = ({ children }) => {
  const uiMode: UIMode = "modern";

  return (
    <UIContext.Provider
      value={{
        uiMode,
      }}
    >
      {children}
    </UIContext.Provider>
  );
};
