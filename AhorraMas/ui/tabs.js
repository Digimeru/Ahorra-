"use client";

import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

const styles = StyleSheet.create({
  tabs: {
    flexDirection: "column",
    gap: 8,
  },
  list: {
    flexDirection: "row",
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
    borderRadius: 16,
    backgroundColor: "#e5e7eb",
    gap: 0,
  },
  trigger: {
    flex: 1,
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    backgroundColor: "transparent",
    paddingHorizontal: 12,
  },
  triggerActive: {
    backgroundColor: "#fff",
  },
  triggerText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1f2937",
  },
  content: {
    flex: 1,
  },
});

function Tabs({ style, children, defaultValue, ...props }) {
  const [activeValue, setActiveValue] = React.useState(defaultValue);

  return (
    <View style={[styles.tabs, style]} {...props}>
      {React.Children.map(children, (child) =>
        React.cloneElement(child, { activeValue, setActiveValue })
      )}
    </View>
  );
}

function TabsList({ style, children, ...props }) {
  return (
    <View style={[styles.list, style]} {...props}>
      {children}
    </View>
  );
}

function TabsTrigger({ value, style, children, activeValue, setActiveValue, ...props }) {
  const isActive = activeValue === value;

  return (
    <TouchableOpacity
      style={[styles.trigger, isActive && styles.triggerActive, style]}
      onPress={() => setActiveValue(value)}
      {...props}
    >
      <Text style={styles.triggerText}>{children}</Text>
    </TouchableOpacity>
  );
}

function TabsContent({ value, style, children, activeValue, ...props }) {
  if (activeValue !== value) return null;

  return (
    <View style={[styles.content, style]} {...props}>
      {children}
    </View>
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };