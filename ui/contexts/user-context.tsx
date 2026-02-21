import React, { createContext, useContext, useState, ReactNode } from 'react';

export type UserMode = 'pasager' | 'admin' | null;

type UserContextType = {
  userMode: UserMode;
  setUserMode: (mode: UserMode) => void;
  logout: () => void;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [userMode, setUserMode] = useState<UserMode>(null);

  const logout = () => {
    setUserMode(null);
  };

  return (
    <UserContext.Provider value={{ userMode, setUserMode, logout }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
