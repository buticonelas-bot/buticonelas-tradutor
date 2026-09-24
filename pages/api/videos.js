import { google } from 'googleapis';

function parseCookies(req) {
  const out = {};
  (req.headers.cookie || '').split(';').forEach(c => {
    const [k, ...v] = c.split('=');
    if (k) out[k.trim()] = decodeURIComponent(v.join('=').trim());
  });
  return out;
}

function parseDuration(iso) {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return 9999;
  return (parseInt(m[1] || 0) * 3600) + (parseInt(m[2] || 0) * 60) + parseInt(m[3] || 0);
}

function getVideoType(video) {
  const live = video.snippet?.liveBroadcastContent;
  if (live === 'live' || live === 'upcoming') return 'live';
  if (live === 'completed') return 'live';
  const secs = parseDuration(video.contentDetails?.duration || 'PT0S');
  if (secs <= 60) return 'short';
  return 'video';
}

export default async function handler(req, res) {
  const cookies = parseCookies(req);
  if (!cookies.yt_access && !cookies.yt_refresh) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.REDIRECT_URI
    );
    oauth2Client.setCredentials({
      access_token: cookies.yt_access,
      refresh_token: cookies.yt_refresh,
      expiry_date: cookies.yt_expiry ? parseInt(cookies.yt_expiry) : undefined
    });
    oauth2Client.on('tokens', tokens => {
      if (tokens.access_token) {
        const opts = 'Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000';
        res.setHeader('Set-Cookie', [
          `yt_access=${tokens.access_token}; ${opts}`,
          `yt_expiry=${tokens.expiry_date || ''}; ${opts}`
        ]);
      }
    });

    const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

    // Get all channels
    const channelsResp = await youtube.channels.list({
      part: ['snippet', 'contentDetails'],
      mine: true,
      maxResults: 50
    });

    const channels = channelsResp.data.items || [];
    const allVideoIds = [];
    const channelMap = {};

    for (const channel of channels) {
      const uploadsId = channel.contentDetails?.relatedPlaylists?.uploads;
      if (!uploadsId) continue;

      const playlistResp = await youtube.playlistItems.list({
        part: ['contentDetails', 'snippet'],
        playlistId: uploadsId,
        maxResults: 50
      });

      for (const item of playlistResp.data.items || []) {
        const vid = item.contentDetails.videoId;
        allVideoIds.push(vid);
        channelMap[vid] = channel.snippet.title;
      }
    }

    if (allVideoIds.length === 0) {
      return res.json({ videos: [] });
    }

    // Fetch full video details in batches of 50
    const allVideos = [];
    for (let i = 0; i < allVideoIds.length; i += 50) {
      const batch = allVideoIds.slice(i, i + 50);
      const videosResp = await youtube.videos.list({
        part: ['snippet', 'status', 'contentDetails'],
        id: batch
      });

      for (const video of videosResp.data.items || []) {
        // Only public videos
        if (video.status?.privacyStatus !== 'public') continue;

        allVideos.push({
          id: { videoId: video.id },
          snippet: {
            title: video.snippet.title,
            description: video.snippet.description || '',
            publishedAt: video.snippet.publishedAt,
            channelTitle: channelMap[video.id] || video.snippet.channelTitle,
            thumbnails: video.snippet.thumbnails,
            liveBroadcastContent: video.snippet.liveBroadcastContent
          },
          type: getVideoType(video)
        });
      }
    }

    // Sort newest first
    allVideos.sort((a, b) =>
      new Date(b.snippet.publishedAt) - new Date(a.snippet.publishedAt)
    );

    res.json({ videos: allVideos });
  } catch (err) {
    console.error('Videos error:', err.message);
    if (err.code === 401) return res.status(401).json({ error: 'Token expired' });
    res.status(500).json({ error: err.message });
  }
}
