import React, { createContext, useState, useContext, useEffect } from "react";
import { toast } from "sonner";

const AuthContext = createContext({
  isAuthenticated: false,
  loading: true,
  user: null,
  spotifyToken: null,
  login: () => {},
  logout: () => {},
});

export const useSpotifyAuth = () => useContext(AuthContext);

// Spotify API scopes needed
const SCOPES = [
  "user-read-private",
  "user-read-email",
  "playlist-read-private",
  "playlist-read-collaborative",
  "user-library-read",
].join(" ");

// Public Client ID from Spotify Developer Dashboard
const CLIENT_ID = "f3868da12ebd4a599754a9e4e927f867";

// Calculate redirect URI dynamically to prevent mismatches
const REDIRECT_URI = `${window.location.origin}/callback`;

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [spotifyToken, setSpotifyToken] = useState(null);

  useEffect(() => {
    // If we're on the callback page, let the callback page handle logic
    if (window.location.pathname === "/callback") {
      setLoading(false);
      return;
    }

    const token = localStorage.getItem("spotify_token");
    const expiresAt = localStorage.getItem("spotify_expires_at");

    if (token && expiresAt && Date.now() < parseInt(expiresAt)) {
      setSpotifyToken(token);
      fetchUserProfile(token);
    } else {
      localStorage.removeItem("spotify_token");
      localStorage.removeItem("spotify_expires_at");
      setLoading(false);
    }
  }, []);

  const fetchUserProfile = async (token) => {
    try {
      const response = await fetch("https://api.spotify.com/v1/me", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Spotify API Error:", response.status, errorData);
        throw new Error(`Failed to fetch user profile: ${response.status}`);
      }

      const userData = await response.json();
      setUser(userData);
      setIsAuthenticated(true);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching user profile:", error);
      toast.error("Could not get your profile from Spotify");
      logout();
    }
  };

  const login = () => {
    // Generate a random state value for security
    const state = Math.random().toString(36).substring(2, 15);
    localStorage.setItem("spotify_auth_state", state);

    // Build the Spotify authorization URL
    const authUrl = new URL("https://accounts.spotify.com/authorize");
    authUrl.searchParams.append("client_id", CLIENT_ID);
    authUrl.searchParams.append("response_type", "token");
    authUrl.searchParams.append("redirect_uri", REDIRECT_URI);
    authUrl.searchParams.append("scope", SCOPES);
    authUrl.searchParams.append("state", state);

    window.location.href = authUrl.toString();
  };

  const logout = () => {
    localStorage.removeItem("spotify_token");
    localStorage.removeItem("spotify_expires_at");
    localStorage.removeItem("spotify_auth_state");
    setIsAuthenticated(false);
    setUser(null);
    setSpotifyToken(null);
    setLoading(false);
    toast.success("Logged out successfully");
    // Force reload to clear all state
    window.location.href = "/";
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, loading, user, spotifyToken, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
