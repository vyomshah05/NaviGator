import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  Keyboard,
} from "react-native";
import * as Location from "expo-location";
import { auth } from "../../firebaseConfig";
import { apiService, Recommendation } from "../../services/api";

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
  { id: "food", label: "Restaurants" },
  { id: "nightlife", label: "Nightlife" },
  { id: "outdoors", label: "Outdoors" },
  { id: "arts", label: "Arts" },
];

// ─── City Dictionary ────────────────────────────────────────────
const CITY_COORDS: Record<string, { lat: number; lon: number; label: string }> = {
  "gainesville":        { lat: 29.6516,  lon: -82.3248,  label: "Gainesville, FL" },
  "gainesville, fl":    { lat: 29.6516,  lon: -82.3248,  label: "Gainesville, FL" },
  "san francisco":      { lat: 37.7749,  lon: -122.4194, label: "San Francisco, CA" },
  "san francisco, ca":  { lat: 37.7749,  lon: -122.4194, label: "San Francisco, CA" },
  "irvine":             { lat: 33.6846,  lon: -117.8265, label: "Irvine, CA" },
  "irvine, ca":         { lat: 33.6846,  lon: -117.8265, label: "Irvine, CA" },
  "los angeles":        { lat: 34.0522,  lon: -118.2437, label: "Los Angeles, CA" },
  "los angeles, ca":    { lat: 34.0522,  lon: -118.2437, label: "Los Angeles, CA" },
  "la":                 { lat: 34.0522,  lon: -118.2437, label: "Los Angeles, CA" },
  "new york":           { lat: 40.7128,  lon: -74.0060,  label: "New York, NY" },
  "new york, ny":       { lat: 40.7128,  lon: -74.0060,  label: "New York, NY" },
  "nyc":                { lat: 40.7128,  lon: -74.0060,  label: "New York, NY" },
  "miami":              { lat: 25.7617,  lon: -80.1918,  label: "Miami, FL" },
  "miami, fl":          { lat: 25.7617,  lon: -80.1918,  label: "Miami, FL" },
  "chicago":            { lat: 41.8781,  lon: -87.6298,  label: "Chicago, IL" },
  "chicago, il":        { lat: 41.8781,  lon: -87.6298,  label: "Chicago, IL" },
  "austin":             { lat: 30.2672,  lon: -97.7431,  label: "Austin, TX" },
  "austin, tx":         { lat: 30.2672,  lon: -97.7431,  label: "Austin, TX" },
  "seattle":            { lat: 47.6062,  lon: -122.3321, label: "Seattle, WA" },
  "seattle, wa":        { lat: 47.6062,  lon: -122.3321, label: "Seattle, WA" },
  "orlando":            { lat: 28.5383,  lon: -81.3792,  label: "Orlando, FL" },
  "orlando, fl":        { lat: 28.5383,  lon: -81.3792,  label: "Orlando, FL" },
  "tampa":              { lat: 27.9506,  lon: -82.4572,  label: "Tampa, FL" },
  "tampa, fl":          { lat: 27.9506,  lon: -82.4572,  label: "Tampa, FL" },
  "san diego":          { lat: 32.7157,  lon: -117.1611, label: "San Diego, CA" },
  "san diego, ca":      { lat: 32.7157,  lon: -117.1611, label: "San Diego, CA" },
  "denver":             { lat: 39.7392,  lon: -104.9903, label: "Denver, CO" },
  "denver, co":         { lat: 39.7392,  lon: -104.9903, label: "Denver, CO" },
  "boston":             { lat: 42.3601,  lon: -71.0589,  label: "Boston, MA" },
  "boston, ma":         { lat: 42.3601,  lon: -71.0589,  label: "Boston, MA" },
  "nashville":          { lat: 36.1627,  lon: -86.7816,  label: "Nashville, TN" },
  "nashville, tn":      { lat: 36.1627,  lon: -86.7816,  label: "Nashville, TN" },
  "atlanta":            { lat: 33.7490,  lon: -84.3880,  label: "Atlanta, GA" },
  "atlanta, ga":        { lat: 33.7490,  lon: -84.3880,  label: "Atlanta, GA" },
  "portland":           { lat: 45.5051,  lon: -122.6750, label: "Portland, OR" },
  "portland, or":       { lat: 45.5051,  lon: -122.6750, label: "Portland, OR" },
  "houston":            { lat: 29.7604,  lon: -95.3698,  label: "Houston, TX" },
  "houston, tx":        { lat: 29.7604,  lon: -95.3698,  label: "Houston, TX" },
  "phoenix":            { lat: 33.4484,  lon: -112.0740, label: "Phoenix, AZ" },
  "phoenix, az":        { lat: 33.4484,  lon: -112.0740, label: "Phoenix, AZ" },
};

