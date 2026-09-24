export default function handler(req, res) {
  const clear = 'Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT';
  res.setHeader('Set-Cookie', [
    `yt_access=; ${clear}`,
    `yt_refresh=; ${clear}`,
    `yt_expiry=; ${clear}`
  ]);
  res.redirect('/');
}
