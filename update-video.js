import { google } from 'googleapis';

function parseCookies(req) {
  const out = {};
  (req.headers.cookie || '').split(';').forEach(c => {
    const [k, ...v] = c.split('=');
    if (k) out[k.trim()] = decodeURIComponent(v.join('=').trim());
  });
  return out;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const cookies = parseCookies(req);
  const { videoId, langCode, title, description } = req.body;

  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.REDIRECT_URI
    );

    oauth2Client.setCredentials({
      access_token: cookies.yt_access,
      refresh_token: cookies.yt_refresh
    });

    const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

    // Get current video data
    const videoData = await youtube.videos.list({
      part: ['snippet', 'localizations'],
      id: [videoId]
    });

    const video = videoData.data.items[0];
    const snippet = video.snippet;
    const currentLocalizations = video.localizations || {};

    // Build update parts
    const parts = ['localizations'];
    const requestBody = {
      id: videoId,
      localizations: {
        ...currentLocalizations,
        [langCode]: { title, description }
      }
    };

    // Set defaultLanguage if not set
    if (!snippet.defaultLanguage) {
      parts.push('snippet');
      requestBody.snippet = { ...snippet, defaultLanguage: 'pt' };
    }

    await youtube.videos.update({ part: parts, requestBody });

    res.json({ success: true });
  } catch (err) {
    console.error('Update error:', err.message);
    res.status(500).json({ error: err.message });
  }
}
