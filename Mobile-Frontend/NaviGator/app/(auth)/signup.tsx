import React, { useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Animated,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from "react-native";
import { useRouter } from "expo-router";

// ─── Color Tokens ───────────────────────────────────────────────
const COLORS = {
  primary: "#1A8C51",
  primaryLight: "#2DB86E",
  secondary: "#FF9F00",
  background: "#F7FAF5",
  surface: "#FFFFFF",
  foreground: "#1A2E1A",
  muted: "#7A917A",
  border: "#D4E4D4",
  inputBg: "#F0F5F0",
  error: "#E53935",
};

// ─── Preference Categories ──────────────────────────────────────
const FOOD_PREFERENCES = [
  { id: "italian", label: "Italian" },
  { id: "mexican", label: "Mexican" },
  { id: "japanese", label: "Japanese" },
  { id: "american", label: "American" },
  { id: "thai", label: "Thai" },
  { id: "indian", label: "Indian" },
  { id: "mediterranean", label: "Mediterranean" },
  { id: "chinese", label: "Chinese" },
  { id: "korean", label: "Korean" },
  { id: "vegan", label: "Vegan" },
];

const ACTIVITY_PREFERENCES = [
  { id: "concerts", label: "Concerts" },
  { id: "sports", label: "Sports" },
  { id: "museums", label: "Museums" },
  { id: "outdoors", label: "Outdoors" },
  { id: "theater", label: "Theater" },
  { id: "comedy", label: "Comedy" },
  { id: "festivals", label: "Festivals" },
  { id: "markets", label: "Markets" },
];

const NIGHTLIFE_PREFERENCES = [
  { id: "clubs", label: "Clubs" },
  { id: "bars", label: "Bars" },
  { id: "lounges", label: "Lounges" },
  { id: "liveMusic", label: "Live Music" },
  { id: "karaoke", label: "Karaoke" },
  { id: "rooftop", label: "Rooftop" },
];

const BUDGET_OPTIONS = [
  { id: "budget", label: "$", description: "Budget-friendly" },
  { id: "moderate", label: "$$", description: "Moderate" },
  { id: "upscale", label: "$$$", description: "Upscale" },
  { id: "luxury", label: "$$$$", description: "Luxury" },
];

// ─── Step Indicator ─────────────────────────────────────────────
function StepIndicator({
  currentStep,
  totalSteps,
}: {
  currentStep: number;
  totalSteps: number;
}) {
  return (
    <View style={styles.stepIndicator}>
      {Array.from({ length: totalSteps }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.stepDot,
            i <= currentStep ? styles.stepDotActive : styles.stepDotInactive,
          ]}
        />
      ))}
    </View>
  );
}

