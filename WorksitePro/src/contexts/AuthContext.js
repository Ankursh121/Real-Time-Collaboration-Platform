import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import API from "../services/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkUser = async () => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }
      const res = await API.get("/auth/me");
      if (res.data.success) {
        setUser(res.data.data);
      }
    } catch {
      setUser(null);
      await AsyncStorage.removeItem("authToken");
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
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, setUser, loading, login, logout, checkUser, completeAuth }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