function lookupCity(query: string): { lat: number; lon: number; label: string } | null {
  return CITY_COORDS[query.trim().toLowerCase()] ?? null;
}

// ─── Helpers ────────────────────────────────────────────────────
function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning,";
  if (hour < 17) return "Good afternoon,";
  return "Good evening,";
}

function metersToMiles(meters: number): string {
  return (meters / 1609.34).toFixed(1) + " mi";
}

// Map Foursquare category name to a UI category id
function mapToUiCategory(categoryName: string): string {
  const lower = categoryName.toLowerCase();
  if (lower.includes("restaurant") || lower.includes("food") || lower.includes("cafe") || lower.includes("coffee") || lower.includes("bakery") || lower.includes("pizza") || lower.includes("sushi") || lower.includes("taco") || lower.includes("burger")) return "food";
  if (lower.includes("bar") || lower.includes("club") || lower.includes("lounge") || lower.includes("nightlife") || lower.includes("cocktail") || lower.includes("brewery") || lower.includes("karaoke")) return "nightlife";
  if (lower.includes("park") || lower.includes("trail") || lower.includes("outdoor") || lower.includes("garden") || lower.includes("nature") || lower.includes("beach") || lower.includes("lake") || lower.includes("yoga")) return "outdoors";
  if (lower.includes("museum") || lower.includes("gallery") || lower.includes("theater") || lower.includes("theatre") || lower.includes("art") || lower.includes("concert") || lower.includes("music")) return "arts";
  return "all";
}

// Pick a color based on category
function categoryColor(categoryName: string): string {
  const cat = mapToUiCategory(categoryName);
  switch (cat) {
    case "food": return "#FF9F00";
    case "nightlife": return "#9B59B6";
    case "outdoors": return "#1A8C51";
    case "arts": return "#2D6BC4";
    default: return "#E74C3C";
  }
}

// ─── Event Card ─────────────────────────────────────────────────
interface EventItem {
  id: string;
  name: string;
  venue: string;
  distance: string;
  category: string;
  rating: string;
  explanation: string;
  imageColor: string;
}

