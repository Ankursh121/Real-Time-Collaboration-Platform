import React from "react";
import { View, StyleSheet, Dimensions, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS } from "../theme/colors";

const { width, height } = Dimensions.get("window");

export default function ScreenWrapper({ children, style, useSafeArea = true }) {
  const Container = useSafeArea ? SafeAreaView : View;

  return (
    <View style={styles.background}>
      {/* Futuristic Background Glows */}
      <View style={[styles.glowOrb, styles.orb1]} />
      <View style={[styles.glowOrb, styles.orb2]} />
      <View style={[styles.glowOrb, styles.orb3]} />
      
      {/* Decorative Grid Lines */}
      <View style={styles.gridLineH} />
      <View style={styles.gridLineV} />

      <Container style={[styles.container, style]}>
        {children}
      </Container>
    </View>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: "#08080c", // Deep premium space dark background
    position: "relative",
    overflow: "hidden",
  },
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  glowOrb: {
    position: "absolute",
    borderRadius: 999,
    opacity: 0.15,
    backgroundColor: COLORS.primary,
    ...Platform.select({
      web: {
        filter: "blur(80px)",
      },
    }),
  },
  orb1: {
    width: width * 0.8,
    height: width * 0.8,
    top: -height * 0.2,
    right: -width * 0.2,
    backgroundColor: COLORS.primary,
  },
  orb2: {
    width: width * 0.7,
    height: width * 0.7,
    bottom: -height * 0.1,
    left: -width * 0.2,
    backgroundColor: COLORS.purple || "#a855f7",
  },
  orb3: {
    width: width * 0.4,
    height: width * 0.4,
    top: height * 0.4,
    right: -width * 0.1,
    backgroundColor: COLORS.blue || "#3b82f6",
    opacity: 0.08,
  },
  gridLineH: {
    position: "absolute",
    top: height * 0.15,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(124,111,247,0.04)",
  },
  gridLineV: {
    position: "absolute",
    left: width * 0.15,
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: "rgba(124,111,247,0.04)",
  },
});
