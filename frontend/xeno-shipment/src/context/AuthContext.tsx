import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import axios from 'axios';
import { preloadParcelItemsCache } from '@hooks/useParcelItemsCache';
import { userRoleListService } from '@pages/user-role-list/userRoleListService';
import type { UserRoleList } from '@pages/user-role-list/types';

type MSLoginUser = {
  id: string;
  email: string;
  name: string;
  accessToken: string;
};

interface User {
  userID: number;
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  gender: string;
  phone: string;
  email: string;
  departmentID: string;
  section_index: string;
  postitionID: string;
  active: string;
  role: string;
  user_code: string | null;
  supervisorID: string;
  level: string | null;
  headID: string | null;
  logisticRole: string | null;
}

interface Approver {
  userID: number;
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  gender: string;
  phone: string;
  email: string;
  departmentID: string;
  section_index: string;
  postitionID: string;
  active: string;
  role: string;
  user_code: string | null;
  supervisorID: string | null;
  level: string | null;
  headID: string | null;
  logisticRole: string | null;
}

interface AuthContextType {
  user: User | null;
  approver: Approver | null;
  msLoginUser: MSLoginUser | null;
  userRoleList: UserRoleList | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasDbData: boolean;
  login: (userData: MSLoginUser) => void;
  logout: () => void;
  fetchUserData: (email: string) => Promise<void>;
  refreshCache: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [msLoginUser, setMSLoginUser] = useState<MSLoginUser | null>(null);
  const [approver, setApprover] = useState<Approver | null>(null);
  const [userRoleList, setUserRoleList] = useState<UserRoleList | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasDbData, setHasDbData] = useState(true);

  useEffect(() => {
    const initializeAuth = () => {
      try {
        const storedMSLoginUser = localStorage.getItem('msLoginUser');
        if (storedMSLoginUser) {
          const msLoginUserData = JSON.parse(storedMSLoginUser);
          setMSLoginUser(msLoginUserData);
        }

        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          setUser(userData);
        }

        const storedApprover = localStorage.getItem('approver');
        if (storedApprover) {
          const approverData = JSON.parse(storedApprover);
          setApprover(approverData);
        }

        const storedUserRoleList = localStorage.getItem('userRoleList');
        if (storedUserRoleList) {
          const userRoleListData = JSON.parse(storedUserRoleList);
          setUserRoleList(userRoleListData);
        }

        // If we have msLoginUser but no user/approver data, set hasDbData to false
        if (storedMSLoginUser && (!storedUser || !storedApprover)) {
          setHasDbData(false);
        }
      } catch (error) {
        console.error('Failed to parse stored user data:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('approver');
        localStorage.removeItem('msLoginUser');
        localStorage.removeItem('userRoleList');
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const fetchUserData = async (email: string) => {
    try {
      const response = await axios.post(import.meta.env.VITE_APP_GET_USER_BY_EMAIL, {
        email: email
      });

      if (response.data && response.data.user && response.data.approver) {
        const userData = response.data.user;
        const approverData = response.data.approver;

        setUser(userData);
        setApprover(approverData);
        setHasDbData(true);

        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('approver', JSON.stringify(approverData));

        // Fetch user role list data
        try {
          const roleData = await userRoleListService.getUserRoleByEmail(email);
          if (roleData) {
            setUserRoleList(roleData);
            localStorage.setItem('userRoleList', JSON.stringify(roleData));
          } else {
            setUserRoleList(null);
            localStorage.removeItem('userRoleList');
          }
        } catch (roleError) {
          console.error('Failed to fetch user role list:', roleError);
          setUserRoleList(null);
          localStorage.removeItem('userRoleList');
        }

        // Preload parcel items cache in the background
        preloadParcelItemsCache();

      } else {
        // No user data found in database
        setHasDbData(false);
      }
    } catch (error) {
      console.error('Failed to fetch user data:', error);
      // If user has @xenoptics.com email, allow login without DB data
      if (email.endsWith('@xenoptics.com')) {
        setHasDbData(false);
      } else {
        throw error;
      }
    }
  };

  const login = (userData: MSLoginUser) => {
    localStorage.setItem('msLoginUser', JSON.stringify(userData));
    setMSLoginUser(userData);
    
    // Allow @xenoptics.com users to login even without DB data
    if (userData.email.endsWith('@xenoptics.com')) {
      fetchUserData(userData.email).catch(err => {
        console.error('Error fetching user data after login:', err);
        // Don't logout @xenoptics.com users if DB fetch fails
        setHasDbData(false);
      });
    } else {
      fetchUserData(userData.email).catch(err => {
        console.error('Error fetching user data after login:', err);
        logout();
      });
    }
  };

  const logout = () => {
    setUser(null);
    setApprover(null);
    setMSLoginUser(null);
    setUserRoleList(null);
    setHasDbData(false);
    localStorage.removeItem('user');
    localStorage.removeItem('approver');
    localStorage.removeItem('token');
    localStorage.removeItem('msLoginUser');
    localStorage.removeItem('userRoleList');
    // Clear all cache data
    localStorage.clear();
  };

  const refreshCache = async () => {
    if (msLoginUser?.email) {
      try {
        // Refresh user data
        await fetchUserData(msLoginUser.email);
        // Refresh parcel items cache
        await preloadParcelItemsCache();
      } catch (error) {
        console.error('Failed to refresh cache:', error);
      }
    }
  };

  const value: AuthContextType = {
    user,
    approver,
    msLoginUser,
    userRoleList,
    isAuthenticated: !!msLoginUser,
    isLoading,
    hasDbData,
    login,
    logout,
    fetchUserData,
    refreshCache
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};