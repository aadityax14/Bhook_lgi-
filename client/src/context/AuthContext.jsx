import React, {
  createContext,
  useContext,
  useEffect,
  useState
} from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  /*
   * Keep the existing demo user for now.
   * We will later make unauthenticated users = null
   * after we safely update the rest of the app.
   */
  const [user, setUser] = useState({
    name: 'Aaditya Yadav',
    phone: '9876543210',
    hostel: 'GH4',
    roomNumber: '312',
    role: 'student'
  });

  const [authLoading, setAuthLoading] = useState(true);

  const [isAdminView, setIsAdminView] = useState(false);
  const [isMobileFrame, setIsMobileFrame] = useState(false);

  /*
   * Restore the previously logged-in user
   * when the website is opened again.
   */
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

  /*
   * Called after successful login or account creation.
   */
  const login = (userData, token) => {
    setUser(userData);

    localStorage.setItem(
      'bhook_user',
      JSON.stringify(userData)
    );

    if (token) {
      localStorage.setItem(
        'bhook_token',
        token
      );
    }
  };

  /*
   * Sign out the current user.
   */
  const logout = () => {
    setUser(null);

    localStorage.removeItem('bhook_user');
    localStorage.removeItem('bhook_token');
  };

  /*
   * Update details of the currently logged-in user.
   */
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

  /*
   * Existing admin-view functionality.
   */
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