import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState
} from 'react';
import { api } from '../services/api';

const AuthContext = createContext();

// Default profile details are kept for existing app UI compatibility
// (shown before anyone signs in).
const GUEST_USER = {
  name: 'Aaditya Yadav',
  phone: '9876543210',
  hostel: 'GH4',
  roomNumber: '312',
  role: 'CUSTOMER'
};

const normalizeRole = (role) => String(role || 'CUSTOMER').toUpperCase();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(GUEST_USER);

  const [authLoading, setAuthLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Admins can switch between the Admin Dashboard and the shop.
  const [adminViewOpen, setAdminViewOpen] = useState(false);
  const [isMobileFrame, setIsMobileFrame] = useState(false);

  const role = isAuthenticated ? normalizeRole(user?.role) : 'GUEST';
  const isAdmin = role === 'ADMIN';
  const isStaff = role === 'CHEF' || role === 'DELIVERY';

  // The Admin Dashboard can only be shown to an admin account.
  // (The server also refuses every admin API call from anyone else.)
  const isAdminView = isAdmin && adminViewOpen;

  const setIsAdminView = useCallback(
    (value) => {
      setAdminViewOpen(prev => {
        const next = typeof value === 'function' ? value(prev) : value;
        return Boolean(next);
      });
    },
    []
  );

  const clearSession = useCallback(() => {
    setUser(GUEST_USER);
    setIsAuthenticated(false);
    setAdminViewOpen(false);

    localStorage.removeItem('bhook_user');
    localStorage.removeItem('bhook_token');
  }, []);

  const saveUser = useCallback((userData) => {
    setUser(userData);
    localStorage.setItem('bhook_user', JSON.stringify(userData));
  }, []);

  // Restore login when the app opens, then confirm the account and
  // its CURRENT role with the server (never trust the saved copy).
  useEffect(() => {
    const savedUser = localStorage.getItem('bhook_user');
    const savedToken = localStorage.getItem('bhook_token');

    if (!savedUser || !savedToken) {
      setIsAuthenticated(false);
      setAuthLoading(false);
      return;
    }

    try {
      setUser(JSON.parse(savedUser));
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Invalid saved user:', error);
      clearSession();
      setAuthLoading(false);
      return;
    }

    let cancelled = false;

    api.getCurrentUser()
      .then(res => {
        if (cancelled || !res?.user) return;

        saveUser(res.user);

        if (normalizeRole(res.user.role) === 'ADMIN') {
          setAdminViewOpen(true);
        }
      })
      .catch(err => {
        // Expired / invalid / disabled account: sign out.
        // Network problems keep the saved session.
        if (!cancelled && err?.status === 401) {
          clearSession();
        }
      })
      .finally(() => {
        if (!cancelled) setAuthLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [clearSession, saveUser]);

  // The admin blocked or removed this account → sign out right away.
  useEffect(() => {
    const handleBlocked = (event) => {
      // Several requests can fail at once: react only the first time.
      if (!localStorage.getItem('bhook_token')) return;
      clearSession();
      window.alert(event.detail || 'Your account has been blocked by the admin.');
    };

    window.addEventListener('bhook:account-blocked', handleBlocked);
    return () => window.removeEventListener('bhook:account-blocked', handleBlocked);
  }, [clearSession]);

  // Called after successful login or account creation.
  const login = (userData, token) => {
    if (!userData || !token) {
      console.error('Login failed: user data or token is missing.');
      setIsAuthenticated(false);
      return false;
    }

    localStorage.setItem('bhook_token', token);
    saveUser(userData);
    setIsAuthenticated(true);

    // Admin goes straight to the Admin Dashboard.
    setAdminViewOpen(normalizeRole(userData.role) === 'ADMIN');

    return true;
  };

  // Sign out the current user.
  const logout = () => {
    // Let the server know (keeps the admin's "signed in" count right).
    if (localStorage.getItem('bhook_token')) {
      api.logout().catch(() => {});
    }
    clearSession();
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

        role,
        isAdmin,
        isStaff,

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
