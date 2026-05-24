"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSandbox, setIsSandbox] = useState(true);

  // Sync session state
  useEffect(() => {
    const savedUser = localStorage.getItem("kylr_user");
    const savedMode = localStorage.getItem("kylr_mode");
    
    if (savedMode === "production") {
      setIsSandbox(false);
    }
    
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    } else {
      // Seed default sandbox user
      const defaultUser = {
        uid: "KYLR_SANDBOX_USER_99",
        displayName: "Aura Capitalist",
        email: "aura.capitalist@kylr.io",
        photoURL: "https://api.dicebear.com/7.x/pixel-art/svg?seed=Aura",
        salary: 5000,
        budgetRuleEnabled: true,
        needsPercentage: 50,
        wantsPercentage: 30,
        savingsPercentage: 20,
        currency: "USD"
      };
      setUser(defaultUser);
      localStorage.setItem("kylr_user", JSON.stringify(defaultUser));
    }
    setLoading(false);
  }, []);

  // Sandbox Google Sign-In
  const signInWithGoogleMock = (customName) => {
    setLoading(true);
    const mockUser = {
      uid: "KYLR_USER_" + Math.random().toString(36).substr(2, 9).toUpperCase(),
      displayName: customName || "GenZ Hustler",
      email: (customName ? customName.toLowerCase().replace(/\s+/g, '') : "hustler") + "@kylr.io",
      photoURL: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${customName || 'Hustler'}`,
      salary: 5000,
      budgetRuleEnabled: true,
      needsPercentage: 50,
      wantsPercentage: 30,
      savingsPercentage: 20,
      currency: "USD"
    };
    setUser(mockUser);
    localStorage.setItem("kylr_user", JSON.stringify(mockUser));
    setLoading(false);
    return mockUser;
  };

  // Switch between sandbox local mode and live Google Sheets backend
  const toggleSystemMode = (mode) => {
    if (mode === "production") {
      setIsSandbox(false);
      localStorage.setItem("kylr_mode", "production");
    } else {
      setIsSandbox(true);
      localStorage.setItem("kylr_mode", "sandbox");
    }
  };

  // Sign out
  const logOut = () => {
    setUser(null);
    localStorage.removeItem("kylr_user");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        loading,
        isSandbox,
        setIsSandbox,
        toggleSystemMode,
        signInWithGoogleMock,
        logOut
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
