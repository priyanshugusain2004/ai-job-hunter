import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';


export interface User {
  id: string;
  email: string;
  full_name: string | null;
  location: string | null;
  phone: string | null;
  linkedin_url: string | null;
  github_username: string | null;
  portfolio_url: string | null;
  target_role: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User> & { password?: string }) => Promise<User>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Initialize: attempt silent refresh to restore session
  useEffect(() => {
    const initAuth = async () => {
      try {
        const res = await fetch('/api/v1/auth/refresh', {
          method: 'POST',
          credentials: 'include',
        });
        if (res.ok) {
          const data = await res.json();
          setToken(data.access_token);
          await fetchUserProfile(data.access_token);
        }
      } catch (err) {
        console.error('Silent refresh failed on startup', err);
      } finally {
        setLoading(false);
      }
    };
    initAuth();
  }, []);

  const fetchUserProfile = async (accessToken: string) => {
    try {
      const res = await fetch('/api/v1/profile/me', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (res.ok) {
        const profile = await res.json();
        setUser(profile);
      } else {
        // Clear tokens if profile fetch fails
        setToken(null);
        setUser(null);
      }
    } catch (err) {
      console.error('Failed to fetch profile', err);
      setToken(null);
      setUser(null);
    }
  };

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || 'Invalid credentials');
      }

      const data = await res.json();
      setToken(data.access_token);
      await fetchUserProfile(data.access_token);
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string, fullName: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, full_name: fullName }),
        credentials: 'include',
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || 'Registration failed');
      }

      const data = await res.json();
      setToken(data.access_token);
      await fetchUserProfile(data.access_token);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await fetch('/api/v1/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (err) {
      console.error('Logout request failed', err);
    } finally {
      setToken(null);
      setUser(null);
      setLoading(false);
    }
  };

  const updateProfile = async (data: Partial<User> & { password?: string }) => {
    if (!token) throw new Error('Not authenticated');
    
    const res = await fetch('/api/v1/profile/me', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.detail || 'Failed to update profile');
    }

    const updatedUser = await res.json();
    setUser(updatedUser);
    return updatedUser;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
