"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { authApi, tokens, UserProfile, LoginPayload, RegisterPayload, ApiError } from "./api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AuthState {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextValue extends AuthState {
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const accessToken = tokens.getAccess();
    if (!accessToken) {
      setUser(null);
      setIsLoading(false);
      return;
    }
    try {
      const profile = await authApi.me();
      setUser(profile);
    } catch {
      tokens.clear();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Charge le profil au démarrage si un token existe
  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = useCallback(async (payload: LoginPayload) => {
    const { access, refresh } = await authApi.login(payload);
    tokens.set(access, refresh);
    const profile = await authApi.me();
    setUser(profile);
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    await authApi.register(payload);
    // Après inscription, login automatique
    await login({ email: payload.email, password: payload.password });
  }, [login]);

  const logout = useCallback(() => {
    tokens.clear();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth doit être utilisé dans un AuthProvider");
  return ctx;
}

// ─── Helpers rôles ────────────────────────────────────────────────────────────

export function getRoleDashboard(role: string): string {
  switch (role) {
    case "AGENT_FINANCIER":
    case "MAIRE":
      return "/commune/dashboard";
    case "DGDDL":
    case "COUR_COMPTES":
      return "/controle/dashboard";
    case "BAILLEUR":
    case "CITOYEN":
    case "JOURNALISTE":
      return "/public/dashboard";
    default:
      return "/public/dashboard";
  }
}
