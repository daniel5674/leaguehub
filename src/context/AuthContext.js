"use client";

import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const fetchCurrentUser = async () => {
    try {
      const res = await fetch("/api/auth/me", {
        method: "GET",
        credentials: "include",
      });

      if (!res.ok) {
        setCurrentUser(null);
        return;
      }

      const data = await res.json();
      setCurrentUser(data);
    } catch (error) {
      console.error("Failed to fetch current user:", error);
      setCurrentUser(null);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      await fetchCurrentUser();
      setIsLoaded(true);
    };

    initAuth();
  }, []);

  const register = async ({ email, password, role, fullName }) => {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          email,
          password,
          role,
          fullName,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        return {
          success: false,
          message: data.message || "שגיאה בהרשמה",
        };
      }

      return {
        success: true,
        message: data.message || "נרשמת בהצלחה",
      };
    } catch (error) {
      console.error("Register error:", error);
      return {
        success: false,
        message: "שגיאה בהרשמה",
      };
    }
  };

  const login = async ({ email, password }) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        return {
          success: false,
          message: data.message || "שגיאה בהתחברות",
        };
      }

      await fetchCurrentUser();

      return {
        success: true,
        message: data.message || "התחברת בהצלחה",
      };
    } catch (error) {
      console.error("Login error:", error);
      return {
        success: false,
        message: "שגיאה בהתחברות",
      };
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setCurrentUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        register,
        login,
        logout,
        isLoaded,
        refreshUser: fetchCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
