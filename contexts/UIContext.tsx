import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

type UIMode = "original" | "modern";

interface UIContextType {
  uiMode: UIMode;
  toggleUIMode: () => void;
  setUIMode: (mode: UIMode) => void;
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
  const [uiMode, setUIMode] = useState<UIMode>("original");

  useEffect(() => {
    const savedMode = localStorage.getItem("financeUIMode") as UIMode;
    if (savedMode && (savedMode === "original" || savedMode === "modern")) {
      setUIMode(savedMode);
    }
  }, []);

  const toggleUIMode = () => {
    const newMode: UIMode = uiMode === "original" ? "modern" : "original";
    setUIMode(newMode);
    localStorage.setItem("financeUIMode", newMode);
  };

  const handleSetUIMode = (mode: UIMode) => {
    setUIMode(mode);
    localStorage.setItem("financeUIMode", mode);
  };

  return (
    <UIContext.Provider
      value={{
        uiMode,
        toggleUIMode,
        setUIMode: handleSetUIMode,
      }}
    >
      {children}
    </UIContext.Provider>
  );
};
