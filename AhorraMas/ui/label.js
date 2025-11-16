"use client";

import React from "react";
import { Text, StyleSheet } from "react-native";

const styles = StyleSheet.create({
  label: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    fontSize: 14,
    fontWeight: "500",
    opacity: 1,
  },
  labelDisabled: {
    opacity: 0.5,
  },
});

function Label({ style, children, disabled = false, ...props }) {
  const labelStyle = [
    styles.label,
    disabled && styles.labelDisabled,
    style,
  ];

  return (
    <Text style={labelStyle} {...props}>
      {children}
    </Text>
  );
}

export { Label };
