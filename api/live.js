// Vercel serverless function: GET /api/live?channel=@handle  (or a UC… channel ID)
// Checks whether the YouTube channel is live right now and returns the live video id.
module.exports = async (req, res) => {
  const q = String(req.query.channel || '');
  let path;
  if (/^UC[\w-]{22}$/.test(q)) path = 'channel/' + q;
  else if (/^@[\w.-]{3,30}$/.test(q)) path = q;
  else return res.status(400).json({ error: 'bad channel' });
  try {
    const r = await fetch(`https://www.youtube.com/${path}/live`, {
      headers: { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36', 'accept-language': 'en-US,en;q=0.9', cookie: 'CONSENT=YES+1' }
    });
    const h = await r.text();
    const live = /"isLiveNow":true/.test(h);
    const v = h.match(/<link rel="canonical" href="https:\/\/www\.youtube\.com\/watch\?v=([\w-]{11})"/);
    const t = h.match(/<meta name="title" content="([^"]*)"/);
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');
    res.status(200).json({ live: live && !!v, videoId: live && v ? v[1] : null, title: live && t ? t[1] : null });
  } catch (e) {
    res.status(200).json({ live: false, error: true });
  }
};
