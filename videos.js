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

    // Auto-refresh token if needed
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

    const response = await youtube.search.list({
      part: ['snippet'],
      forMine: true,
      type: ['video'],
      maxResults: 25,
      order: 'date'
    });

    res.json({ videos: response.data.items || [] });
  } catch (err) {
    console.error('Videos error:', err);
    if (err.code === 401) return res.status(401).json({ error: 'Token expired' });
    res.status(500).json({ error: 'Failed to fetch videos' });
  }
}
