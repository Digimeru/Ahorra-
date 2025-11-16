import React from "react";
import { TextInput, StyleSheet } from "react-native";

const styles = StyleSheet.create({
  input: {
    height: 40,
    width: "100%",
    paddingHorizontal: 12,
    fontSize: 16,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#d1d5db",
    backgroundColor: "#fff",
    color: "#1f2937",
  },
  inputFocused: {
    borderColor: "#3b82f6",
    shadowColor: "#3b82f6",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 3,
    elevation: 3,
  },
  inputInvalid: {
    borderColor: "#dc2626",
  },
});

function toBool(v) {
  if (v === true || v === false) return v;
  if (typeof v === "string") {
    const s = v.trim().toLowerCase();
    if (s === "true") return true;
    if (s === "false") return false;
  }
  return Boolean(v);
}

function Input({ style, secureTextEntry, disabled, editable, ...props }) {
  const [isFocused, setFocused] = React.useState(false);

  const isDisabled = toBool(disabled);
  const isEditable = editable !== undefined ? toBool(editable) : !isDisabled;
  const secure = toBool(secureTextEntry);

  const inputStyle = [
    styles.input,
    isFocused && styles.inputFocused,
    isDisabled && { opacity: 0.5 },
    style,
  ];

  return (
    <TextInput
      {...props} 
      style={inputStyle}
      secureTextEntry={secure}
      editable={isEditable}
      onFocus={(e) => {
        setFocused(true);
        props.onFocus?.(e);
      }}
      onBlur={(e) => {
        setFocused(false);
        props.onBlur?.(e);
      }}
      placeholderTextColor="#9ca3af"
    />
  );
}

export { Input };
