import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

// Detect if we are on Web, Android Emulator, or a Physical Device
let BASE_URL = "http://10.2.1.9:5000/api"; // Default to physical device IP
if (Platform.OS === "web") {
  BASE_URL = "http://localhost:5000/api";
} else if (Platform.OS === "android" && !__DEV__) {
  // If needed later for emulator specifically: BASE_URL = "http://10.0.2.2:5000/api";
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
    return Promise.reject(message);
  }
);

export default API;
