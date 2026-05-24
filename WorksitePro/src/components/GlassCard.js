import React from "react";
import { View, StyleSheet, Platform } from "react-native";
import { COLORS, RADIUS } from "../theme/colors";

export default function GlassCard({ children, style, level = 1 }) {
  const getCardStyle = () => {
    switch (level) {
      case 2:
        return styles.cardLvl2;
      case 3:
        return styles.cardLvl3;
      default:
        return styles.cardLvl1;
    }
  };

  return (
    <View style={[styles.card, getCardStyle(), style]}>
      {/* Light border simulation inside the card */}
      <View style={styles.innerBorder}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: RADIUS.xl,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 10,
      },
      android: {
        elevation: 6,
      },
      web: {
        boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.4), inset 0 0 0 1px rgba(255, 255, 255, 0.05)",
      },
    }),
  },
  cardLvl1: {
    backgroundColor: "rgba(26, 26, 36, 0.75)", // Semi-transparent
    borderColor: "rgba(255, 255, 255, 0.06)",
    borderWidth: 1,
  },
  cardLvl2: {
    backgroundColor: "rgba(34, 34, 48, 0.85)", // Slightly brighter
    borderColor: "rgba(124, 111, 247, 0.2)",
    borderWidth: 1.2,
  },
  cardLvl3: {
    backgroundColor: "rgba(22, 22, 30, 0.9)", // Darker, higher contrast
    borderColor: "rgba(255, 255, 255, 0.03)",
    borderWidth: 1,
  },
  innerBorder: {
    padding: 18,
    width: "100%",
  },
});
