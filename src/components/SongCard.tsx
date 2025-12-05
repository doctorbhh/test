import { Play, Music2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { usePlayer } from "@/context/PlayerContext";
import { SpotifyTrack } from "@/types/spotify";

interface SongCardProps {
  title: string;
  artist: string;
  imageUrl?: string;
  imageGradient?: string;
  className?: string;
  onClick?: () => void;
  playlistId?: string;
  track?: SpotifyTrack;
}

export function SongCard({ title, artist, imageUrl, imageGradient = "bg-gradient-primary", className, onClick, playlistId, track }: SongCardProps) {
  const navigate = useNavigate();
  const { playTrack } = usePlayer();
  
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (playlistId) {
      navigate(`/playlist/${playlistId}`);
    }
  };
  
  const handlePlay = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (track) {
      await playTrack(track);
    }
  };
  
  return (
    <div
      className={cn(
        "group relative cursor-pointer overflow-hidden rounded-lg bg-card p-4 transition-all hover:bg-card-glass",
        className
      )}
      onClick={handleClick}
    >
      {imageUrl ? (
        <img 
          src={imageUrl} 
          alt={title}
          className="mb-4 aspect-square w-full rounded-md shadow-lg object-cover"
        />
      ) : (
        <div className={cn("mb-4 aspect-square rounded-md shadow-lg flex items-center justify-center", imageGradient)}>
          <Music2 className="h-12 w-12 text-white/60" />
        </div>
      )}
      <h3 className="mb-1 truncate text-sm font-semibold text-foreground">
        {title}
      </h3>
      <p className="truncate text-xs text-muted-foreground">{artist}</p>
      
      <Button
        size="icon"
        onClick={handlePlay}
        className="absolute bottom-4 right-4 h-10 w-10 rounded-full bg-primary opacity-0 shadow-glow transition-all hover:scale-105 hover:bg-primary-glow group-hover:bottom-20 group-hover:opacity-100"
      >
        <Play className="h-5 w-5 ml-0.5 text-primary-foreground" />
      </Button>
    </div>
  );
}