function EventCard({ event }: { event: EventItem }) {
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
          {event.rating !== "N/A" && (
            <View style={styles.ratingBadge}>
              <Text style={styles.ratingText}>{event.rating}</Text>
            </View>
          )}
        </View>
        <Text style={styles.eventVenue} numberOfLines={1}>
          {event.venue}
        </Text>
        <View style={styles.eventMeta}>
          <Text style={styles.eventDistance}>{event.distance}</Text>
          {event.explanation ? (
            <>
              <Text style={styles.eventDot}>·</Text>
              <Text style={styles.eventExplanation} numberOfLines={1}>{event.explanation}</Text>
            </>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Restaurant Card ────────────────────────────────────────────
function RestaurantCard({ item }: { item: EventItem }) {
  return (
    <TouchableOpacity style={styles.restaurantCard} activeOpacity={0.8}>
      <View style={[styles.restaurantImage, { backgroundColor: item.imageColor }]}>
        <Text style={styles.restaurantImageText}>{item.name.charAt(0)}</Text>
      </View>
      <Text style={styles.restaurantName} numberOfLines={1}>
        {item.name}
      </Text>
      <Text style={styles.restaurantCuisine} numberOfLines={1}>{item.venue}</Text>
      <View style={styles.restaurantMeta}>
        <Text style={styles.restaurantRating}>{item.rating !== "N/A" ? item.rating : ""}</Text>
        <Text style={styles.restaurantPrice}>{item.distance}</Text>
      </View>
    </TouchableOpacity>
  );
}

// ─── Map Recommendation to EventItem ───────────────────────────
function toEventItem(rec: Recommendation): EventItem {
  const catName = rec.categories?.[0]?.name ?? "";
  const venueCity = rec.location?.locality ?? rec.location?.address ?? "";
  const ratingDisplay = rec.rating > 0 ? (rec.rating / 2).toFixed(1) : "N/A";
  return {
    id: rec.fsq_id,
    name: rec.name,
    venue: venueCity || catName,
    distance: metersToMiles(rec.distance),
    category: mapToUiCategory(catName),
    rating: ratingDisplay,
    explanation: rec.explanation ?? "",
    imageColor: categoryColor(catName),
  };
}

// ─── Main Home Component ────────────────────────────────────────
export default function HomeScreen() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [recommendations, setRecommendations] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [locationName, setLocationName] = useState("Getting location...");
  const [locationEditing, setLocationEditing] = useState(false);
  const [locationInput, setLocationInput] = useState("");
  const [userName, setUserName] = useState("there");

  const loadRecommendations = useCallback(async (lat: number, lon: number) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiService.getRecommendations(lat, lon, 20);
      const items: EventItem[] = (data.results ?? data.recommendations ?? []).map(toEventItem);
      setRecommendations(items);
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? err?.message ?? "Failed to load recommendations");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchData = useCallback(async () => {
    setError(null);
    try {
      const user = auth.currentUser;
      if (user?.displayName) {
        setUserName(user.displayName.split(" ")[0]);
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      let lat = 33.6846;
      let lon = -117.8265;

      if (status === "granted") {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        lat = loc.coords.latitude;
        lon = loc.coords.longitude;
        const [place] = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lon });
        if (place) {
          const parts = [place.district ?? place.subregion, place.city].filter(Boolean);
          setLocationName(parts.join(", ") || "Your Location");
        }
      } else {
        setLocationName("Irvine, CA");
      }

      await loadRecommendations(lat, lon);
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? err?.message ?? "Failed to load recommendations");
      setLoading(false);
    }
  }, [loadRecommendations]);

  const handleLocationSearch = useCallback(async () => {
    const query = locationInput.trim();
    if (!query) return;
    Keyboard.dismiss();
    setLocationEditing(false);
    setLocationInput("");

    // Check dictionary first
    const known = lookupCity(query);
    if (known) {
      setLocationName(known.label);
      await loadRecommendations(known.lat, known.lon);
      return;
    }

    // Fall back to geocoding for unknown locations
    setLocationName(query);
    setLoading(true);
    try {
      const results = await Location.geocodeAsync(query);
      if (results.length === 0) {
        setError(`Location "${query}" not found. Try a city name or address.`);
        setLoading(false);
        return;
      }
      const { latitude, longitude } = results[0];
      const [place] = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (place) {
        const parts = [place.city, place.region].filter(Boolean);
        setLocationName(parts.join(", ") || query);
      }
      await loadRecommendations(latitude, longitude);
    } catch (err: any) {
      setError(err?.message ?? "Failed to search location");
      setLoading(false);
    }
  }, [locationInput, loadRecommendations]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter by category and search
  const filtered = recommendations.filter((item) => {
    const matchesCategory = activeCategory === "all" || item.category === activeCategory;
    const matchesSearch =
      searchQuery.length === 0 ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.venue.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const restaurantItems = recommendations.filter((r) => r.category === "food");

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
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.userName}>{userName}</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.notificationBtn} activeOpacity={0.7} onPress={fetchData}>
              <Text style={styles.notificationIcon}>↻</Text>
            </TouchableOpacity>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{userName.charAt(0).toUpperCase()}</Text>
            </View>
          </View>
        </View>

        {/* Location Bar */}
        {locationEditing ? (
          <View style={[styles.locationBar, styles.locationBarEditing]}>
            <Text style={styles.locationIcon}>◎</Text>
            <TextInput
              style={styles.locationInput}
              value={locationInput}
              onChangeText={setLocationInput}
              placeholder="Enter city or address..."
              placeholderTextColor={COLORS.muted}
              autoFocus
              returnKeyType="search"
              onSubmitEditing={handleLocationSearch}
            />
            <TouchableOpacity onPress={handleLocationSearch} activeOpacity={0.7}>
              <Text style={styles.locationSearchBtn}>Go</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setLocationEditing(false); setLocationInput(""); }} activeOpacity={0.7}>
              <Text style={styles.locationCancelBtn}>✕</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.locationBar} activeOpacity={0.7} onPress={() => setLocationEditing(true)}>
            <Text style={styles.locationIcon}>◎</Text>
            <Text style={styles.locationText}>{locationName}</Text>
            <Text style={styles.locationChevron}>✎</Text>
          </TouchableOpacity>
        )}

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchIcon}>
            <Text style={styles.searchIconText}>⌕</Text>
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
              <Text style={styles.clearText}>✕</Text>
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

        {/* Loading / Error States */}
        {loading ? (
          <View style={styles.centerState}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.stateText}>Finding places near you...</Text>
          </View>
        ) : error ? (
          <View style={styles.centerState}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={fetchData} activeOpacity={0.8}>
              <Text style={styles.retryText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Nearby Recommendations */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                  {activeCategory === "all" ? "Recommended For You" : CATEGORIES.find(c => c.id === activeCategory)?.label}
                </Text>
                <Text style={styles.countText}>{filtered.length} places</Text>
              </View>
              {filtered.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>No places found for this filter.</Text>
                </View>
              ) : (
                filtered.map((item) => <EventCard key={item.id} event={item} />)
              )}
            </View>

            {/* Restaurant Picks */}
            {restaurantItems.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Restaurant Picks</Text>
                  <TouchableOpacity activeOpacity={0.6} onPress={() => setActiveCategory("food")}>
                    <Text style={styles.seeAll}>See All</Text>
                  </TouchableOpacity>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.restaurantScroll}
                >
                  {restaurantItems.slice(0, 6).map((item) => (
                    <RestaurantCard key={item.id} item={item} />
                  ))}
                </ScrollView>
              </View>
            )}
          </>
        )}

        {/* Quick Plan CTA */}
        {!loading && !error && (
          <TouchableOpacity style={styles.quickPlanCta} activeOpacity={0.85}>
            <View style={styles.ctaContent}>
              <Text style={styles.ctaTitle}>Plan My Day</Text>
              <Text style={styles.ctaDescription}>
                Let NaviGator build a full itinerary based on your preferences and what's nearby.
              </Text>
            </View>
            <View style={styles.ctaArrow}>
              <Text style={styles.ctaArrowText}>{">"}</Text>
            </View>
          </TouchableOpacity>
        )}

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
  notificationIcon: { fontWeight: "800", color: COLORS.foreground, fontSize: 18 },
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
  locationBarEditing: { borderColor: COLORS.primary },
  locationInput: { flex: 1, color: COLORS.foreground, fontWeight: "600" },
  locationSearchBtn: { color: COLORS.primary, fontWeight: "900", paddingHorizontal: 6 },
  locationCancelBtn: { color: COLORS.muted, fontWeight: "900", paddingHorizontal: 4 },

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
  countText: { color: COLORS.muted, fontWeight: "700", fontSize: 13 },

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
  eventMeta: { flexDirection: "row", flexWrap: "wrap", gap: 6, alignItems: "center" },
  eventDistance: { color: COLORS.muted, fontWeight: "800" },
  eventDot: { color: COLORS.muted },
  eventExplanation: { color: COLORS.primary, fontWeight: "700", flex: 1 },

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

  // Loading / Error
  centerState: { alignItems: "center", paddingVertical: 48, gap: 14 },
  stateText: { color: COLORS.muted, fontWeight: "700" },
  errorText: { color: "#E74C3C", fontWeight: "700", textAlign: "center", paddingHorizontal: 24 },
  retryBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryText: { color: "#fff", fontWeight: "900" },
  emptyState: { paddingVertical: 24, alignItems: "center" },
  emptyText: { color: COLORS.muted, fontWeight: "700" },

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
