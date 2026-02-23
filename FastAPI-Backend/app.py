from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
import requests
import requests.exceptions
import math
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="NaviGator API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Keys
GEOCODE_API_KEY     = os.getenv("GEOCODE_API_KEY")
FOURSQUARE_API_KEY  = os.getenv("FOURSQUARE_API_KEY")
OPENWEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY")

FOURSQUARE_BASE_URL = "https://places-api.foursquare.com"
FOURSQUARE_HEADERS = {
    "authorization":       f"Bearer {FOURSQUARE_API_KEY}",
    "X-Places-Api-Version": "2025-06-17",
    "accept":              "application/json",
}

# Maps user preference labels (collected during onboarding) to Foursquare
# top-level category IDs. Sub-categories are matched by ID prefix in scoring.
PREFERENCE_CATEGORIES: dict[str, str] = {
    "food":      "13000",  # Dining and Drinking
    "nightlife": "13003",  # Bars / Nightlife (sub of Dining)
    "arts":      "10000",  # Arts and Entertainment
    "outdoors":  "16000",  # Landmarks and Outdoors
    "sports":    "18000",  # Sports and Recreation
    "events":    "14000",  # Events
}

# Maps user preference labels to Foursquare icon category types.
# Icon URLs follow the pattern: categories_v2/{type}/{name}_.png
# This is more reliable than numeric IDs which differ between API versions.
PREF_TO_ICON_TYPES: dict[str, set[str]] = {
    "food":      {"food"},
    "nightlife": {"food", "nightlife"},
    "arts":      {"arts_entertainment"},
    "outdoors":  {"parks_outdoors"},
    "sports":    {"sports"},
    "events":    {"arts_entertainment", "parks_outdoors"},
}

# Maps OpenWeatherMap "main" condition to an outdoor suitability score (0–1).
WEATHER_OUTDOOR_SCORES: dict[str, float] = {
    "Clear":        1.0,
    "Clouds":       0.75,
    "Haze":         0.6,
    "Mist":         0.5,
    "Fog":          0.4,
    "Drizzle":      0.3,
    "Snow":         0.2,
    "Rain":         0.1,
    "Thunderstorm": 0.0,
}


#Validation constants
VALID_ACTIVITY_TYPES = set(PREFERENCE_CATEGORIES.keys())
MAX_DISTANCE_CAP     = 50_000   # 50 km — hard ceiling on search radius


#Helpers: Distance

def haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Returns straight-line distance in meters between two lat/lon points."""
    R = 6_371_000
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi    = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


#Helpers: Geocoding

def get_coordinates(city: str, state: str) -> tuple[float, float]:
    """Converts a city/state string to (lat, lon) using geocode.maps.co."""
    url = (
        f"https://geocode.maps.co/search"
        f"?city={city}&state={state}&api_key={GEOCODE_API_KEY}"
    )
    try:
        resp = requests.get(url, timeout=5)
        resp.raise_for_status()
        data = resp.json()
    except requests.exceptions.Timeout:
        raise HTTPException(status_code=504, detail="Geocoding service timed out.")
    except requests.exceptions.HTTPError as e:
        raise HTTPException(status_code=502, detail=f"Geocoding service returned error {e.response.status_code}.")
    except requests.exceptions.RequestException:
        raise HTTPException(status_code=502, detail="Could not reach geocoding service.")

    if not data:
        raise HTTPException(status_code=404, detail=f"Location not found: '{city}, {state}'.")
    try:
        return float(data[0]["lat"]), float(data[0]["lon"])
    except (KeyError, ValueError, IndexError):
        raise HTTPException(status_code=502, detail="Geocoding service returned an unexpected response.")


#Helpers: Weather

def get_weather(lat: float, lon: float) -> dict:
    """Fetches current weather from OpenWeatherMap for a given location."""
    url = (
        f"https://api.openweathermap.org/data/2.5/weather"
        f"?lat={lat}&lon={lon}&appid={OPENWEATHER_API_KEY}&units=imperial"
    )
    try:
        resp = requests.get(url, timeout=5)
        resp.raise_for_status()
        data = resp.json()
        return {
            "condition":   data["weather"][0]["main"],
            "description": data["weather"][0]["description"],
            "temp_f":      data["main"]["temp"],
            "humidity":    data["main"]["humidity"],
            "wind_mph":    data["wind"]["speed"],
        }
    except requests.exceptions.Timeout:
        raise HTTPException(status_code=504, detail="Weather service timed out.")
    except requests.exceptions.HTTPError as e:
        raise HTTPException(status_code=502, detail=f"Weather service returned error {e.response.status_code}.")
    except requests.exceptions.RequestException:
        raise HTTPException(status_code=502, detail="Could not reach weather service.")
    except (KeyError, IndexError):
        raise HTTPException(status_code=502, detail="Weather service returned an unexpected response.")


#Helpers: Foursquare

def search_places(
    lat: float,
    lon: float,
    category_ids: list[str],
    radius: int = 5000,
    limit: int = 10,
) -> list[dict]:
    """
    Searches Foursquare for places near a coordinate point.
    Returns a list of place objects with core fields.
    """
    params = {
        "ll":         f"{lat},{lon}",
        "radius":     radius,
        "categories": ",".join(category_ids),
        "limit":      limit,
    }
    try:
        resp = requests.get(
            f"{FOURSQUARE_BASE_URL}/places/search",
            headers=FOURSQUARE_HEADERS,
            params=params,
            timeout=8,
        )
        resp.raise_for_status()
        return resp.json().get("results", [])
    except requests.exceptions.Timeout:
        raise HTTPException(status_code=504, detail="Places service timed out.")
    except requests.exceptions.HTTPError as e:
        raise HTTPException(status_code=502, detail=f"Places service returned error {e.response.status_code}.")
    except requests.exceptions.RequestException:
        raise HTTPException(status_code=502, detail="Could not reach places service.")


def get_place_details(fsq_id: str) -> dict:
    """
    Fetches detailed information for a single Foursquare place by its ID.
    Includes description, hours, website, and phone if available.
    Note: photos require a paid Foursquare plan and are excluded here.
    """
    if not fsq_id or not fsq_id.strip():
        raise HTTPException(status_code=400, detail="Place ID cannot be empty.")

    fields = "fsq_id,name,categories,description,location,hours,rating,popularity,price,website,tel,geocodes"
    try:
        resp = requests.get(
            f"{FOURSQUARE_BASE_URL}/places/{fsq_id}",
            headers=FOURSQUARE_HEADERS,
            params={"fields": fields},
            timeout=8,
        )
        resp.raise_for_status()
        return resp.json()
    except requests.exceptions.Timeout:
        raise HTTPException(status_code=504, detail="Places service timed out.")
    except requests.exceptions.HTTPError as e:
        if e.response.status_code == 404:
            raise HTTPException(status_code=404, detail=f"Place '{fsq_id}' not found.")
        raise HTTPException(status_code=502, detail=f"Places service returned error {e.response.status_code}.")
    except requests.exceptions.RequestException:
        raise HTTPException(status_code=502, detail="Could not reach places service.")


#Ranking

def _icon_types(place: dict) -> set[str]:
    """
    Extracts category type strings from Foursquare icon URLs.
    e.g. "https://ss3.4sqi.net/img/categories_v2/food/ramen_.png" → {"food"}
    """
    types = set()
    for cat in place.get("categories", []):
        prefix = cat.get("icon", {}).get("prefix", "")
        if "categories_v2/" in prefix:
            cat_type = prefix.split("categories_v2/")[1].split("/")[0]
            types.add(cat_type)
    return types


def is_outdoor(place: dict) -> bool:
    """Returns True if any of the place's categories are outdoors or sports."""
    return bool(_icon_types(place) & {"parks_outdoors", "sports"})


def weather_score(weather: dict, outdoor: bool) -> float:
    """
    Returns a 0–1 score for how suitable the current weather is for this place.
    Indoor venues are always 1.0 — weather doesn't affect them.
    """
    if not outdoor:
        return 1.0
    condition = weather.get("condition", "Clear")
    return WEATHER_OUTDOOR_SCORES.get(condition, 0.7)


