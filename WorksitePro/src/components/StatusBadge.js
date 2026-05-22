import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { RADIUS } from "../theme/colors";

export default function StatusBadge({
  children,
  color = "#7c6ff7",
  bgColor = "rgba(124,111,247,0.12)",
  style,
  textStyle,
}) {
  return (
    <View style={[styles.badge, { backgroundColor: bgColor, borderColor: color }, style]}>
      {/* Light dot indicator */}
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.text, { color }, textStyle]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    alignSelf: "flex-start",
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  text: {
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
