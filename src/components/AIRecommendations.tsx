import { useEffect, useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { SongCard } from "./SongCard";
import { useSpotifyAuth } from "@/context/SpotifyAuthContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getAIRecommendations } from "@/services/firebaseRecommendations";
import { usePlayer } from "@/context/PlayerContext";
import { SpotifyTrack } from "@/types/spotify";

export function AIRecommendations() {
  const { user, spotifyToken } = useSpotifyAuth();
  const { addManyToQueue } = usePlayer();
  const [recommendations, setRecommendations] = useState<SpotifyTrack[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasGeneratedToday, setHasGeneratedToday] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchRecommendations();
    }
  }, [user]);

  const fetchRecommendations = async () => {
    if (!user?.id || !spotifyToken) return;

    setLoading(true);
    try {
      // 1. Get text recommendations from Gemini (via Firebase service)
      const recData = await getAIRecommendations(user.id);

      // 2. Resolve these text recommendations into Spotify Tracks
      const resolvedTracks = await Promise.all(
        recData.map(async (rec) => {
          try {
            // Search Spotify for the specific track and artist
            const query = `track:${rec.track_name} artist:${rec.artist_name}`;
            const response = await fetch(
              `https://api.spotify.com/v1/search?q=${encodeURIComponent(
                query
              )}&type=track&limit=1`,
              {
                headers: {
                  Authorization: `Bearer ${spotifyToken}`,
                },
              }
            );

            if (response.ok) {
              const data = await response.json();
              const track = data.tracks?.items?.[0];
              if (track) {
                return track as SpotifyTrack;
              }
            }
          } catch (err) {
            console.error(`Failed to resolve track: ${rec.track_name}`, err);
          }
          return null;
        })
      );

      // Filter out any failed resolutions (nulls)
      const validTracks = resolvedTracks.filter(
        (t): t is SpotifyTrack => t !== null
      );

      setRecommendations(validTracks);
      setHasGeneratedToday(true);

      if (validTracks.length > 0) {
        addManyToQueue(validTracks);
        toast.success("AI recommendations added to queue!");
      } else if (recData.length > 0) {
        toast.error("Could not find recommendations on Spotify.");
      }
    } catch (error) {
      console.error("Error fetching recommendations:", error);
      toast.error("Failed to generate recommendations.");
    } finally {
      setLoading(false);
    }
  };

  const generateNewRecommendations = async () => {
    await fetchRecommendations();
  };

  if (!user) return null;

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold text-foreground">
            AI Recommendations for You
          </h2>
        </div>
        {!loading && (
          <Button
            onClick={generateNewRecommendations}
            variant="outline"
            size="sm"
            disabled={hasGeneratedToday}
          >
            {hasGeneratedToday ? "Updated Today" : "Generate New"}
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : recommendations.length > 0 ? (
        <div>
          <p className="text-sm text-muted-foreground mb-4">
            Based on your listening history and preferences (Powered by Gemini)
          </p>
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
            {recommendations.slice(0, 16).map((track) => (
              <div key={track.id} className="relative">
                <SongCard
                  title={track.name}
                  artist={track.artists?.map((a) => a.name).join(", ")}
                  imageUrl={track.album?.images?.[0]?.url}
                  imageGradient="bg-gradient-to-br from-primary/50 to-primary-glow/50"
                  track={track}
                />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-12 px-4 rounded-lg bg-card/60 backdrop-blur">
          <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            No recommendations yet
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Listen to more songs to get personalized AI recommendations
          </p>
          <Button onClick={generateNewRecommendations} size="sm">
            Generate Recommendations
          </Button>
        </div>
      )}
    </div>
  );
}
