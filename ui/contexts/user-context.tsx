import React, { createContext, useContext, useState, ReactNode } from 'react';

export type UserMode = 'pasager' | 'admin' | null;
export type DriverStatus = 'liber' | 'ocupat' | 'indisponibil';

type UserContextType = {
  userMode: UserMode;
  setUserMode: (mode: UserMode) => void;
  logout: () => void;
  driverStatus: DriverStatus;
  setDriverStatus: (status: DriverStatus) => void;
  tarifZi: string;
  setTarifZi: (tarif: string) => void;
  tarifNoapte: string;
  setTarifNoapte: (tarif: string) => void;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [userMode, setUserMode] = useState<UserMode>(null);
  const [driverStatus, setDriverStatus] = useState<DriverStatus>('liber');
  const [tarifZi, setTarifZi] = useState('3');
  const [tarifNoapte, setTarifNoapte] = useState('4');

  const logout = () => {
    setUserMode(null);
  };

  return (
    <UserContext.Provider value={{ 
      userMode, 
      setUserMode, 
      logout,
      driverStatus,
      setDriverStatus,
      tarifZi,
      setTarifZi,
      tarifNoapte,
      setTarifNoapte
    }}>
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
