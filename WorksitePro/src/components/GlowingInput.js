import React, { useState, useRef } from "react";
import {
  View,
  TextInput,
  StyleSheet,
  Animated,
  Platform,
} from "react-native";
import { COLORS, RADIUS } from "../theme/colors";

export default function GlowingInput({
  icon,
  style,
  inputStyle,
  placeholderTextColor,
  onFocus,
  onBlur,
  ...props
}) {
  const [focused, setFocused] = useState(false);
  const glowAnim = useRef(new Animated.Value(0)).current;

  const handleFocus = (e) => {
    setFocused(true);
    Animated.timing(glowAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: false, // color/borderWidth animation requires false in standard RN
    }).start();
    if (onFocus) onFocus(e);
  };

  const handleBlur = (e) => {
    setFocused(false);
    Animated.timing(glowAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
    if (onBlur) onBlur(e);
  };

  const borderColor = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["rgba(42, 42, 56, 1)", COLORS.primary],
  });

  const backgroundColor = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["rgba(26, 26, 36, 0.6)", "rgba(124, 111, 247, 0.08)"],
  });

  return (
    <Animated.View
      style={[
        styles.wrapper,
        {
          borderColor,
          backgroundColor,
        },
        focused && styles.wrapperFocused,
        style,
      ]}
    >
      {icon && <View style={styles.iconContainer}>{icon}</View>}
      <TextInput
        style={[styles.input, inputStyle]}
        placeholderTextColor={placeholderTextColor || COLORS.mutedForeground}
        onFocus={handleFocus}
        onBlur={handleBlur}
        {...props}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: RADIUS.xl,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    height: 56,
    marginBottom: 8,
  },
  wrapperFocused: {
    ...Platform.select({
      ios: {
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: "0 0 15px rgba(124, 111, 247, 0.25)",
      },
    }),
  },
  iconContainer: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: COLORS.foreground,
    fontSize: 15,
    fontWeight: "600",
  },
});
