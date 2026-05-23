import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

// Detect if we are on Web (local dev) or production
let BASE_URL = "https://real-time-collaboration-platform-lxpn.onrender.com/api";
if (Platform.OS === "web" && __DEV__) {
  BASE_URL = "http://localhost:5000/api";
}

const API = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

// Attach token from storage on every request
API.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("authToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Unified error handling
API.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.message ||
      "Something went wrong";
    
    const customError = new Error(message);
    customError.response = error.response;
    
    return Promise.reject(customError);
  }
);

export default API;
