// services/api.ts
import axios from 'axios';
import { auth } from '../firebaseConfig';

const API_BASE_URL = 'http://localhost:8000'; // Change to your backend URL

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Add auth token to every request
api.interceptors.request.use(
  async (config) => {
    const user = auth.currentUser;
    if (user) {
      const token = await user.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Types
export interface UserPreferences {
  activity_types: string[];
  max_distance: number;
  budget: string;
  weights: {
    distance: number;
    weather: number;
    rating: number;
    category_match: number;
  };
}

export interface ActivityRating {
  fsq_id: string;
  name: string;
  rating: number;
  activity_type: string;
  distance: number;
  weather_condition: string;
}

export interface Recommendation {
  fsq_id: string;
  name: string;
  distance: number;
  rating: number;
  _score: number;
  explanation: string;
  location: {
    address: string;
    locality: string;
    region: string;
  };
  categories: Array<{
    name: string;
    icon: {
      prefix: string;
      suffix: string;
    };
  }>;
}

// API functions
export const apiService = {
  // Preferences
  async savePreferences(preferences: UserPreferences) {
    const response = await api.post('/api/user/preferences', preferences);
    return response.data;
  },

  async getPreferences() {
    const response = await api.get('/api/user/preferences');
    return response.data;
  },

  // Recommendations
  async getRecommendations(lat: number, lon: number, topK: number = 5) {
    const response = await api.get('/api/recommendations/personalized', {
      params: { lat, lon, top_k: topK }
    });
    return response.data;
  },

  // Activity rating
  async rateActivity(ratingData: ActivityRating) {
    const response = await api.post('/api/user/activity/rate', ratingData);
    return response.data;
  },

  async getActivityHistory() {
    const response = await api.get('/api/user/activity/history');
    return response.data;
  },

  // Place details
  async getPlaceDetails(fsqId: string) {
    const response = await api.get(`/api/places/${fsqId}`);
    return response.data;
  },

  // Weather
  async getWeather(lat: number, lon: number) {
    const response = await api.get('/api/weather', {
      params: { lat, lon }
    });
    return response.data;
  },
};