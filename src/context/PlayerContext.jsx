import React, { createContext, useState, useContext, useRef, useEffect } from "react";
import { toast } from "sonner";
import { useSpotifyAuth } from "@/context/SpotifyAuthContext";
import { trackListening } from "@/services/firebaseRecommendations";
import { getAudioUrlForTrack } from "@/services/youtubeService";

const PlayerContext = createContext({
  currentTrack: null,
  isPlaying: false,
  progress: 0,
  duration: 0,
  volume: 70,
  isLoading: false,
  playTrack: async () => {},
  togglePlayPause: () => {},
  seekTo: () => {},
  setVolume: () => {},
  nextTrack: () => {},
  previousTrack: () => {},
  queue: [],
  addToQueue: () => {},
  addManyToQueue: () => {},
  clearQueue: () => {},
});

export const usePlayer = () => useContext(PlayerContext);

export const PlayerProvider = ({ children }) => {
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(70);
  const [isLoading, setIsLoading] = useState(false);
  const [queue, setQueue] = useState([]);
  const queueRef = useRef([]);
  const audioRef = useRef(null);
  const { user } = useSpotifyAuth();

  useEffect(() => {
    // Create audio element once
    audioRef.current = new Audio();
    audioRef.current.volume = volume / 100;
    
    const audio = audioRef.current;
    
    // Event listeners
    const handleTimeUpdate = () => {
      setProgress(audio.currentTime);
    };
    
    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };
    
    const handleEnded = () => {
      setIsPlaying(false);
      // Automatically play next song in queue
      if (queueRef.current.length > 0) {
        setTimeout(() => nextTrack(), 500); // Small delay for smooth transition
      }
    };
    
    const handleError = (e) => {
      console.error("Audio playback error:", e);
      toast.error("Failed to play track");
      setIsPlaying(false);
      setIsLoading(false);
    };
    
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    
    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.pause();
      audio.src = '';
    };
  }, []);

  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);

  // Track listening history using Firebase
  const trackListeningData = async (track) => {
    if (!user) return;
    
    try {
      // Track in Firebase for AI recommendations
      await trackListening(user.id, track);
    } catch (error) {
      console.error('Error tracking listening:', error);
    }
  };

  const playTrack = async (track) => {
    if (!audioRef.current) return;
    
    setIsLoading(true);
    setCurrentTrack(track);
    
    try {
      // Get audio URL using YouTube service
      const audioUrl = await getAudioUrlForTrack(track);
      
      // Set the audio source and play
      audioRef.current.src = audioUrl;
      await audioRef.current.play();
      setIsPlaying(true);
      toast.success(`Now playing: ${track.name}`);
      
      // Track listening history for AI recommendations
      await trackListeningData(track);
      
    } catch (error) {
      console.error('Error playing track:', error);
      
      // Fallback to preview URL if available
      if (track.preview_url) {
        audioRef.current.src = track.preview_url;
        await audioRef.current.play();
        setIsPlaying(true);
        toast.info(`Playing preview: ${track.name}`);
      } else {
        toast.error('Failed to play track. Make sure server.js is running on port 3001');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const togglePlayPause = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const seekTo = (time) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = time;
    setProgress(time);
  };

  const setVolume = (newVolume) => {
    if (!audioRef.current) return;
    audioRef.current.volume = newVolume / 100;
    setVolumeState(newVolume);
  };

  const nextTrack = async () => {
    if (queue.length > 0) {
      const [next, ...rest] = queue;
      setQueue(rest);
      await playTrack(next);
    }
  };

  const previousTrack = () => {
    if (audioRef.current && audioRef.current.currentTime > 3) {
      seekTo(0);
    }
  };

  const addToQueue = (track) => {
    setQueue(prev => [...prev, track]);
    toast.success('Added to queue');
  };

  const addManyToQueue = (tracks) => {
    if (tracks.length === 0) return;
    setQueue(prev => [...prev, ...tracks]);
    toast.success(`Added ${tracks.length} to queue`);
  };

  const clearQueue = () => {
    setQueue([]);
  };

  return (
    <PlayerContext.Provider
      value={{
        currentTrack,
        isPlaying,
        progress,
        duration,
        volume,
        isLoading,
        playTrack,
        togglePlayPause,
        seekTo,
        setVolume,
        nextTrack,
        previousTrack,
        queue,
        addToQueue,
        addManyToQueue,
        clearQueue,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
};
