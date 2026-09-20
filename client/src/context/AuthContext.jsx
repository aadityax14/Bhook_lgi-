import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState({
    name: 'Aaditya Yadav',
    phone: '9876543210',
    hostel: 'GH4',
    roomNumber: '312',
    role: 'student' // 'student' or 'admin'
  });

  const [isAdminView, setIsAdminView] = useState(false);
  const [isMobileFrame, setIsMobileFrame] = useState(false); // Toggle mobile simulation frame on desktop

  const updateUser = (fields) => {
    setUser(prev => ({ ...prev, ...fields }));
  };

  const toggleAdmin = () => {
    setIsAdminView(prev => !prev);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        updateUser,
        isAdminView,
        setIsAdminView,
        toggleAdmin,
        isMobileFrame,
        setIsMobileFrame
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
