// WorksitePro Design Tokens — mirrors the web app palette
export const COLORS = {
  // Backgrounds
  background: "#0f0f13",
  card: "#1a1a24",
  cardAlt: "#16161f",
  border: "#2a2a38",
  muted: "#22222e",

  // Foreground / text
  foreground: "#f0f0f5",
  mutedForeground: "#7a7a9a",
  accentForeground: "#c0c0d8",

  // Primary brand — vibrant indigo/violet
  primary: "#7c6ff7",
  primaryLight: "rgba(124,111,247,0.15)",
  primaryForeground: "#ffffff",

  // Status
  green: "#22c55e",
  greenLight: "rgba(34,197,94,0.12)",
  red: "#ef4444",
  redLight: "rgba(239,68,68,0.12)",
  orange: "#f97316",
  orangeLight: "rgba(249,115,22,0.12)",
  blue: "#3b82f6",
  blueLight: "rgba(59,130,246,0.12)",
  purple: "#a855f7",
  purpleLight: "rgba(168,85,247,0.12)",

  // Overlays
  overlay: "rgba(0,0,0,0.6)",
  glassBg: "rgba(26,26,36,0.92)",
};

export const FONTS = {
  regular: { fontFamily: "System" },
  medium: { fontFamily: "System", fontWeight: "500" },
  semibold: { fontFamily: "System", fontWeight: "600" },
  bold: { fontFamily: "System", fontWeight: "700" },
  black: { fontFamily: "System", fontWeight: "900" },
};

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 999,
};

import { Platform } from "react-native";

export const SHADOW = {
  primary:
    Platform.OS === "web"
      ? { boxShadow: "0 4px 24px rgba(124,111,247,0.35)" }
      : {
          shadowColor: "#7c6ff7",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 12,
          elevation: 8,
        },
  card:
    Platform.OS === "web"
      ? { boxShadow: "0 2px 12px rgba(0,0,0,0.45)" }
      : {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.4,
          shadowRadius: 8,
          elevation: 5,
        },
};
