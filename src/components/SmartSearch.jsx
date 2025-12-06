import { useState, useEffect } from "react";
import { Search, Play, Clock, Music2, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { usePlayer } from "@/context/PlayerContext";
import { smartSearch } from "@/services/youtubeService";
import { toast } from "sonner";

export function SmartSearch({ open, onClose }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const { playTrack, addToQueue } = usePlayer();

  useEffect(() => {
    const debounceTimer = setTimeout(async () => {
      if (query.trim()) {
        setSearching(true);
        try {
          const data = await smartSearch(query);
          setResults(data);
        } catch (err) {
          console.error(err);
          toast.error("Search failed");
        } finally {
          setSearching(false);
        }
      } else {
        setResults([]);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(debounceTimer);
  }, [query]);

  const formatDuration = (seconds) => {
    if (!seconds) return "--:--";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const handlePlay = async (track) => {
    // We pass the track directly. playTrack in context needs to handle
    // objects that already have metadata but might need a URL fetch.
    await playTrack(track);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl bg-black/90 backdrop-blur-xl border-white/10 text-white p-0 overflow-hidden gap-0">
        {/* Header / Search Input Area */}
        <div className="p-6 border-b border-white/10">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Music2 className="text-green-500" /> Smart Search
            </DialogTitle>
          </DialogHeader>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-white/50" />
            <Input
              placeholder="Search songs, artists, YouTube URLs..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10 bg-white/5 border-white/10 focus:ring-green-500/50 text-lg h-12 rounded-full transition-all focus:bg-white/10"
              autoFocus
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Results Area */}
        <ScrollArea className="h-[500px]">
          <div className="p-2">
            {searching && (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <div className="h-10 w-10 border-4 border-green-500/30 border-t-green-500 rounded-full animate-spin" />
                <p className="text-white/50 animate-pulse">
                  Searching across platforms...
                </p>
              </div>
            )}

            {!searching && results.length === 0 && query && (
              <div className="text-center py-20 text-white/40">
                <p>No results found for "{query}"</p>
                <p className="text-sm mt-2">
                  Try checking the spelling or using different keywords.
                </p>
              </div>
            )}

            {!searching && !query && (
              <div className="text-center py-32 text-white/30 flex flex-col items-center">
                <Search className="h-16 w-16 mb-4 opacity-20" />
                <p>Start typing to search</p>
              </div>
            )}

            {!searching && results.length > 0 && (
              <div className="grid gap-1 p-2">
                {results.map((track) => (
                  <div
                    key={track.id}
                    className="group flex items-center gap-4 rounded-xl p-3 hover:bg-white/10 transition-all duration-200 cursor-pointer border border-transparent hover:border-white/5"
                    onClick={() => handlePlay(track)}
                  >
                    {/* Album Art */}
                    <div className="relative h-14 w-14 shrink-0 rounded-md overflow-hidden shadow-lg">
                      <img
                        src={track.thumbnail}
                        alt={track.title}
                        className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <Play className="h-6 w-6 fill-white text-white" />
                      </div>
                    </div>

                    {/* Text Info */}
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <h4 className="font-semibold text-white truncate pr-4 text-base leading-tight">
                        {track.title}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        {track.isOfficial && (
                          <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded text-white/90 font-bold uppercase tracking-wider">
                            Official
                          </span>
                        )}
                        <p className="text-sm text-white/60 truncate">
                          {track.channelTitle}
                        </p>
                      </div>
                    </div>

                    {/* Right Actions */}
                    <div className="flex items-center gap-4 shrink-0 pr-2">
                      <span className="text-xs text-white/40 font-mono flex items-center gap-1 bg-black/20 px-2 py-1 rounded">
                        <Clock className="h-3 w-3" />
                        {formatDuration(track.duration)}
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 rounded-full hover:bg-white/20 hover:text-green-400 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          addToQueue(track);
                        }}
                        title="Add to Queue"
                      >
                        <div className="text-xl leading-none pb-1">+</div>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
