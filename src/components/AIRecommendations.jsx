import { useEffect, useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { SongCard } from "./SongCard";
import { useSpotifyAuth } from "@/context/SpotifyAuthContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getAIRecommendations } from "@/services/firebaseRecommendations";
import { usePlayer } from "@/context/PlayerContext";

export function AIRecommendations() {
  const { user, spotifyToken } = useSpotifyAuth();
  const { addManyToQueue } = usePlayer();
  const [recommendations, setRecommendations] = useState([]);
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
      const recData = await getAIRecommendations(user.id, spotifyToken);
      
      // Convert recommendations to SpotifyTrack format
      const tracks = await Promise.all(
        recData.map(async (rec) => {
          // Search for full track data from Spotify
          const response = await fetch(
            `https://api.spotify.com/v1/tracks/${rec.id}`,
            {
              headers: {
                'Authorization': `Bearer ${spotifyToken}`
              }
            }
          );
          
          if (response.ok) {
            return await response.json();
          }
          
          // Fallback to basic track structure
          return {
            id: rec.id,
            name: rec.track_name,
            artists: [{ name: rec.artist_name }],
            duration_ms: 0,
            uri: `spotify:track:${rec.id}`,
            album: { name: '', images: [] },
            popularity: 0
          };
        })
      );
      
      setRecommendations(tracks);
      setHasGeneratedToday(true);
      
      // Add recommendations to queue
      addManyToQueue(tracks);
      toast.success("AI recommendations added to queue!");
    } catch (error) {
      console.error('Error fetching recommendations:', error);
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
            Based on your listening history and preferences
          </p>
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
            {recommendations.slice(0, 16).map((track) => (
              <div key={track.id} className="relative">
                <SongCard
                  title={track.name}
                  artist={track.artists?.map(a => a.name).join(', ')}
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
