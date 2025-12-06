import { getSavedInstance, getAudioQuality } from "./instanceService";

// Helper to get current API base for Search (Piped)
const getSearchApiBase = () => {
  return getSavedInstance();
};

// Hardcoded Invidious Instance for Streams as requested
const STREAM_API_BASE = 'https://yt.omada.cafe';

// Get streaming URL for a track
export const getAudioUrlForTrack = async (track) => {
  // console.log(`Finding audio URL for: ${track.name}`);

  try {
    const searchQuery = `${track.name} ${track.artists.map(a => a.name).join(' ')}`;

    // 1. Search using Dynamic Piped API
    const searchResults = await searchYouTube(searchQuery);

    if (searchResults.length === 0) {
      throw new Error("No matching videos found");
    }

    const bestMatch = searchResults[0];
    // console.log(`Found best match: ${bestMatch.title} (${bestMatch.id})`);

    // 2. Extract Audio using Specific Invidious API
    const audioUrl = await getStreamUrl(bestMatch.id);
    return audioUrl;
  } catch (error) {
    console.error("Error finding audio URL:", error);
    throw error;
  }
};

// Search using Piped API (Dynamic Instance)
export const searchYouTube = async (query) => {
  try {
    const baseUrl = getSearchApiBase();
    const filter = 'music_songs';
    const encodedQuery = encodeURIComponent(query);

    const response = await fetch(`${baseUrl}/search?q=${encodedQuery}&filter=${filter}`);

    if (!response.ok) {
      throw new Error(`Search API error (${baseUrl}): ${response.status}`);
    }

    const data = await response.json();

    if (!data.items || !data.items.length) {
      return [];
    }

    const results = data.items
      .filter(item => !item.isShort && item.type === 'stream')
      .map((item) => {
        let uploaderName = item.uploaderName || 'Unknown';
        if (filter === 'music_songs' && !uploaderName.endsWith(' - Topic')) {
          uploaderName += ' - Topic';
        }

        return {
          id: item.url.split('v=')[1],
          title: item.title,
          thumbnail: item.thumbnail,
          channelTitle: uploaderName,
          url: `https://www.youtube.com${item.url}`,
          duration: item.duration
        };
      });

    return results;
  } catch (error) {
    console.error("Search failed:", error);
    throw error;
  }
};

// Get audio URL directly from Invidious (yt.omada.cafe)
// Replaces googlevideo.com with yt.omada.cafe proxy
const getStreamUrl = async (videoId) => {
  try {
    // Call Invidious API directly
    const response = await fetch(`${STREAM_API_BASE}/api/v1/videos/${videoId}`);

    if (!response.ok) {
      throw new Error(`Stream API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.adaptiveFormats || data.adaptiveFormats.length === 0) {
      throw new Error('No adaptive formats found');
    }

    // Filter for audio streams only
    let audioStreams = data.adaptiveFormats
      .filter(format => format.type && format.type.startsWith('audio'));

    if (audioStreams.length === 0) {
      throw new Error('No audio streams found');
    }

    // Sort based on Quality Setting
    const quality = getAudioQuality(); // 'low', 'medium', 'high'

    audioStreams.sort((a, b) => {
      const bitrateA = parseInt(a.bitrate || 0);
      const bitrateB = parseInt(b.bitrate || 0);

      // For high quality, we want descending order (Highest first)
      return bitrateB - bitrateA;
    });

    let selectedStream;

    if (quality === 'high') {
      selectedStream = audioStreams[0]; // Highest bitrate
    } else if (quality === 'low') {
      selectedStream = audioStreams[audioStreams.length - 1]; // Lowest bitrate
    } else {
      // Medium: Try to pick something in the middle or ~128kbps
      const middleIndex = Math.floor(audioStreams.length / 2);
      selectedStream = audioStreams[middleIndex];
    }

    // --- PROXY REPLACEMENT LOGIC ---
    // User Requirement: Replace https://rr1---sn-j85aaxt-jv0s.googlevideo.com with https://yt.omada.cafe

    const originalUrl = new URL(selectedStream.url);

    // We strictly force the hostname to be the proxy
    // This allows streaming even if the user's IP is blocked by Google
    originalUrl.hostname = 'yt.omada.cafe';

    const finalUrl = originalUrl.toString();

    // console.log(`Proxy URL generated (${quality}): ${finalUrl}`);
    return finalUrl;

  } catch (error) {
    console.error("Stream fetch failed:", error);
    throw error;
  }
};