def category_match_score(place: dict, preferred_types: list[str]) -> float:
    """
    Returns 1.0 if the place matches any of the user's preferred activity types.
    Matching uses icon URL category types, which are stable across API versions.
    """
    if not preferred_types:
        return 0.5  # neutral when user has no preference set

    place_types = _icon_types(place)
    for pref in preferred_types:
        if place_types & PREF_TO_ICON_TYPES.get(pref, set()):
            return 1.0
    return 0.0


def is_valid_place(place: dict) -> bool:
    """
    Returns True if a place has the minimum fields needed for ranking.
    Filters out malformed entries before they can cause errors downstream.
    """
    return bool(place.get("name")) and place.get("distance") is not None


def clean_place(place: dict) -> dict:
    """
    Strips verbose/internal fields before returning results to the frontend.
    related_places in particular can be enormous (dozens of child venues).
    """
    drop = {"related_places", "placemaker_url", "extended_location",
            "date_created", "date_refreshed"}
    return {k: v for k, v in place.items() if k not in drop}


def score_place(
    place: dict,
    user_prefs: dict,
    weather: dict,
) -> float:
    """
    Computes a composite ranking score (0–1) for a single place.

    Weights are pulled from user_prefs["weights"] so that Firestore-stored
    personalization data can adjust them per user over time.
    Default weights are equal (0.25 each) until personalization kicks in.
    """
    weights = user_prefs.get("weights", {
        "distance":       0.25,
        "weather":        0.25,
        "rating":         0.25,
        "category_match": 0.25,
    })

    # Distance: closer = higher score
    max_dist   = user_prefs.get("max_distance", 5000)
    dist       = place.get("distance", max_dist)
    dist_score = max(0.0, 1.0 - dist / max_dist)

    # Weather suitability
    outdoor = is_outdoor(place)
    w_score = weather_score(weather, outdoor)

    # Rating: Foursquare uses 0–10, normalize to 0–1
    rating = place.get("rating", 5.0) / 10.0

    # Category match against user onboarding preferences.
    # For outdoor places, dampen the match by weather suitability so that
    # a strong outdoor preference doesn't override severe weather conditions.
    cat_score = category_match_score(place, user_prefs.get("activity_types", []))
    if outdoor:
        cat_score *= w_score

    return (
        weights["distance"]       * dist_score +
        weights["weather"]        * w_score    +
        weights["rating"]         * rating     +
        weights["category_match"] * cat_score
    )


def rank_places(
    places: list[dict],
    user_prefs: dict,
    weather: dict,
    top_k: int = 10,
) -> list[dict]:
    """
    Applies hard filters then scores and sorts places, returning the top-k.

    Hard filters (applied before scoring):
      - Places beyond max_distance are removed entirely.

    Soft scoring (applied to remaining candidates):
      - Composite score from distance, weather, rating, and category match.
    """
    max_dist = user_prefs.get("max_distance", 5000)

    # Stage 1: hard filter — remove invalid or out-of-range places
    filtered = [
        p for p in places
        if is_valid_place(p) and p.get("distance", 0) <= max_dist
    ]

    # Stage 2: score
    for place in filtered:
        place["_score"] = score_place(place, user_prefs, weather)

    # Stage 3: sort, clean, and return top-k
    ranked = sorted(filtered, key=lambda p: p["_score"], reverse=True)
    return [clean_place(p) for p in ranked[:top_k]]


def build_explanation(place: dict, weather: dict) -> str:
    """
    Generates a short human-readable explanation for why a place was recommended.
    Shown as a badge on each result card in the frontend.
    """
    parts = []
    dist = place.get("distance")
    if dist is not None:
        km = dist / 1000
        parts.append(f"{km:.1f} km away")

    rating = place.get("rating")
    if rating:
        parts.append(f"Rated {rating:.1f}/10")

    if is_outdoor(place):
        condition = weather.get("condition", "")
        if condition in ("Clear",):
            parts.append("Great weather for this")
        elif condition in ("Rain", "Thunderstorm", "Drizzle"):
            parts.append("Weather may affect visit")

    return " · ".join(parts) if parts else "Nearby recommendation"


