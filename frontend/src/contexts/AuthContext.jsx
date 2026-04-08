import React, { createContext, useContext, useState, useEffect } from "react";
import API from "../services/api";
import toast from "react-hot-toast";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkUser = async () => {
    try {
      const res = await API.get("/auth/me");
      if (res.data.success) {
        setUser(res.data.data);
      }
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkUser();
  }, []);

  const login = async (phone, otp, role, workerType, name, inviteCode) => {
    try {
      const payload = { phone, otp };
      if (role) payload.role = role;
      if (workerType) payload.workerType = workerType;
      if (name) payload.name = name;
      if (inviteCode) payload.inviteCode = inviteCode;
      
      const res = await API.post("/auth/verify-otp", payload);
      if (res.data.success) {
        setUser(res.data.data.user);
        toast.success("Welcome back!");
        return res.data.data.user;
      }
    } catch (error) {
      toast.error(typeof error === 'string' ? error : error?.message || "Verification failed");
      throw error;
    }
  };

  const logout = async () => {
    try {
      await API.post("/auth/logout");
      setUser(null);
      toast.success("Logged out successfully");
    } catch (error) {
      toast.error(typeof error === 'string' ? error : error?.message || "Logout failed");
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, logout, checkUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
