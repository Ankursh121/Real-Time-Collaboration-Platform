import React, { useRef } from "react";
import {
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
  ActivityIndicator,
  View,
} from "react-native";
import { COLORS, RADIUS, SHADOW } from "../theme/colors";

export default function FuturisticButton({
  children,
  onPress,
  style,
  textStyle,
  icon,
  loading = false,
  disabled = false,
  variant = "primary", // 'primary' | 'secondary' | 'danger' | 'success' | 'glass'
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const shadowAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0.96,
        useNativeDriver: true,
        speed: 40,
        bounciness: 0,
      }),
      Animated.timing(shadowAnim, {
        toValue: 0.3,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        speed: 30,
        bounciness: 8,
      }),
      Animated.timing(shadowAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const getVariantStyles = () => {
    switch (variant) {
      case "secondary":
        return styles.btnSecondary;
      case "danger":
        return styles.btnDanger;
      case "success":
        return styles.btnSuccess;
      case "glass":
        return styles.btnGlass;
      default:
        return styles.btnPrimary;
    }
  };

  const getVariantTextStyles = () => {
    switch (variant) {
      case "glass":
        return styles.textGlass;
      case "secondary":
        return styles.textSecondary;
      default:
        return styles.textPrimary;
    }
  };

  return (
    <Animated.View
      style={[
        styles.btnWrapper,
        {
          transform: [{ scale: scaleAnim }],
          opacity: disabled ? 0.6 : 1,
        },
        style,
      ]}
    >
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        activeOpacity={1}
        style={[styles.btn, getVariantStyles()]}
      >
        {loading ? (
          <ActivityIndicator color={variant === "glass" ? COLORS.primary : "#ffffff"} />
        ) : (
          <View style={styles.content}>
            {icon && <View style={styles.iconContainer}>{icon}</View>}
            <Text style={[styles.text, getVariantTextStyles(), textStyle]}>
              {children}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  btnWrapper: {
    borderRadius: RADIUS.xl,
    overflow: "visible",
    ...Platform.select({
      ios: {
        shadowColor: "#7c6ff7",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  btn: {
    borderRadius: RADIUS.xl,
    paddingVertical: 15,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  iconContainer: {
    marginRight: 8,
  },
  text: {
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 0.5,
    textAlign: "center",
  },
  btnPrimary: {
    backgroundColor: COLORS.primary,
    borderColor: "rgba(255, 255, 255, 0.15)",
  },
  textPrimary: {
    color: "#ffffff",
  },
  btnSecondary: {
    backgroundColor: "transparent",
    borderColor: COLORS.primary,
  },
  textSecondary: {
    color: COLORS.primary,
  },
  btnDanger: {
    backgroundColor: COLORS.red,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  btnSuccess: {
    backgroundColor: COLORS.green,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  btnGlass: {
    backgroundColor: "rgba(124, 111, 247, 0.15)",
    borderColor: "rgba(124, 111, 247, 0.35)",
  },
  textGlass: {
    color: COLORS.primary,
  },
});
