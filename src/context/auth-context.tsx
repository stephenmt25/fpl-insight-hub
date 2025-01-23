import { createContext, useContext, useState } from "react";
import { Manager, ManagerHistory, GameweekPicks } from "@/types/fpl";
import { AuthContextType } from "@/types/context";

const defaultContext: AuthContextType = {
  isSignedIn: false,
  fplId: null,
  signIn: () => {},
  signOut: () => {},
  updateManagerHistory: () => {},
  currentManager: null,
  managerHistory: null,
  currentGameweekPicks: null,
  updateGameweekPicks: () => {},
};

const AuthContext = createContext<AuthContextType>(defaultContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [fplId, setFplId] = useState<string | null>(null);
  const [currentManager, setCurrentManager] = useState<Manager | null>(null);
  const [managerHistory, setManagerHistory] = useState<ManagerHistory | null>(null);
  const [currentGameweekPicks, setCurrentGameweekPicks] = useState<GameweekPicks | null>(null);

  const signIn = (id: string, manager: Manager) => {
    setFplId(id);
    setCurrentManager(manager);
    localStorage.setItem("managerData", JSON.stringify(manager));
    setIsSignedIn(true);
  };

  const signOut = () => {
    setIsSignedIn(false);
    setFplId(null);
    setCurrentManager(null);
    setManagerHistory(null);
    setCurrentGameweekPicks(null);
    localStorage.removeItem("managerData");
  };

  const updateManagerHistory = (history: ManagerHistory) => {
    setManagerHistory(history);
  };

  const updateGameweekPicks = (picks: GameweekPicks) => {
    setCurrentGameweekPicks(picks);
  };

  return (
    <AuthContext.Provider 
      value={{ 
        isSignedIn, 
        fplId, 
        signIn, 
        signOut, 
        currentManager, 
        managerHistory, 
        updateManagerHistory,
        currentGameweekPicks,
        updateGameweekPicks,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}