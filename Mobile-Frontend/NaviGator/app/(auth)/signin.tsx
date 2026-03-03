// app/(auth)/signin.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { authService } from "../../services/auth";

const COLORS = {
  primary: "#1A8C51",
  primaryLight: "#2DB86E",
  background: "#F7FAF5",
  surface: "#FFFFFF",
  foreground: "#1A2E1A",
  muted: "#7A917A",
  border: "#D4E4D4",
  inputBg: "#F0F5F0",
  error: "#E53935",
};

export default function SignInScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert("Missing Fields", "Please enter both email and password.");
      return;
    }

    setLoading(true);

    try {
      await authService.signin(email, password);
      console.log("✅ Signed in successfully");
      router.replace("/(tabs)");
    } catch (error: any) {
      console.error("Sign in error:", error);
      Alert.alert("Sign In Failed", error.message, [{ text: "OK" }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      <View style={styles.content}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoText}>N</Text>
        </View>

        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Sign in to continue your journey</Text>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="jane@example.com"
              placeholderTextColor={COLORS.muted}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              placeholderTextColor={COLORS.muted}
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            style={[styles.primaryButton, loading && styles.buttonDisabled]}
            onPress={handleSignIn}
            activeOpacity={0.8}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryButtonText}>Sign In</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.textButton}
            activeOpacity={0.6}
            onPress={() => router.push("/(auth)/signup")}
          >
            <Text style={styles.textButtonLabel}>
              Don't have an account?{" "}
              <Text style={styles.textButtonAccent}>Sign Up</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 24,
  },
  logoText: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "800",
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: COLORS.foreground,
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.muted,
    textAlign: "center",
    marginBottom: 32,
  },
  form: {
    width: "100%",
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.foreground,
    marginBottom: 6,
  },
  input: {
    backgroundColor: COLORS.inputBg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 14,
    color: COLORS.foreground,
    fontSize: 16,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 8,
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 16,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  textButton: {
    marginTop: 16,
    alignItems: "center",
  },
  textButtonLabel: {
    color: COLORS.muted,
    fontWeight: "600",
  },
  textButtonAccent: {
    color: COLORS.primary,
    fontWeight: "800",
  },
});