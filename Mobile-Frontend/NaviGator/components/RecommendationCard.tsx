import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";

export type Recommendation = {
  id: string;
  title: string;
  subtitle?: string;
  category?: string;
  distanceMiles?: number;
  durationMins?: number;
  rating?: number;
};

type Props = {
  item: Recommendation;
  onPress?: (id: string) => void;
};

export function RecommendationCard({ item, onPress }: Props) {
  return (
    <Pressable
      onPress={() => onPress?.(item.id)}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      {/* “Image placeholder” area */}
      <View style={styles.media} />

      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text style={styles.title} numberOfLines={1}>
            {item.title}
          </Text>

          {typeof item.rating === "number" && (
            <View style={styles.ratingPill}>
              <Text style={styles.ratingText}>★ {item.rating.toFixed(1)}</Text>
            </View>
          )}
        </View>

        {item.subtitle ? (
          <Text style={styles.subtitle} numberOfLines={2}>
            {item.subtitle}
          </Text>
        ) : null}

        <View style={styles.metaRow}>
          {item.category ? <Text style={styles.meta}>{item.category}</Text> : null}

          {typeof item.durationMins === "number" ? (
            <Text style={styles.meta}>• {item.durationMins} min</Text>
          ) : null}

          {typeof item.distanceMiles === "number" ? (
            <Text style={styles.meta}>• {item.distanceMiles.toFixed(1)} mi</Text>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    backgroundColor: "#fff",
    overflow: "hidden",
    marginBottom: 14,

    // subtle shadow (cross-platform-ish)
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  pressed: {
    transform: [{ scale: 0.99 }],
    opacity: 0.95,
  },
  media: {
    height: 130,
    backgroundColor: "#E9EEF5",
  },
  content: {
    padding: 14,
    gap: 6,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    color: "#0B1220",
  },
  subtitle: {
    fontSize: 13,
    color: "#4B5563",
    lineHeight: 18,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  meta: {
    fontSize: 12,
    color: "#6B7280",
  },
  ratingPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#F3F4F6",
  },
  ratingText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#111827",
  },
});
