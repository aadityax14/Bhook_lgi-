import React, { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext();

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export function AuthProvider({ children }) {
  // Real logged-in customer
  const [user, setUser] = useState({
  name: 'Aaditya Yadav',
  phone: '9876543210',
  hostel: 'GH4',
  roomNumber: '312',
  role: 'student'
});

  // Authentication loading state
  const [authLoading, setAuthLoading] = useState(true);

  const [isAdminView, setIsAdminView] = useState(false);
  const [isMobileFrame, setIsMobileFrame] = useState(false);

  // --------------------------------------------------
  // Restore login after page refresh
  // --------------------------------------------------
  useEffect(() => {
    const savedUser = localStorage.getItem('bhook_user');

    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error('Invalid saved user:', error);
        localStorage.removeItem('bhook_user');
        localStorage.removeItem('bhook_token');
      }
    }

    setAuthLoading(false);
  }, []);

  // --------------------------------------------------
  // Save user whenever login happens
  // --------------------------------------------------
  const login = (userData, token) => {
    setUser(userData);

    localStorage.setItem('bhook_user', JSON.stringify(userData));

    if (token) {
      localStorage.setItem('bhook_token', token);
    }
  };

  // --------------------------------------------------
  // Logout
  // --------------------------------------------------
  const logout = () => {
    setUser(null);

    localStorage.removeItem('bhook_user');
    localStorage.removeItem('bhook_token');
  };

  // --------------------------------------------------
  // Update customer profile
  // --------------------------------------------------
  const updateUser = (fields) => {
    setUser(prev => {
      if (!prev) return prev;

      const updatedUser = {
        ...prev,
        ...fields
      };

      localStorage.setItem(
        'bhook_user',
        JSON.stringify(updatedUser)
      );

      return updatedUser;
    });
  };

  const toggleAdmin = () => {
    setIsAdminView(prev => !prev);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,

        login,
        logout,
        updateUser,

        authLoading,

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