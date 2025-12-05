import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Repeat,
  Shuffle,
  Volume2,
  Mic2,
  ListMusic,
  Maximize2,
  Heart,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useState, useEffect } from "react";
import { usePlayer } from "@/context/PlayerContext";

export function Player() {
  const {
    currentTrack,
    isPlaying,
    progress,
    duration,
    volume,
    isLoading,
    togglePlayPause,
    seekTo,
    setVolume: setPlayerVolume,
    nextTrack,
    previousTrack,
  } = usePlayer();
  
  const [isLiked, setIsLiked] = useState(false);
  const [localProgress, setLocalProgress] = useState([0]);
  const [localVolume, setLocalVolume] = useState([volume]);
  
  useEffect(() => {
    setLocalProgress([duration > 0 ? (progress / duration) * 100 : 0]);
  }, [progress, duration]);
  
  useEffect(() => {
    setLocalVolume([volume]);
  }, [volume]);
  
  const handleProgressChange = (value: number[]) => {
    const newProgress = value[0];
    setLocalProgress(value);
    seekTo((newProgress / 100) * duration);
  };
  
  const handleVolumeChange = (value: number[]) => {
    setLocalVolume(value);
    setPlayerVolume(value[0]);
  };
  
  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-player backdrop-blur-lg">
      <div className="mx-auto flex h-24 items-center justify-between px-4">
        {/* Current Track */}
        <div className="flex w-1/3 items-center gap-3">
          {currentTrack ? (
            <>
              {currentTrack.album?.images?.[0]?.url ? (
                <img
                  src={currentTrack.album.images[0].url}
                  alt={currentTrack.album.name}
                  className="h-14 w-14 rounded object-cover"
                />
              ) : (
                <div className="h-14 w-14 rounded bg-gradient-primary" />
              )}
              <div>
                <p className="text-sm font-medium text-foreground">
                  {currentTrack.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {currentTrack.artists.map(a => a.name).join(", ")}
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="h-14 w-14 rounded bg-gradient-primary" />
              <div>
                <p className="text-sm font-medium text-foreground">
                  No track playing
                </p>
                <p className="text-xs text-muted-foreground">Select a song to play</p>
              </div>
            </>
          )}
          <Button
            size="icon"
            variant="ghost"
            className="ml-2 h-8 w-8"
            onClick={() => setIsLiked(!isLiked)}
          >
            <Heart
              className={`h-4 w-4 ${
                isLiked ? "fill-primary text-primary" : "text-muted-foreground"
              }`}
            />
          </Button>
        </div>

        {/* Player Controls */}
        <div className="flex w-1/3 flex-col items-center gap-2">
          <div className="flex items-center gap-4">
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
            >
              <Shuffle className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="text-foreground"
              onClick={previousTrack}
              disabled={!currentTrack}
            >
              <SkipBack className="h-5 w-5" />
            </Button>
            <Button
              size="icon"
              className="h-10 w-10 rounded-full bg-foreground text-background hover:bg-foreground/90"
              onClick={togglePlayPause}
              disabled={!currentTrack || isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : isPlaying ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5 ml-0.5" />
              )}
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="text-foreground"
              onClick={nextTrack}
              disabled={!currentTrack}
            >
              <SkipForward className="h-5 w-5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
            >
              <Repeat className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex w-full items-center gap-2">
            <span className="text-xs text-muted-foreground">{formatTime(progress)}</span>
            <Slider
              value={localProgress}
              onValueChange={handleProgressChange}
              max={100}
              step={1}
              className="w-80"
              disabled={!currentTrack}
            />
            <span className="text-xs text-muted-foreground">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Volume & Options */}
        <div className="flex w-1/3 items-center justify-end gap-3">
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <Mic2 className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <ListMusic className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <Volume2 className="h-4 w-4 text-muted-foreground" />
            <Slider
              value={localVolume}
              onValueChange={handleVolumeChange}
              max={100}
              step={1}
              className="w-24"
            />
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}