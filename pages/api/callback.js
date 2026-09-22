import { google } from 'googleapis';

export default async function handler(req, res) {
  try {
    const { code } = req.query;

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.REDIRECT_URI
    );

    const { tokens } = await oauth2Client.getToken(code);
    const opts = 'Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000';

    res.setHeader('Set-Cookie', [
      `yt_access=${tokens.access_token}; ${opts}`,
      `yt_refresh=${tokens.refresh_token || ''}; ${opts}`,
      `yt_expiry=${tokens.expiry_date || ''}; ${opts}`
    ]);

    res.redirect('/');
  } catch (err) {
    console.error('Callback error:', err);
    res.redirect('/?error=1');
  }
}
