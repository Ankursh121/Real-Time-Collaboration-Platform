import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import API from "../services/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const setUserAndCache = (newVal) => {
    setUser((prev) => {
      const resolved = typeof newVal === "function" ? newVal(prev) : newVal;
      if (resolved) {
        AsyncStorage.setItem("userData", JSON.stringify(resolved)).catch(() => {});
      } else {
        AsyncStorage.removeItem("userData").catch(() => {});
      }
      return resolved;
    });
  };

  const checkUser = async () => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      // Optimistic load from storage to bypass cold-start delays
      const cached = await AsyncStorage.getItem("userData");
      if (cached) {
        setUser(JSON.parse(cached));
        setLoading(false);
      }

      // Perform verification in the background
      try {
        const res = await API.get("/auth/me");
        if (res.data.success) {
          const freshUser = res.data.data;
          setUser(freshUser);
          await AsyncStorage.setItem("userData", JSON.stringify(freshUser));
        }
      } catch (err) {
        const isUnauthorized = err.response?.status === 401 || err.response?.status === 403;
        if (isUnauthorized) {
          setUser(null);
          await AsyncStorage.removeItem("authToken");
          await AsyncStorage.removeItem("userData");
        }
      }
    } catch {
      setUser(null);
      await AsyncStorage.removeItem("authToken");
      await AsyncStorage.removeItem("userData");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkUser();
  }, []);

  const completeAuth = async (u, accessToken) => {
    if (accessToken) {
      await AsyncStorage.setItem("authToken", accessToken);
    }
    if (u) {
      await AsyncStorage.setItem("userData", JSON.stringify(u));
    }
    setUser(u);
    return u;
  };

  const login = async (firebaseToken, registrationData = null) => {
    const payload = { firebaseToken, ...registrationData };

    const res = await API.post("/auth/verify-otp", payload);
    if (res.data.success) {
      const { user: u, accessToken } = res.data.data;
      return await completeAuth(u, accessToken);
    }
    throw new Error("Login failed");
  };

  const logout = async () => {
    try {
      await API.post("/auth/logout");
    } catch {}
    await AsyncStorage.removeItem("authToken");
    await AsyncStorage.removeItem("userData");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, setUser: setUserAndCache, loading, login, logout, checkUser, completeAuth }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
