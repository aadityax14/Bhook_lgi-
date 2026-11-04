import React, {
  createContext,
  useContext,
  useEffect,
  useState
} from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  // Default profile details are kept for existing app UI compatibility.
  const [user, setUser] = useState({
    name: 'Aaditya Yadav',
    phone: '9876543210',
    hostel: 'GH4',
    roomNumber: '312',
    role: 'student'
  });

  const [authLoading, setAuthLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const [isAdminView, setIsAdminView] = useState(false);
  const [isMobileFrame, setIsMobileFrame] = useState(false);

  // Restore login details when the app opens or refreshes.
  useEffect(() => {
    const savedUser = localStorage.getItem('bhook_user');
    const savedToken = localStorage.getItem('bhook_token');

    if (savedUser && savedToken) {
      try {
        const parsedUser = JSON.parse(savedUser);

        setUser(parsedUser);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Invalid saved user:', error);

        localStorage.removeItem('bhook_user');
        localStorage.removeItem('bhook_token');

        setIsAuthenticated(false);
      }
    } else {
      setIsAuthenticated(false);
    }

    setAuthLoading(false);
  }, []);

  // Called after successful login or account creation.
  const login = (userData, token) => {
    if (!userData || !token) {
      console.error('Login failed: user data or token is missing.');
      setIsAuthenticated(false);
      return false;
    }

    setUser(userData);
    setIsAuthenticated(true);

    localStorage.setItem(
      'bhook_user',
      JSON.stringify(userData)
    );

    localStorage.setItem(
      'bhook_token',
      token
    );

    return true;
  };

  // Sign out the current user.
  const logout = () => {
    setUser({
      name: 'Aaditya Yadav',
      phone: '9876543210',
      hostel: 'GH4',
      roomNumber: '312',
      role: 'student'
    });

    setIsAuthenticated(false);

    localStorage.removeItem('bhook_user');
    localStorage.removeItem('bhook_token');
  };

  // Update user details.
  const updateUser = (fields) => {
    setUser(prev => {
      if (!prev) return prev;

      const updatedUser = {
        ...prev,
        ...fields
      };

      if (isAuthenticated) {
        localStorage.setItem(
          'bhook_user',
          JSON.stringify(updatedUser)
        );
      }

      return updatedUser;
    });
  };

  // Existing admin-view functionality.
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
        isAuthenticated,

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