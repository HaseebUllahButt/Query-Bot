"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { login, logout, signup } from "../api/auth";
import api from "../api/client";

interface AuthContextType {
  user: any | null;
  loading: boolean;
  login: (
    email: string,
    password: string
  ) => Promise<{ token: string; user: any }>;
  signup: (
    email: string,
    password: string
  ) => Promise<{ token: string; user: any }>;
  logout: () => Promise<void>;
  setUser: (user: any | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem("token");
      if (token) {
        const response = await api.get("/me");
        setUser(response.data);
      }
    } catch (error) {
      console.error("Auth check error:", error);
      localStorage.removeItem("token");
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const handleLogin = async (email: string, password: string) => {
    const data = await login({ email, password });
    localStorage.setItem("token", data.token);
    setUser(data.user);
    return data;
  };

  const handleSignup = async (email: string, password: string) => {
    try {
      const data = await signup({ email, password });
      console.log("Signup response:", data);
      localStorage.setItem("token", data.token);
      setUser(data.user);
      return data;
    } catch (error) {
      console.error("Signup error:", error);
      throw error;
    }
  };

  const handleLogout = async () => {
    await logout();
    localStorage.removeItem("token");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login: handleLogin,
        signup: handleSignup,
        logout: handleLogout,
        setUser,
      }}
    >
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
