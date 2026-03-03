import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  Animated,
  StatusBar,
  FlatList,
} from "react-native";

const { width } = Dimensions.get("window");

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
};

// ─── Category Filters ───────────────────────────────────────────
const CATEGORIES = [
  { id: "all", label: "For You" },
  { id: "events", label: "Events" },
  { id: "food", label: "Restaurants" },
  { id: "nightlife", label: "Nightlife" },
  { id: "outdoors", label: "Outdoors" },
];

// ─── Mock Data ──────────────────────────────────────────────────
const FEATURED_PLANS = [
  {
    id: "1",
    title: "Saturday Night Out",
    subtitle: "Dinner, comedy show, and cocktails",
    time: "6:00 PM - 12:00 AM",
    spots: 3,
    color: "#1A8C51",
  },
  {
    id: "2",
    title: "Foodie Adventure",
    subtitle: "3 cuisines, 1 amazing day",
    time: "11:00 AM - 8:00 PM",
    spots: 4,
    color: "#FF9F00",
  },
  {
    id: "3",
    title: "Culture Crawl",
    subtitle: "Museums, galleries, and live music",
    time: "10:00 AM - 9:00 PM",
    spots: 5,
    color: "#2D6BC4",
  },
];

const NEARBY_EVENTS = [
  {
    id: "e1",
    name: "Jazz at the Park",
    venue: "Central Park Bandshell",
    distance: "0.4 mi",
    time: "Today, 7 PM",
    category: "events",
    rating: 4.8,
    price: "Free",
    imageColor: "#2D6BC4",
  },
  {
    id: "e2",
    name: "Taco Festival",
    venue: "Riverside Plaza",
    distance: "1.2 mi",
    time: "Tomorrow, 11 AM",
    category: "food",
    rating: 4.6,
    price: "$15",
    imageColor: "#FF9F00",
  },
  {
    id: "e3",
    name: "Rooftop Lounge Night",
    venue: "Skyline Terrace",
    distance: "0.8 mi",
    time: "Fri, 9 PM",
    category: "nightlife",
    rating: 4.9,
    price: "$25",
    imageColor: "#9B59B6",
  },
  {
    id: "e4",
    name: "Sunrise Yoga",
    venue: "Lake Shore Trail",
    distance: "2.1 mi",
    time: "Sat, 6:30 AM",
    category: "outdoors",
    rating: 4.7,
    price: "$10",
    imageColor: "#1A8C51",
  },
];

const RESTAURANT_PICKS = [
  {
    id: "r1",
    name: "Sakura Sushi Bar",
    cuisine: "Japanese",
    rating: 4.8,
    priceLevel: "$$$",
    distance: "0.3 mi",
    openNow: true,
    imageColor: "#E74C3C",
  },
  {
    id: "r2",
    name: "Bella Trattoria",
    cuisine: "Italian",
    rating: 4.6,
    priceLevel: "$$",
    distance: "0.7 mi",
    openNow: true,
    imageColor: "#27AE60",
  },
  {
    id: "r3",
    name: "Spice Route",
    cuisine: "Indian",
    rating: 4.5,
    priceLevel: "$$",
    distance: "1.0 mi",
    openNow: false,
    imageColor: "#F39C12",
  },
];

