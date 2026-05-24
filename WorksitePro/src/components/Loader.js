import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated, Easing, Text } from "react-native";
import { COLORS } from "../theme/colors";

export default function Loader({ size = 48, message = "Loading..." }) {
  const spinAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    // Spin animation
    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 1200,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.6,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <View style={styles.container}>
      <View style={[styles.spinnerWrapper, { width: size + 24, height: size + 24 }]}>
        {/* Outer glowing pulsed ring */}
        <Animated.View
          style={[
            styles.pulseRing,
            {
              width: size + 16,
              height: size + 16,
              opacity: pulseAnim.interpolate({
                inputRange: [0.6, 1],
                outputRange: [0.15, 0.45],
              }),
              transform: [{ scale: pulseAnim }],
            },
          ]}
        />
        
        {/* Main rotating arc */}
        <Animated.View
          style={[
            styles.spinnerArc,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              transform: [{ rotate: spin }],
            },
          ]}
        />
      </View>
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  spinnerWrapper: {
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  pulseRing: {
    position: "absolute",
    borderRadius: 999,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  spinnerArc: {
    borderWidth: 3,
    borderColor: "transparent",
    borderTopColor: COLORS.primary,
    borderRightColor: COLORS.primaryLight,
  },
  message: {
    marginTop: 16,
    color: COLORS.mutedForeground,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
});
