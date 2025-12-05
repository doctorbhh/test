const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch'); // npm install node-fetch@2
const ytdlp = require('yt-dlp-exec'); // npm install yt-dlp-exec

const app = express();
const port = 3001;

// The requested Invidious instance
const INVIDIOUS_API = 'https://yt.omada.cafe';

app.use(cors({
  origin: 'http://localhost:8080',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Range'],
  credentials: true,
}));

app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Scrape endpoint
app.get('/scrape', async (req, res) => {
  const { videoId } = req.query;
  if (!videoId) {
    return res.status(400).json({ error: 'Missing videoId' });
  }

  // 1. Try Invidious API (yt.omada.cafe)
  try {
    console.log(`Fetching stream data from ${INVIDIOUS_API} for ${videoId}...`);
    const invidiousResponse = await fetch(`${INVIDIOUS_API}/api/v1/videos/${videoId}`);

    if (invidiousResponse.ok) {
      const data = await invidiousResponse.json();

      // Logic to parse the specific JSON format provided
      if (data && data.adaptiveFormats) {
        // Filter for audio streams (type starts with "audio")
        const audioStreams = data.adaptiveFormats
          .filter(format => format.type && format.type.startsWith('audio'))
          .map(v => ({
            bitrate: parseInt(v.bitrate), // Convert string bitrate to number for sorting
            url: v.url,
            type: v.type
          }));

        if (audioStreams.length > 0) {
          // Sort by bitrate descending to get best quality
          const bestAudio = audioStreams.sort((a, b) => b.bitrate - a.bitrate)[0];

          if (bestAudio && bestAudio.url) {
            console.log(`Found audio stream: ${bestAudio.bitrate} bps`);

            // --- URL REPLACEMENT LOGIC ---
            // Create a URL object to easily manipulate the host
            const originalStreamUrl = new URL(bestAudio.url);

            // Replaces "rr1---sn-j85aaxt-jv0s.googlevideo.com" (or similar) with "yt.omada.cafe"
            originalStreamUrl.hostname = 'yt.omada.cafe';

            // Convert back to string
            const modifiedUrl = originalStreamUrl.toString();
            console.log(`Modified URL host to: ${modifiedUrl}`);

            // Pass this modified URL to the local proxy
            const proxiedUrl = `http://localhost:${port}/proxy?url=${encodeURIComponent(modifiedUrl)}`;
            return res.json({ url: proxiedUrl });
          }
        }
      }
    } else {
      console.warn(`Invidious API returned status: ${invidiousResponse.status}`);
    }
  } catch (error) {
    console.error('Invidious API error:', error.message);
    // Continue to fallback
  }

  // 2. Fallback to yt-dlp (Original Implementation)
  console.log('Falling back to yt-dlp...');
  try {
    const url = `https://www.youtube.com/watch?v=${videoId}`;
    const streamUrl = await ytdlp(url, {
      getUrl: true,
      format: 'bestaudio/best',
      noWarnings: true,
      noCallHome: true,
      noCheckCertificate: true,
    });

    const trimmedUrl = streamUrl.trim();
    console.log(`Scraped URL via yt-dlp for ${videoId}`);

    const proxiedUrl = `http://localhost:${port}/proxy?url=${encodeURIComponent(trimmedUrl)}`;
    res.json({ url: proxiedUrl });
  } catch (error) {
    console.error('yt-dlp error:', error.message);
    res.status(500).json({ error: 'Failed to scrape YouTube via Invidious or yt-dlp' });
  }
});

// Proxy endpoint with URL rewriting for .m3u8 playlists
app.get('/proxy', async (req, res) => {
  const { url } = req.query;
  if (!url) {
    return res.status(400).send('Missing url parameter');
  }

  try {
    const headers = {};
    if (req.headers.range) {
      headers['Range'] = req.headers.range;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      console.error(`Fetch failed for ${url}: ${response.status} ${response.statusText}`);
      return res.status(response.status).send(`Failed to fetch stream: ${response.statusText}`);
    }

    const contentType = response.headers.get('Content-Type') || 'application/vnd.apple.mpegurl';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Range, Content-Length');

    if (response.headers.get('Content-Length')) {
      res.setHeader('Content-Length', response.headers.get('Content-Length'));
    }
    if (response.headers.get('Content-Range')) {
      res.setHeader('Content-Range', response.headers.get('Content-Range'));
    }
    if (req.headers.range) {
      res.status(206); // Partial Content
    }

    // Check if this is an .m3u8 playlist
    if (contentType.includes('mpegurl') || url.endsWith('.m3u8')) {
      // Read the playlist content
      const playlistText = await response.text();

      // Rewrite absolute URLs to use the proxy
      const baseProxyUrl = `http://localhost:${port}/proxy?url=`;
      const rewrittenPlaylist = playlistText.replace(
        /(https?:\/\/[^\s]+)/g,
        (match) => `${baseProxyUrl}${encodeURIComponent(match)}`
      );

      console.log(`Rewritten .m3u8 playlist for ${url}`);
      res.send(rewrittenPlaylist);
    } else {
      // For segments (.ts files) or other content, pipe directly
      console.log(`Proxying ${url} with Content-Type: ${contentType}`);
      response.body.pipe(res);

      response.body.on('error', (err) => {
        console.error(`Stream error for ${url}:`, err);
        res.status(500).end();
      });
    }

  } catch (error) {
    console.error('Proxy error:', error.message);
    res.status(500).send('Proxy failed');
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});