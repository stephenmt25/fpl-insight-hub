import { Manager, ManagerHistory } from "@/types/fpl";
import { createContext, useContext, useState, ReactNode } from "react";

interface AuthContextType {
  isSignedIn: boolean;
  fplId: string | null;
  signIn: (id: string, manager: Object) => void;
  signOut: () => void;
  updateManagerHistory: (history: ManagerHistory) => void;
  currentManager: any;
  managerHistory: ManagerHistory
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [fplId, setFplId] = useState<string | null>(null);
  const [ currentManager, setCurrentManager ] = useState<any | null>(null);
  const [ managerHistory, setManagerHistory ] = useState<ManagerHistory>(null);

  const signIn = (id: string, manager: Object) => {
    setFplId(id);
    setCurrentManager(manager)
    localStorage.setItem("managerData", JSON.stringify(manager) )
    setIsSignedIn(true);
  };

  const signOut = () => {
    setIsSignedIn(false);
    setFplId(null);
  };

  const updateManagerHistory = (history: ManagerHistory) => {
    setManagerHistory(history)
  }

  return (
    <AuthContext.Provider value={{ isSignedIn, fplId, signIn, signOut, currentManager, managerHistory, updateManagerHistory }}>
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