// ─── Chip Selector ──────────────────────────────────────────────
function ChipSelector({
  items,
  selected,
  onToggle,
}: {
  items: { id: string; label: string }[];
  selected: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <View style={styles.chipGrid}>
      {items.map((item) => {
        const isSelected = selected.includes(item.id);
        return (
          <TouchableOpacity
            key={item.id}
            style={[styles.chip, isSelected && styles.chipSelected]}
            onPress={() => onToggle(item.id)}
            activeOpacity={0.7}
          >
            <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function SignupScreen() {
  const router = useRouter();

  const [step, setStep] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Account fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Preferences
  const [foodPrefs, setFoodPrefs] = useState<string[]>([]);
  const [activityPrefs, setActivityPrefs] = useState<string[]>([]);
  const [nightlifePrefs, setNightlifePrefs] = useState<string[]>([]);
  const [budgetPref, setBudgetPref] = useState<string>("");

  const totalSteps = 5;

  const animateTransition = (nextStep: number) => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start();
    setTimeout(() => setStep(nextStep), 150);
  };

  const togglePreference = (
    list: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>,
    id: string
  ) => {
    setList(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  };

  const handleNext = () => {
    if (step < totalSteps - 1) animateTransition(step + 1);
  };

  const handleBack = () => {
    if (step > 0) animateTransition(step - 1);
  };

  const handleComplete = () => {
    // TODO: send to backend / persist prefs
    console.log("Signup complete!", {
      firstName,
      lastName,
      email,
      foodPrefs,
      activityPrefs,
      nightlifePrefs,
      budgetPref,
    });

    // Route into your tabs (Home/Explore)
    router.replace("/(tabs)");
  };

  // Step 0
  const renderWelcome = () => (
    <View style={styles.centeredContent}>
      <View style={styles.logoCircle}>
        <Text style={styles.logoText}>N</Text>
      </View>

      <Text style={styles.brandTitle}>NaviGator</Text>
      <Text style={styles.brandSubtitle}>Plan your perfect day</Text>

      <Text style={styles.welcomeDescription}>
        Discover events, restaurants, and nightlife near you. We'll build a personalized plan based
        on what you love.
      </Text>

      <TouchableOpacity style={styles.primaryButton} onPress={handleNext} activeOpacity={0.8}>
        <Text style={styles.primaryButtonText}>Get Started</Text>
      </TouchableOpacity>

      {/* You can later route to a sign-in screen */}
      <TouchableOpacity style={styles.textButton} activeOpacity={0.6}>
        <Text style={styles.textButtonLabel}>
          Already have an account? <Text style={styles.textButtonAccent}>Sign In</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );

  // Step 1
  const renderAccount = () => (
    <ScrollView
      style={styles.scrollContent}
      contentContainerStyle={styles.scrollInner}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.stepTitle}>Create your account</Text>
      <Text style={styles.stepDescription}>
        Let's start with the basics so we can personalize your experience.
      </Text>

      <View style={styles.inputRow}>
        <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
          <Text style={styles.inputLabel}>First Name</Text>
          <TextInput
            style={styles.input}
            value={firstName}
            onChangeText={setFirstName}
            placeholder="Jane"
            placeholderTextColor={COLORS.muted}
            autoCapitalize="words"
          />
        </View>
        <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
          <Text style={styles.inputLabel}>Last Name</Text>
          <TextInput
            style={styles.input}
            value={lastName}
            onChangeText={setLastName}
            placeholder="Doe"
            placeholderTextColor={COLORS.muted}
            autoCapitalize="words"
          />
        </View>
      </View>

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
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Password</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="At least 8 characters"
          placeholderTextColor={COLORS.muted}
          secureTextEntry
        />
      </View>

      <Text style={styles.termsText}>
        By continuing, you agree to our <Text style={styles.linkText}>Terms</Text> and{" "}
        <Text style={styles.linkText}>Privacy</Text>.
      </Text>
    </ScrollView>
  );

  // Step 2
  const renderFoodPrefs = () => (
    <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollInner}>
      <Text style={styles.stepTitle}>What do you like to eat?</Text>
      <Text style={styles.stepDescription}>
        Select your favorite cuisines so we can recommend the best restaurants.
      </Text>
      <ChipSelector
        items={FOOD_PREFERENCES}
        selected={foodPrefs}
        onToggle={(id) => togglePreference(foodPrefs, setFoodPrefs, id)}
      />

      <View style={styles.divider} />

      <Text style={styles.stepTitle}>What activities excite you?</Text>
      <Text style={styles.stepDescription}>Pick the activities you'd enjoy during your day out.</Text>
      <ChipSelector
        items={ACTIVITY_PREFERENCES}
        selected={activityPrefs}
        onToggle={(id) => togglePreference(activityPrefs, setActivityPrefs, id)}
      />
    </ScrollView>
  );

  // Step 3
  const renderNightlifePrefs = () => (
    <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollInner}>
      <Text style={styles.stepTitle}>How about nightlife?</Text>
      <Text style={styles.stepDescription}>Pick your vibe for after dark.</Text>
      <ChipSelector
        items={NIGHTLIFE_PREFERENCES}
        selected={nightlifePrefs}
        onToggle={(id) => togglePreference(nightlifePrefs, setNightlifePrefs, id)}
      />

      <View style={styles.divider} />

      <Text style={styles.stepTitle}>What's your typical budget?</Text>
      <Text style={styles.stepDescription}>This helps us match you with the right spots.</Text>

      <View style={styles.budgetGrid}>
        {BUDGET_OPTIONS.map((opt) => {
          const isSelected = budgetPref === opt.id;
          return (
            <TouchableOpacity
              key={opt.id}
              style={[styles.budgetCard, isSelected && styles.budgetCardSelected]}
              onPress={() => setBudgetPref(opt.id)}
              activeOpacity={0.7}
            >
              <Text style={[styles.budgetLabel, isSelected && styles.budgetLabelSelected]}>
                {opt.label}
              </Text>
              <Text
                style={[
                  styles.budgetDescription,
                  isSelected && styles.budgetDescriptionSelected,
                ]}
              >
                {opt.description}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );

  // Step 4
  const renderComplete = () => (
    <View style={styles.centeredContent}>
      <View style={styles.completeCircle}>
        <Text style={styles.completeCheck}>✓</Text>
      </View>
      <Text style={styles.stepTitle}>You're all set!</Text>
      <Text style={styles.completeDescription}>
        We'll use your preferences to curate personalized plans near you.
      </Text>
      <TouchableOpacity style={styles.primaryButton} onPress={handleComplete} activeOpacity={0.8}>
        <Text style={styles.primaryButtonText}>Start Exploring</Text>
      </TouchableOpacity>
    </View>
  );

  const renderStep = () => {
    switch (step) {
      case 0:
        return renderWelcome();
      case 1:
        return renderAccount();
      case 2:
        return renderFoodPrefs();
      case 3:
        return renderNightlifePrefs();
      case 4:
        return renderComplete();
      default:
        return null;
    }
  };

  const showHeaderFooter = step > 0 && step < 4;
  const accountInvalid = step === 1 && (!firstName || !email || !password);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {showHeaderFooter && (
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Text style={styles.backArrow}>{"<"}</Text>
          </TouchableOpacity>

          <StepIndicator currentStep={step - 1} totalSteps={3} />

          <TouchableOpacity onPress={handleNext} style={styles.skipButton}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        </View>
      )}

      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>{renderStep()}</Animated.View>

      {showHeaderFooter && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.primaryButton, accountInvalid && styles.buttonDisabled]}
            onPress={handleNext}
            activeOpacity={0.8}
            disabled={accountInvalid}
          >
            <Text style={styles.primaryButtonText}>Continue</Text>
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { flex: 1 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  backArrow: { fontSize: 18, color: COLORS.foreground, fontWeight: "600" },
  skipButton: { paddingHorizontal: 12, paddingVertical: 8 },
  skipText: { fontSize: 15, color: COLORS.muted, fontWeight: "600" },

  footer: {
    paddingHorizontal: 20,
    paddingBottom: 18,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.background,
  },

  centeredContent: {
    flex: 1,
    alignItems: "center",
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
    marginBottom: 14,
  },
  logoText: { color: "#fff", fontSize: 28, fontWeight: "800" },
  brandTitle: { fontSize: 28, fontWeight: "800", color: COLORS.foreground },
  brandSubtitle: { fontSize: 14, fontWeight: "600", color: COLORS.muted, marginTop: 6 },

  welcomeDescription: {
    textAlign: "center",
    color: COLORS.muted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 14,
    marginBottom: 18,
  },

  scrollContent: { flex: 1 },
  scrollInner: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 24 },

  stepTitle: { fontSize: 22, fontWeight: "800", color: COLORS.foreground, marginBottom: 8 },
  stepDescription: { fontSize: 14, color: COLORS.muted, lineHeight: 20, marginBottom: 14 },

  inputRow: { flexDirection: "row" },
  inputGroup: { marginBottom: 14 },
  inputLabel: { fontSize: 13, fontWeight: "700", color: COLORS.foreground, marginBottom: 6 },
  input: {
    backgroundColor: COLORS.inputBg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: COLORS.foreground,
  },

  termsText: { marginTop: 8, fontSize: 12, color: COLORS.muted, lineHeight: 18 },
  linkText: { color: COLORS.primary, fontWeight: "700" },

  primaryButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 14,
    alignItems: "center",
    width: "100%",
  },
  primaryButtonText: { color: "#fff", fontWeight: "800", fontSize: 16 },
  buttonDisabled: { opacity: 0.5 },

  textButton: { marginTop: 14 },
  textButtonLabel: { color: COLORS.muted, fontWeight: "600" },
  textButtonAccent: { color: COLORS.primary, fontWeight: "800" },

  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 18 },

  chipGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  chipSelected: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { color: COLORS.foreground, fontWeight: "700", fontSize: 13 },
  chipTextSelected: { color: "#fff" },

  budgetGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  budgetCard: {
    width: "47%",
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    padding: 14,
  },
  budgetCardSelected: { borderColor: COLORS.primary, backgroundColor: "#EAF7EF" },
  budgetLabel: { fontSize: 18, fontWeight: "900", color: COLORS.foreground },
  budgetLabelSelected: { color: COLORS.primary },
  budgetDescription: { marginTop: 6, color: COLORS.muted, fontWeight: "600" },
  budgetDescriptionSelected: { color: COLORS.foreground },

  stepIndicator: { flexDirection: "row", gap: 8, alignItems: "center" },
  stepDot: { width: 10, height: 10, borderRadius: 999 },
  stepDotActive: { backgroundColor: COLORS.primary },
  stepDotInactive: { backgroundColor: COLORS.border },

  completeCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#EAF7EF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  completeCheck: { fontSize: 30, fontWeight: "900", color: COLORS.primary },
  completeDescription: { textAlign: "center", color: COLORS.muted, marginTop: 8, marginBottom: 18 },
});
