"use client";

import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext();

const RESET_ROLE_POWER_MODE = false;

const createPermissions = (user) => {
  const isLoggedIn = !!user;
  const isManager = user?.role === "manager";
  const isPlayer = user?.role === "player";

  return {
    isLoggedIn,
    isManager,
    isPlayer,

    role: user?.role || null,

    roleLabel:
      user?.role === "manager"
        ? "מנהל"
        : user?.role === "player"
          ? "שחקן"
          : "אורח",

    hasRolePower: !RESET_ROLE_POWER_MODE && isLoggedIn,

    canCreateLeague: !RESET_ROLE_POWER_MODE && isManager,
    canManageLeague: !RESET_ROLE_POWER_MODE && isManager,
    canEditLeague: !RESET_ROLE_POWER_MODE && isManager,
    canDeleteLeague: !RESET_ROLE_POWER_MODE && isManager,
    canApproveJoinRequests: !RESET_ROLE_POWER_MODE && isManager,

    canJoinLeague: !RESET_ROLE_POWER_MODE && isPlayer,
    canSendJoinRequest: !RESET_ROLE_POWER_MODE && isPlayer,

    canViewProtectedLeagueData: !RESET_ROLE_POWER_MODE && isLoggedIn,
  };
};

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [permissions, setPermissions] = useState(createPermissions(null));
  const [isLoaded, setIsLoaded] = useState(false);

  const fetchCurrentUser = async () => {
    try {
      const res = await fetch("/api/auth/me", {
        method: "GET",
        credentials: "include",
      });

      if (!res.ok) {
        setCurrentUser(null);
        setPermissions(createPermissions(null));
        return;
      }

      const data = await res.json();

      setCurrentUser(data);
      setPermissions(createPermissions(data));
    } catch (error) {
      console.error("Failed to fetch current user:", error);

      setCurrentUser(null);
      setPermissions(createPermissions(null));
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
      setPermissions(createPermissions(null));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        permissions,
        isAccessResetMode: RESET_ROLE_POWER_MODE,
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
