import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Repeat,
  Repeat1,
  Shuffle,
  Volume2,
  VolumeX,
  Mic2,
  ListMusic,
  Heart,
  Loader2,
  Download,
  MonitorPlay, // NEW ICON IMPORTED
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useState, useEffect, useRef } from "react";
import { usePlayer } from "@/context/PlayerContext";

// --- POPUP VIDEO PAGE ---
const VideoModal = ({ trackName, artistName, onClose }) => {
  const [videoId, setVideoId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const findVideoId = async () => {
      if (!trackName) return;

      setLoading(true);
      setError(null);
      try {
        const query = `${trackName} ${artistName}`;

        // 1. Search Piped API
        const response = await fetch(
          `https://api.piped.private.coffee/search?q=${encodeURIComponent(
            query
          )}&filter=videos`
        );

        if (!response.ok) throw new Error("Network response was not ok");

        const data = await response.json();

        // 2. Extract ID safely
        if (data.items && data.items.length > 0) {
          const firstItem = data.items[0];
          const urlParts = firstItem.url.split("=");
          const id = urlParts[urlParts.length - 1];
          setVideoId(id);
        } else {
          setError("No video found for this song.");
        }
      } catch (err) {
        console.error("Error fetching video ID:", err);
        setError("Unable to load video.");
      } finally {
        setLoading(false);
      }
    };

    findVideoId();
  }, [trackName, artistName]);

  return (
    // Fixed overlay covering the whole screen
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 backdrop-blur-md p-4">
      {/* Wrapper for content */}
      <div className="relative w-full max-w-6xl flex flex-col items-end">
        {/* --- CLOSE BUTTON (Moved Outside the Video Box) --- */}
        {/* This ensures it is NEVER hidden by the iframe */}
        <button
          onClick={onClose}
          className="mb-2 bg-red-600 hover:bg-red-700 text-white rounded-full p-2 shadow-[0_0_15px_rgba(255,0,0,0.5)] transition-transform hover:scale-110 flex items-center justify-center"
          title="Close Video"
        >
          <X size={28} strokeWidth={2.5} />
        </button>

        {/* --- VIDEO CONTAINER --- */}
        <div className="w-full bg-zinc-950 rounded-xl border border-zinc-800 shadow-2xl overflow-hidden relative">
          <div className="relative pt-[56.25%] w-full bg-black">
            {loading ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white gap-4">
                <Loader2 className="h-16 w-16 animate-spin text-red-600" />
                <p className="text-xl font-semibold">Searching for video...</p>
              </div>
            ) : error ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-400 gap-4">
                <MonitorPlay size={64} className="opacity-50" />
                <p className="text-xl">{error}</p>
                <Button onClick={onClose} variant="secondary">
                  Close
                </Button>
              </div>
            ) : videoId ? (
              <iframe
                className="absolute top-0 left-0 w-full h-full"
                src={`https://www.youtube.com/embed/${videoId}?autoplay=1&modestbranding=1&rel=0&origin=${window.location.origin}`}
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              ></iframe>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

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
    queue,
    playTrack,
    isShuffled,
    repeatMode,
    toggleShuffle,
    toggleRepeat,
    downloadTrack,
  } = usePlayer();

  const [isLiked, setIsLiked] = useState(false);
  const [localProgress, setLocalProgress] = useState([0]);
  const [localVolume, setLocalVolume] = useState([volume * 100]);

  // Video State
  const [isVideoOpen, setIsVideoOpen] = useState(false);

  // Lyrics State
  const [syncedLyrics, setSyncedLyrics] = useState([]);
  const [plainLyrics, setPlainLyrics] = useState("");
  const [currentLyricIndex, setCurrentLyricIndex] = useState(-1);
  const [loadingLyrics, setLoadingLyrics] = useState(false);

  const activeLyricRef = useRef(null);

  useEffect(() => {
    setSyncedLyrics([]);
    setPlainLyrics("");
    setCurrentLyricIndex(-1);
    setIsVideoOpen(false);
  }, [currentTrack]);

  useEffect(() => {
    setLocalProgress([duration > 0 ? (progress / duration) * 100 : 0]);
  }, [progress, duration]);

  useEffect(() => {
    setLocalVolume([volume * 100]);
  }, [volume]);

  // --- LYRIC SYNC ---
  useEffect(() => {
    if (syncedLyrics.length > 0) {
      let activeIdx = -1;
      for (let i = 0; i < syncedLyrics.length; i++) {
        if (syncedLyrics[i].time <= progress) {
          activeIdx = i;
        } else {
          break;
        }
      }
      if (activeIdx !== currentLyricIndex) {
        setCurrentLyricIndex(activeIdx);
      }
    }
  }, [progress, syncedLyrics, currentLyricIndex]);

  useEffect(() => {
    if (activeLyricRef.current) {
      activeLyricRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [currentLyricIndex]);

  const handleProgressChange = (value) => {
    setLocalProgress(value);
    seekTo((value[0] / 100) * duration);
  };

  const handleVolumeChange = (value) => {
    setLocalVolume(value);
    setPlayerVolume(value[0] / 100);
  };

  const toggleMute = () => {
    if (volume > 0) {
      setPlayerVolume(0);
      setLocalVolume([0]);
    } else {
      setPlayerVolume(0.5);
      setLocalVolume([50]);
    }
  };

  const parseLRC = (lrcString) => {
    const lines = lrcString.split("\n");
    const result = [];
    const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/;

    for (const line of lines) {
      const match = line.match(timeRegex);
      if (match) {
        const minutes = parseInt(match[1]);
        const seconds = parseInt(match[2]);
        const msString = match[3].padEnd(3, "0");
        const ms = parseInt(msString.substring(0, 3));
        const time = minutes * 60 + seconds + ms / 1000;
        const text = line.replace(timeRegex, "").trim();

        if (text) result.push({ time, text });
      }
    }
    return result;
  };

  const fetchLyrics = async () => {
    if (!currentTrack) return;
    if (syncedLyrics.length > 0 || plainLyrics) return;

    setLoadingLyrics(true);
    try {
      const res = await fetch(
        `https://lrclib.net/api/get?artist_name=${encodeURIComponent(
          currentTrack.artists[0].name
        )}&track_name=${encodeURIComponent(currentTrack.name)}`
      );

      if (!res.ok) throw new Error("Lyrics not found");
      const data = await res.json();

      if (data.syncedLyrics) {
        const parsed = parseLRC(data.syncedLyrics);
        setSyncedLyrics(parsed);
      } else if (data.plainLyrics) {
        setPlainLyrics(data.plainLyrics);
      } else {
        setPlainLyrics("No lyrics found.");
      }
    } catch (e) {
      setPlainLyrics("Lyrics not available for this song.");
    } finally {
      setLoadingLyrics(false);
    }
  };

  const formatTime = (seconds) => {
    if (isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <>
      {/* --- VIDEO POPUP PAGE --- */}
      {isVideoOpen && currentTrack && (
        <VideoModal
          trackName={currentTrack.name}
          artistName={currentTrack.artists?.[0]?.name}
          onClose={() => setIsVideoOpen(false)}
        />
      )}

      {/* --- PLAYER BAR --- */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 shadow-2xl">
        <div className="container mx-auto flex h-24 items-center justify-between px-4 sm:px-8">
          {/* LEFT SECTION */}
          <div className="flex w-[30%] min-w-0 items-center gap-4">
            {currentTrack ? (
              <>
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md border border-border/50 shadow-sm">
                  <img
                    src={currentTrack.album?.images?.[0]?.url || ""}
                    alt={currentTrack.album?.name || "Album Art"}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="flex min-w-0 flex-col justify-center overflow-hidden">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {currentTrack.name}
                  </p>
                  <p className="truncate text-xs text-muted-foreground hover:underline cursor-pointer">
                    {currentTrack.artists?.map((a) => a.name).join(", ")}
                  </p>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className={`hidden h-9 w-9 shrink-0 sm:flex ${
                    isLiked ? "text-primary" : "text-muted-foreground"
                  }`}
                  onClick={() => setIsLiked(!isLiked)}
                >
                  <Heart
                    className={`h-5 w-5 ${isLiked ? "fill-current" : ""}`}
                  />
                </Button>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <div className="h-14 w-14 rounded-md bg-muted/50 animate-pulse" />
                <div className="flex flex-col gap-2">
                  <div className="h-4 w-32 rounded bg-muted/50 animate-pulse" />
                  <div className="h-3 w-20 rounded bg-muted/50 animate-pulse" />
                </div>
              </div>
            )}
          </div>

          {/* CENTER SECTION */}
          <div className="flex w-[40%] flex-col items-center justify-center gap-3">
            <div className="flex items-center gap-6">
              <Button
                size="icon"
                variant="ghost"
                className={`h-9 w-9 transition-colors ${
                  isShuffled
                    ? "text-primary hover:text-primary/80"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={toggleShuffle}
                title="Shuffle"
              >
                <Shuffle className="h-4 w-4" />
              </Button>

              <Button
                size="icon"
                variant="ghost"
                className="h-9 w-9 text-foreground hover:text-foreground/80 hover:bg-muted/50"
                onClick={previousTrack}
                disabled={!currentTrack}
              >
                <SkipBack className="h-5 w-5" />
              </Button>

              <Button
                size="icon"
                className="h-12 w-12 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-md transition-all active:scale-95"
                onClick={togglePlayPause}
                disabled={!currentTrack || isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : isPlaying ? (
                  <Pause className="h-6 w-6 fill-current" />
                ) : (
                  <Play className="h-6 w-6 fill-current ml-1" />
                )}
              </Button>

              <Button
                size="icon"
                variant="ghost"
                className="h-9 w-9 text-foreground hover:text-foreground/80 hover:bg-muted/50"
                onClick={nextTrack}
                disabled={!currentTrack}
              >
                <SkipForward className="h-5 w-5" />
              </Button>

              <Button
                size="icon"
                variant="ghost"
                className={`h-9 w-9 transition-colors ${
                  repeatMode !== "off"
                    ? "text-primary hover:text-primary/80"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={toggleRepeat}
                title="Repeat"
              >
                {repeatMode === "one" ? (
                  <Repeat1 className="h-4 w-4" />
                ) : (
                  <Repeat className="h-4 w-4" />
                )}
              </Button>
            </div>

            <div className="flex w-full max-w-lg items-center gap-3">
              <span className="w-10 text-right text-xs font-medium text-muted-foreground tabular-nums">
                {formatTime(progress)}
              </span>
              <Slider
                value={localProgress}
                onValueChange={handleProgressChange}
                max={100}
                step={0.1}
                className="w-full cursor-pointer"
                disabled={!currentTrack}
              />
              <span className="w-10 text-xs font-medium text-muted-foreground tabular-nums">
                {formatTime(duration)}
              </span>
            </div>
          </div>

          {/* RIGHT SECTION: Volume & Extras */}
          <div className="flex w-[30%] min-w-0 items-center justify-end gap-3 sm:gap-5">
            {/* Watch Video Button */}
            {currentTrack && (
              <Button
                size="icon"
                variant="ghost"
                className="h-9 w-9 text-red-500 hover:text-red-600 hover:bg-red-500/10 transition-all"
                onClick={() => setIsVideoOpen(true)}
                title="Watch Music Video"
              >
                <MonitorPlay className="h-5 w-5" />
              </Button>
            )}

            {/* Lyrics Button */}
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-9 w-9 text-muted-foreground hover:text-foreground"
                  onClick={fetchLyrics}
                  disabled={!currentTrack}
                  title="Lyrics"
                >
                  <Mic2 className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent className="overflow-hidden flex flex-col w-full sm:max-w-md bg-background/90 backdrop-blur-xl border-l border-border/50">
                <SheetHeader>
                  <SheetTitle className="text-center text-xl font-bold">
                    Lyrics
                  </SheetTitle>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto px-6 mt-4 pb-20 scrollbar-hide mask-image-gradient">
                  {loadingLyrics ? (
                    <div className="flex h-full flex-col items-center justify-center gap-4">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <p className="text-muted-foreground animate-pulse">
                        Fetching lyrics...
                      </p>
                    </div>
                  ) : syncedLyrics.length > 0 ? (
                    <div className="flex flex-col gap-6 py-10">
                      {syncedLyrics.map((line, index) => (
                        <p
                          key={index}
                          ref={
                            index === currentLyricIndex ? activeLyricRef : null
                          }
                          className={`text-center transition-all duration-500 ease-out cursor-pointer ${
                            index === currentLyricIndex
                              ? "text-2xl font-bold text-primary scale-105"
                              : "text-lg font-medium text-muted-foreground/60 hover:text-muted-foreground"
                          }`}
                          onClick={() => seekTo(line.time)}
                        >
                          {line.text}
                        </p>
                      ))}
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap text-center text-lg leading-loose font-medium text-foreground/80 py-10">
                      {plainLyrics || "No lyrics available."}
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>

            {/* Queue Button */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-9 w-9 text-muted-foreground hover:text-foreground"
                  title="Queue"
                >
                  <ListMusic className="h-5 w-5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-80 p-0 mr-6 mb-2 shadow-2xl border-border/50 bg-popover/85 backdrop-blur-md rounded-xl"
                align="end"
                side="top"
                sideOffset={10}
                collisionPadding={10}
              >
                <div className="border-b border-border/50 p-3 bg-muted/30">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-sm">Play Queue</h4>
                    <span className="text-xs text-muted-foreground bg-background/50 px-2 py-0.5 rounded-full border border-border/50">
                      {queue.length}
                    </span>
                  </div>
                </div>

                <div
                  style={{ maxHeight: "50vh", overflowY: "auto" }}
                  className="w-full scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent hover:scrollbar-thumb-muted-foreground/40 transition-colors"
                >
                  {queue.length === 0 ? (
                    <div className="flex h-32 flex-col items-center justify-center text-muted-foreground">
                      <ListMusic className="mb-2 h-8 w-8 opacity-20" />
                      <p className="text-sm">Queue is empty</p>
                    </div>
                  ) : (
                    <div className="flex flex-col py-1">
                      {queue.map((track, index) => (
                        <button
                          key={`${track.id}-${index}`}
                          className={`group flex w-full items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-muted/60 ${
                            currentTrack?.id === track.id
                              ? "bg-primary/10 border-l-2 border-primary"
                              : "border-l-2 border-transparent"
                          }`}
                          onClick={() => playTrack(track)}
                        >
                          {currentTrack?.id === track.id && isPlaying ? (
                            <div className="h-4 w-4 shrink-0 flex items-center justify-center">
                              <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                            </div>
                          ) : (
                            <span className="w-4 text-center text-xs text-muted-foreground tabular-nums group-hover:text-foreground font-medium">
                              {index + 1}
                            </span>
                          )}

                          <div className="h-8 w-8 shrink-0 overflow-hidden rounded bg-secondary">
                            <img
                              src={track.album?.images?.[0]?.url || ""}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p
                              className={`truncate text-sm font-medium ${
                                currentTrack?.id === track.id
                                  ? "text-primary"
                                  : "text-foreground"
                              }`}
                            >
                              {track.name}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                              {track.artists?.map((a) => a.name).join(", ")}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>

            {/* Download Button */}
            <Button
              size="icon"
              variant="ghost"
              className="h-9 w-9 text-muted-foreground hover:text-foreground hidden sm:flex"
              onClick={() => downloadTrack(currentTrack)}
              disabled={!currentTrack}
              title="Download"
            >
              <Download className="h-5 w-5" />
            </Button>

            {/* Volume Slider */}
            <div className="hidden sm:flex items-center gap-3 group min-w-[120px]">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={toggleMute}
              >
                {volume === 0 ? (
                  <VolumeX className="h-5 w-5" />
                ) : (
                  <Volume2 className="h-5 w-5" />
                )}
              </Button>
              <Slider
                value={localVolume}
                onValueChange={handleVolumeChange}
                max={100}
                step={1}
                className="w-24 transition-all"
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
