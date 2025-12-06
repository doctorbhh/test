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

const SCOPES = [
  "user-read-private",
  "user-read-email",
  "playlist-read-private",
  "playlist-read-collaborative",
  "user-library-read",
].join(" ");

const CLIENT_ID = "f3868da12ebd4a599754a9e4e927f867";
// Ensure this matches your Spotify Dashboard EXACTLY (including slash)
const REDIRECT_URI = `${window.location.origin.replace(
  "localhost",
  "127.0.0.1"
)}/callback`;

// PKCE Helpers
const generateRandomString = (length) => {
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const values = crypto.getRandomValues(new Uint8Array(length));
  return values.reduce((acc, x) => acc + possible[x % possible.length], "");
};

const sha256 = async (plain) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  return window.crypto.subtle.digest("SHA-256", data);
};

const base64encode = (input) => {
  return btoa(String.fromCharCode(...new Uint8Array(input)))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [spotifyToken, setSpotifyToken] = useState(null);

  useEffect(() => {
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
      logout();
    }
  }, []);

  const fetchUserProfile = async (token) => {
    try {
      const response = await fetch("https://api.spotify.com/v1/me", {
        // Corrected URL
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
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

  const login = async () => {
    const codeVerifier = generateRandomString(64);
    const hashed = await sha256(codeVerifier);
    const codeChallenge = base64encode(hashed);

    window.localStorage.setItem("spotify_code_verifier", codeVerifier);

    // FIXED: Use the real Spotify Auth URL
    const authUrl = new URL("https://accounts.spotify.com/authorize");
    authUrl.searchParams.append("client_id", CLIENT_ID);
    authUrl.searchParams.append("response_type", "code");
    authUrl.searchParams.append("redirect_uri", REDIRECT_URI);
    authUrl.searchParams.append("scope", SCOPES);
    authUrl.searchParams.append("code_challenge_method", "S256");
    authUrl.searchParams.append("code_challenge", codeChallenge);

    window.location.href = authUrl.toString();
  };

  const logout = () => {
    localStorage.removeItem("spotify_token");
    localStorage.removeItem("spotify_expires_at");
    localStorage.removeItem("spotify_refresh_token");
    localStorage.removeItem("spotify_code_verifier");
    setIsAuthenticated(false);
    setUser(null);
    setSpotifyToken(null);
    setLoading(false);
    if (window.location.pathname !== "/") {
      window.location.href = "/";
    }
  };

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, loading, user, spotifyToken, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};
