// Using the specific Piped instance provided
const STREAM_API = 'https://yt.omada.cafe';
const SEARCH_API = 'https://api.piped.private.coffee';

// Get streaming URL for a track
export const getAudioUrlForTrack = async (track) => {
  console.log(`Finding audio URL for: ${track.name} by ${track.artists.map(a => a.name).join(', ')}`);

  try {
    // Create search query
    const searchQuery = `${track.name} ${track.artists.map(a => a.name).join(' ')}`;

    // Search using Piped API (ported from ytify)
    const searchResults = await searchYouTube(searchQuery);

    if (searchResults.length === 0) {
      throw new Error("No matching videos found");
    }

    const bestMatch = searchResults[0];
    console.log(`Found best match: ${bestMatch.title}`);

    // Get audio URL directly from Invidious using the video ID
    const audioUrl = await getStreamUrl(bestMatch.id);

    return audioUrl;
  } catch (error) {
    console.error("Error finding audio URL:", error);
    throw error;
  }
};

// Search for a track using Piped API (Ported from ytify fetchWithPiped)
export const searchYouTube = async (query) => {
  console.log(`Searching YouTube for: ${query}`);

  try {
    // Construct query similar to ytify's logic
    const filter = 'music_songs';
    const encodedQuery = encodeURIComponent(query);
    const response = await fetch(`${SEARCH_API}/search?q=${encodedQuery}&filter=${filter}`);

    if (!response.ok) {
      throw new Error(`Search API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.items || !data.items.length) {
      return [];
    }

    // Logic adapted from ytify/fetchSearchResults.ts
    const results = data.items
      .filter(item => !item.isShort && item.type === 'stream')
      .map((item) => {
        let uploaderName = item.uploaderName;

        if (filter === 'music_songs' && !uploaderName.endsWith(' - Topic')) {
          uploaderName += ' - Topic';
        }

        return {
          id: item.url.split('v=')[1], // Extract ID from /watch?v=...
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

// Get audio URL directly from Invidious API (yt.omada.cafe)
const getStreamUrl = async (videoId) => {
  console.log(`Fetching stream data for videoId: ${videoId}`);

  try {
    // Call Invidious streams endpoint directly
    const response = await fetch(`${STREAM_API}/api/v1/videos/${videoId}`);
    if (!response.ok) {
      throw new Error(`Stream API error: ${response.status}`);
    }

    const data = await response.json();

    // Look for adaptive formats (Invidious structure)
    if (!data.adaptiveFormats || data.adaptiveFormats.length === 0) {
      throw new Error('No adaptive formats found');
    }

    // Filter for audio streams and sort by bitrate (descending)
    const audioStreams = data.adaptiveFormats
      .filter(format => format.type && format.type.startsWith('audio'))
      .sort((a, b) => parseInt(b.bitrate) - parseInt(a.bitrate));

    if (audioStreams.length === 0) {
      throw new Error('No audio streams found');
    }

    const bestAudio = audioStreams[0];

    // Replace the googlevideo hostname with our proxy/instance hostname
    const originalUrl = new URL(bestAudio.url);
    originalUrl.hostname = 'yt.omada.cafe';
    const modifiedUrl = originalUrl.toString();

    console.log(`Audio URL obtained: ${modifiedUrl}`);
    return modifiedUrl;
  } catch (error) {
    console.error("Stream fetch failed:", error);
    throw error;
  }
};

// Updated backward compatibility function
export const getYouTubeUrl = async (trackName, artistName) => {
  console.log(`Finding YouTube URL for: ${trackName} by ${artistName}`);

  try {
    const searchQuery = `${trackName} ${artistName}`;
    const searchResults = await searchYouTube(searchQuery);

    if (searchResults.length === 0) {
      throw new Error("No matching videos found");
    }

    // Use the direct stream fetcher here as well
    return await getStreamUrl(searchResults[0].id);
  } catch (error) {
    console.error("Error in getYouTubeUrl:", error);
    throw error;
  }
};