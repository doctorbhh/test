import { Play, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SpotifyTrack } from "@/types/spotify";
import { usePlayer } from "@/context/PlayerContext";

interface TrackItemProps {
  track: SpotifyTrack;
  index: number;
  showCover?: boolean;
  showAlbum?: boolean;
  showIndex?: boolean;
}

export default function TrackItem({ 
  track, 
  index, 
  showCover = false,
  showAlbum = false,
  showIndex = false 
}: TrackItemProps) {
  const { playTrack, currentTrack, isPlaying } = usePlayer();
  const isCurrentTrack = currentTrack?.id === track.id;
  
  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };
  
  const handlePlay = () => {
    playTrack(track);
  };
  
  return (
    <div className={`group flex items-center gap-4 px-4 py-2 hover:bg-card-glass rounded-md transition-colors ${isCurrentTrack ? 'bg-card-glass' : ''}`}>
      {showIndex && (
        <div className="w-4 text-center text-sm text-muted-foreground">
          {index + 1}
        </div>
      )}
      
      {showCover && (
        <div className="h-10 w-10 rounded overflow-hidden bg-muted">
          {track.album?.images?.[0]?.url ? (
            <img 
              src={track.album.images[0].url} 
              alt={track.album.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full bg-gradient-primary" />
          )}
        </div>
      )}
      
      <div className="flex-1 min-w-0">
        <p className={`font-medium truncate ${isCurrentTrack ? 'text-primary' : 'text-foreground'}`}>
          {track.name}
        </p>
        <p className="text-sm text-muted-foreground truncate">
          {track.artists.map(a => a.name).join(", ")}
        </p>
      </div>
      
      {showAlbum && (
        <div className="flex-1 min-w-0 hidden md:block">
          <p className="text-sm text-muted-foreground truncate">
            {track.album.name}
          </p>
        </div>
      )}
      
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">
          {formatDuration(track.duration_ms)}
        </span>
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={handlePlay}
        >
          <Play className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}