// ─── Featured Plan Card ────────────────────────────────────────
function FeaturedPlanCard({ plan }: { plan: (typeof FEATURED_PLANS)[number] }) {
  return (
    <TouchableOpacity
      style={[styles.featuredCard, { backgroundColor: plan.color }]}
      activeOpacity={0.85}
    >
      <View style={styles.featuredBadge}>
        <Text style={styles.featuredBadgeText}>AI Plan</Text>
      </View>
      <View style={styles.featuredContent}>
        <Text style={styles.featuredTitle}>{plan.title}</Text>
        <Text style={styles.featuredSubtitle}>{plan.subtitle}</Text>
        <View style={styles.featuredMeta}>
          <View style={styles.featuredMetaItem}>
            <Text style={styles.featuredMetaIcon}>C</Text>
            <Text style={styles.featuredMetaText}>{plan.time}</Text>
          </View>
          <View style={styles.featuredMetaItem}>
            <Text style={styles.featuredMetaIcon}>P</Text>
            <Text style={styles.featuredMetaText}>{plan.spots} stops</Text>
          </View>
        </View>
      </View>
      <TouchableOpacity style={styles.featuredAction} activeOpacity={0.7}>
        <Text style={styles.featuredActionText}>View Plan</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

// ─── Event Card ─────────────────────────────────────────────────
function EventCard({ event }: { event: (typeof NEARBY_EVENTS)[number] }) {
  return (
    <TouchableOpacity style={styles.eventCard} activeOpacity={0.8}>
      <View style={[styles.eventImage, { backgroundColor: event.imageColor }]}>
        <Text style={styles.eventImageText}>{event.name.charAt(0)}</Text>
      </View>
      <View style={styles.eventInfo}>
        <View style={styles.eventHeader}>
          <Text style={styles.eventName} numberOfLines={1}>
            {event.name}
          </Text>
          <View style={styles.ratingBadge}>
            <Text style={styles.ratingText}>{event.rating}</Text>
          </View>
        </View>
        <Text style={styles.eventVenue} numberOfLines={1}>
          {event.venue}
        </Text>
        <View style={styles.eventMeta}>
          <Text style={styles.eventTime}>{event.time}</Text>
          <Text style={styles.eventDot}>-</Text>
          <Text style={styles.eventDistance}>{event.distance}</Text>
          <Text style={styles.eventDot}>-</Text>
          <Text style={styles.eventPrice}>{event.price}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Restaurant Card ────────────────────────────────────────────
function RestaurantCard({
  restaurant,
}: {
  restaurant: (typeof RESTAURANT_PICKS)[number];
}) {
  return (
    <TouchableOpacity style={styles.restaurantCard} activeOpacity={0.8}>
      <View
        style={[styles.restaurantImage, { backgroundColor: restaurant.imageColor }]}
      >
        <Text style={styles.restaurantImageText}>{restaurant.name.charAt(0)}</Text>
      </View>
      <Text style={styles.restaurantName} numberOfLines={1}>
        {restaurant.name}
      </Text>
      <Text style={styles.restaurantCuisine}>{restaurant.cuisine}</Text>
      <View style={styles.restaurantMeta}>
        <Text style={styles.restaurantRating}>{restaurant.rating}</Text>
        <Text style={styles.restaurantPrice}>{restaurant.priceLevel}</Text>
      </View>
      <View style={styles.restaurantStatus}>
        <View
          style={[
            styles.statusDot,
            { backgroundColor: restaurant.openNow ? COLORS.primary : "#E74C3C" },
          ]}
        />
        <Text style={styles.statusText}>{restaurant.openNow ? "Open Now" : "Closed"}</Text>
      </View>
    </TouchableOpacity>
  );
}

// ─── Main Home Component ────────────────────────────────────────
export default function HomeScreen() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const scrollX = useRef(new Animated.Value(0)).current;

  const filteredEvents =
    activeCategory === "all"
      ? NEARBY_EVENTS
      : NEARBY_EVENTS.filter((e) => e.category === activeCategory);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good evening,</Text>
            <Text style={styles.userName}>Jane</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.notificationBtn} activeOpacity={0.7}>
              <Text style={styles.notificationIcon}>B</Text>
              <View style={styles.notificationDot} />
            </TouchableOpacity>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>J</Text>
            </View>
          </View>
        </View>

        {/* Location Bar */}
        <TouchableOpacity style={styles.locationBar} activeOpacity={0.7}>
          <Text style={styles.locationIcon}>L</Text>
          <Text style={styles.locationText}>Downtown, Gainesville</Text>
          <Text style={styles.locationChevron}>{">"}</Text>
        </TouchableOpacity>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchIcon}>
            <Text style={styles.searchIconText}>S</Text>
          </View>
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search events, restaurants, clubs..."
            placeholderTextColor={COLORS.muted}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Text style={styles.clearText}>X</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Category Filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.categoryChip, isActive && styles.categoryChipActive]}
                onPress={() => setActiveCategory(cat.id)}
                activeOpacity={0.7}
              >
                <Text style={[styles.categoryText, isActive && styles.categoryTextActive]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* AI-Curated Plans */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>AI-Curated Plans</Text>
            <TouchableOpacity activeOpacity={0.6}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={FEATURED_PLANS}
            horizontal
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => <FeaturedPlanCard plan={item} />}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.featuredScroll}
            snapToInterval={width * 0.78 + 16}
            decelerationRate="fast"
          />
        </View>

        {/* Nearby Events */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Nearby Events</Text>
            <TouchableOpacity activeOpacity={0.6}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          {filteredEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </View>

        {/* Restaurant Picks */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Restaurant Picks</Text>
            <TouchableOpacity activeOpacity={0.6}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.restaurantScroll}
          >
            {RESTAURANT_PICKS.map((restaurant) => (
              <RestaurantCard key={restaurant.id} restaurant={restaurant} />
            ))}
          </ScrollView>
        </View>

        {/* Quick Plan CTA */}
        <TouchableOpacity style={styles.quickPlanCta} activeOpacity={0.85}>
          <View style={styles.ctaContent}>
            <Text style={styles.ctaTitle}>Plan My Day</Text>
            <Text style={styles.ctaDescription}>
              Let NaviGator build a full itinerary based on your preferences and what's happening
              nearby.
            </Text>
          </View>
          <View style={styles.ctaArrow}>
            <Text style={styles.ctaArrowText}>{">"}</Text>
          </View>
        </TouchableOpacity>

        <View style={{ height: 28 }} />
      </ScrollView>
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollView: { flex: 1 },
  scrollContent: { paddingTop: 56 },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  greeting: { fontSize: 15, color: COLORS.muted, fontWeight: "500" },
  userName: { fontSize: 28, fontWeight: "800", color: COLORS.foreground, letterSpacing: -0.5 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 12 },
  notificationBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  notificationIcon: { fontWeight: "800", color: COLORS.foreground },
  notificationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.secondary,
    position: "absolute",
    top: 10,
    right: 10,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontWeight: "900" },

  // Location
  locationBar: {
    marginHorizontal: 24,
    marginBottom: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  locationIcon: { fontWeight: "900", color: COLORS.primary },
  locationText: { flex: 1, color: COLORS.foreground, fontWeight: "700" },
  locationChevron: { color: COLORS.muted, fontWeight: "900" },

  // Search
  searchContainer: {
    marginHorizontal: 24,
    marginBottom: 10,
    backgroundColor: COLORS.inputBg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  searchIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchIconText: { fontWeight: "900", color: COLORS.muted },
  searchInput: { flex: 1, color: COLORS.foreground, fontWeight: "600" },
  clearText: { fontWeight: "900", color: COLORS.muted, paddingHorizontal: 6 },

  // Categories
  categoryScroll: { paddingHorizontal: 24, paddingVertical: 8, gap: 10 },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  categoryChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  categoryText: { fontWeight: "700", color: COLORS.foreground },
  categoryTextActive: { color: "#fff" },

  // Sections
  section: { marginTop: 16, paddingHorizontal: 24 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sectionTitle: { fontSize: 18, fontWeight: "900", color: COLORS.foreground },
  seeAll: { color: COLORS.primary, fontWeight: "800" },

  // Featured Plans
  featuredScroll: { paddingVertical: 14, paddingRight: 24 },
  featuredCard: {
    width: width * 0.78,
    borderRadius: 18,
    padding: 16,
    marginRight: 16,
    overflow: "hidden",
  },
  featuredBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.25)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    marginBottom: 10,
  },
  featuredBadgeText: { color: "#fff", fontWeight: "900" },
  featuredContent: { gap: 6 },
  featuredTitle: { color: "#fff", fontSize: 18, fontWeight: "900" },
  featuredSubtitle: { color: "rgba(255,255,255,0.9)", fontWeight: "700" },
  featuredMeta: { marginTop: 8, gap: 8 },
  featuredMetaItem: { flexDirection: "row", alignItems: "center", gap: 8 },
  featuredMetaIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.25)",
    textAlign: "center",
    lineHeight: 20,
    color: "#fff",
    fontWeight: "900",
  },
  featuredMetaText: { color: "rgba(255,255,255,0.95)", fontWeight: "700" },
  featuredAction: {
    marginTop: 12,
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.25)",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  featuredActionText: { color: "#fff", fontWeight: "900" },

  // Events
  eventCard: {
    flexDirection: "row",
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 12,
    marginTop: 12,
    gap: 12,
  },
  eventImage: { width: 56, height: 56, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  eventImageText: { color: "#fff", fontWeight: "900", fontSize: 18 },
  eventInfo: { flex: 1, gap: 4 },
  eventHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  eventName: { flex: 1, fontWeight: "900", color: COLORS.foreground },
  ratingBadge: { backgroundColor: COLORS.inputBg, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  ratingText: { fontWeight: "900", color: COLORS.foreground },
  eventVenue: { color: COLORS.muted, fontWeight: "700" },
  eventMeta: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  eventTime: { color: COLORS.foreground, fontWeight: "700" },
  eventDot: { color: COLORS.muted, fontWeight: "900" },
  eventDistance: { color: COLORS.muted, fontWeight: "800" },
  eventPrice: { color: COLORS.primary, fontWeight: "900" },

  // Restaurants
  restaurantScroll: { paddingVertical: 14, paddingRight: 24, gap: 12 },
  restaurantCard: {
    width: 160,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 12,
    marginRight: 12,
  },
  restaurantImage: { height: 84, borderRadius: 14, alignItems: "center", justifyContent: "center", marginBottom: 10 },
  restaurantImageText: { color: "#fff", fontWeight: "900", fontSize: 18 },
  restaurantName: { fontWeight: "900", color: COLORS.foreground },
  restaurantCuisine: { color: COLORS.muted, fontWeight: "700", marginTop: 2 },
  restaurantMeta: { flexDirection: "row", justifyContent: "space-between", marginTop: 8 },
  restaurantRating: { fontWeight: "900", color: COLORS.foreground },
  restaurantPrice: { fontWeight: "900", color: COLORS.primary },
  restaurantStatus: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 10 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { color: COLORS.muted, fontWeight: "800" },

  // CTA
  quickPlanCta: {
    marginTop: 18,
    marginHorizontal: 24,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 18,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  ctaContent: { flex: 1, gap: 6 },
  ctaTitle: { fontSize: 16, fontWeight: "900", color: COLORS.foreground },
  ctaDescription: { color: COLORS.muted, fontWeight: "700", lineHeight: 18 },
  ctaArrow: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.inputBg,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  ctaArrowText: { fontWeight: "900", color: COLORS.foreground },
});
