import React from "react";
import { View, Text, StyleSheet } from "react-native";

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    color: "#1f2937",
    padding: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginBottom: 16,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 20,
    marginBottom: 8,
    color: "#1f2937",
  },
  description: {
    color: "#6b7280",
    fontSize: 14,
  },
  content: {
    paddingVertical: 0,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 16,
  },
});

function Card({ style, children, ...props }) {
  return (
    <View style={[styles.card, style]} {...props}>
      {children}
    </View>
  );
}

function CardHeader({ style, children, ...props }) {
  return (
    <View style={[styles.header, style]} {...props}>
      {children}
    </View>
  );
}

function CardTitle({ style, children, ...props }) {
  return (
    <Text style={[styles.title, style]} {...props}>
      {children}
    </Text>
  );
}

function CardDescription({ style, children, ...props }) {
  return (
    <Text style={[styles.description, style]} {...props}>
      {children}
    </Text>
  );
}

function CardContent({ style, children, ...props }) {
  return (
    <View style={[styles.content, style]} {...props}>
      {children}
    </View>
  );
}

function CardFooter({ style, children, ...props }) {
  return (
    <View style={[styles.footer, style]} {...props}>
      {children}
    </View>
  );
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
};