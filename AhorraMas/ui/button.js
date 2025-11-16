import React from "react";
import { TouchableOpacity, Text } from "react-native";

const styles = {
  base: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  variants: {
    default: { backgroundColor: "#16a34a" },
    destructive: { backgroundColor: "#dc2626" },
    outline: { backgroundColor: "transparent", borderWidth: 1, borderColor: "#e5e7eb" },
    secondary: { backgroundColor: "#e5e7eb" },
    ghost: { backgroundColor: "transparent" },
    link: { backgroundColor: "transparent" },
  },
  textVariants: {
    default: { color: "#fff" },
    destructive: { color: "#fff" },
    outline: { color: "#1f2937" },
    secondary: { color: "#1f2937" },
    ghost: { color: "#1f2937" },
    link: { color: "#16a34a", textDecorationLine: "underline" },
  },
  sizes: {
    default: { paddingVertical: 10, paddingHorizontal: 16 },
    sm: { paddingVertical: 6, paddingHorizontal: 12 },
    lg: { paddingVertical: 12, paddingHorizontal: 24 },
    icon: { width: 40, height: 40, paddingVertical: 0, paddingHorizontal: 0 },
  },
};

const mergeStyles = (...styleObjects) =>
  Object.assign({}, ...styleObjects.filter(Boolean));

function toBool(v) {
  if (v === true || v === false) return v;
  if (typeof v === "string") {
    const s = v.trim().toLowerCase();
    if (s === "true") return true;
    if (s === "false") return false;
  }
  return Boolean(v);
}

function Button({
  variant = "default",
  size = "default",
  style,
  children,
  disabled = false,
  ...props
}) {
  const isDisabled = toBool(disabled);

  const buttonStyle = mergeStyles(
    styles.base,
    styles.variants[variant],
    styles.sizes[size],
    style
  );

  const textStyle = mergeStyles(styles.textVariants[variant], {
    opacity: isDisabled ? 0.5 : 1,
  });

  return (
    <TouchableOpacity
      {...props}
      style={[buttonStyle, { opacity: isDisabled ? 0.5 : 1 }]}
      disabled={isDisabled}
      accessible
    >
      {typeof children === "string" ? <Text style={textStyle}>{children}</Text> : children}
    </TouchableOpacity>
  );
}

export { Button };