#Endpoints

@app.get("/")
def root():
    return {"message": "NaviGator API is running"}


@app.get("/api/recommendations")
def get_recommendations(
    # Location — supply either lat+lon (from device GPS) or city+state (typed input)
    lat:            Optional[float]  = None,
    lon:            Optional[float]  = None,
    city:           Optional[str]    = None,
    state:          Optional[str]    = None,
    # User preferences — these will eventually come from Firestore via the frontend
    activity_types: list[str]        = Query(default=[]),
    max_distance:   int              = 5000,   # meters
    budget:         Optional[str]    = None,   # "low" | "moderate" | "high"
    top_k:          int              = 5,
    # Personalized weights from Firestore (optional — defaults used if not provided)
    w_distance:     float            = 0.25,
    w_weather:      float            = 0.25,
    w_rating:       float            = 0.25,
    w_category:     float            = 0.25,
):
    #Input validation
    if lat is not None and not (-90 <= lat <= 90):
        raise HTTPException(status_code=422, detail="lat must be between -90 and 90.")
    if lon is not None and not (-180 <= lon <= 180):
        raise HTTPException(status_code=422, detail="lon must be between -180 and 180.")
    if max_distance <= 0:
        raise HTTPException(status_code=422, detail="max_distance must be a positive number.")
    if max_distance > MAX_DISTANCE_CAP:
        max_distance = MAX_DISTANCE_CAP   # silently cap rather than error
    if not (1 <= top_k <= 50):
        raise HTTPException(status_code=422, detail="top_k must be between 1 and 50.")
    invalid_types = [t for t in activity_types if t not in VALID_ACTIVITY_TYPES]
    if invalid_types:
        raise HTTPException(
            status_code=422,
            detail=f"Invalid activity_types: {invalid_types}. Valid options: {sorted(VALID_ACTIVITY_TYPES)}",
        )

    #Resolve coordinates
    if lat is None or lon is None:
        if city and state:
            lat, lon = get_coordinates(city, state)
        else:
            raise HTTPException(
                status_code=400,
                detail="Provide lat+lon or city+state to locate recommendations.",
            )

    # Build user prefs dict for the ranking pipeline
    user_prefs = {
        "activity_types": activity_types,
        "max_distance":   max_distance,
        "budget":         budget,
        "weights": {
            "distance":       w_distance,
            "weather":        w_weather,
            "rating":         w_rating,
            "category_match": w_category,
        },
    }

    # Resolve Foursquare category IDs from user preferences
    if activity_types:
        cat_ids = [
            PREFERENCE_CATEGORIES[t]
            for t in activity_types
            if t in PREFERENCE_CATEGORIES
        ]
    else:
        # No preference set — query all supported categories
        cat_ids = list(PREFERENCE_CATEGORIES.values())

    # Fetch weather and nearby places in parallel would be ideal here;
    # using sequential requests for now (total latency ~400–600ms)
    weather = get_weather(lat, lon)
    places  = search_places(lat, lon, cat_ids, radius=max_distance, limit=10)

    # Rank
    ranked = rank_places(places, user_prefs, weather, top_k=top_k)

    # Attach explanation badges
    for place in ranked:
        place["explanation"] = build_explanation(place, weather)

    return {
        "location": {"lat": lat, "lon": lon},
        "weather":  weather,
        "count":    len(ranked),
        "results":  ranked,
    }


@app.get("/api/places/{fsq_id}")
def get_place(fsq_id: str):
    """Returns full details for a single place (shown when user taps a card)."""
    return get_place_details(fsq_id)


@app.get("/api/weather")
def current_weather(lat: float, lon: float):
    """Standalone weather endpoint — useful for the frontend weather display."""
    return get_weather(lat, lon)


@app.get("/api/geocode")
def geocode(city: str, state: str):
    """Converts city+state to coordinates. Used when GPS is unavailable."""
    lat, lon = get_coordinates(city, state)
    return {"lat": lat, "lon": lon}
