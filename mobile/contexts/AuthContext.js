import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSandbox, setIsSandbox] = useState(true);

  // Sync session state on mount
  useEffect(() => {
    const loadSession = async () => {
      try {
        const savedUser = await AsyncStorage.getItem("kylr_user");
        const savedMode = await AsyncStorage.getItem("kylr_mode");
        
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
          await AsyncStorage.setItem("kylr_user", JSON.stringify(defaultUser));
        }
      } catch (e) {
        console.warn("Failed to load user session: ", e);
      } finally {
        setLoading(false);
      }
    };
    loadSession();
  }, []);

  const saveUser = async (updatedUser) => {
    setUser(updatedUser);
    await AsyncStorage.setItem("kylr_user", JSON.stringify(updatedUser));
  };

  const signInWithGoogleMock = async (customName) => {
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
    await saveUser(mockUser);
    setLoading(false);
    return mockUser;
  };

  const toggleSystemMode = async (mode) => {
    if (mode === "production") {
      setIsSandbox(false);
      await AsyncStorage.setItem("kylr_mode", "production");
    } else {
      setIsSandbox(true);
      await AsyncStorage.setItem("kylr_mode", "sandbox");
    }
  };

  const logOut = async () => {
    setUser(null);
    await AsyncStorage.removeItem("kylr_user");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser: saveUser,
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
