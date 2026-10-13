// Vercel serverless function: GET /api/spotify
// Env vars (set in Vercel): SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_REFRESH_TOKEN
const API = "https://api.spotify.com/v1";

async function getAccessToken() {
  const { SPOTIFY_CLIENT_ID: id, SPOTIFY_CLIENT_SECRET: secret, SPOTIFY_REFRESH_TOKEN: refresh } = process.env;
  const r = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: "Basic " + Buffer.from(`${id}:${secret}`).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: refresh }),
  });
  if (!r.ok) throw new Error(`token ${r.status}`);
  return (await r.json()).access_token;
}

const track = (t) => ({ title: t.name, artist: t.artists.map((a) => a.name).join(", ") });

module.exports = async (req, res) => {
  try {
    const headers = { Authorization: "Bearer " + (await getAccessToken()) };
    const get = (path) => fetch(API + path, { headers });
    const [np, rp, ta] = await Promise.all([
      get("/me/player/currently-playing"),
      get("/me/player/recently-played?limit=10"),
      get("/me/top/artists?limit=5&time_range=short_term"),
    ]);

    // recently played, de-duplicated
    const recent = [];
    const seen = new Set();
    if (rp.ok) {
      for (const x of (await rp.json()).items || []) {
        if (!seen.has(x.track.id)) { seen.add(x.track.id); recent.push(track(x.track)); }
      }
    }

    // currently playing (204 = nothing playing)
    let now = null;
    if (np.status === 200) {
      const j = await np.json();
      if (j.item && j.currently_playing_type === "track") {
        now = {
          ...track(j.item),
          isPlaying: j.is_playing,
          progress: Math.floor(j.progress_ms / 1000),
          duration: Math.floor(j.item.duration_ms / 1000),
          live: true,
        };
      }
    }
    if (!now && recent[0]) now = { ...recent[0], isPlaying: false, progress: 0, duration: 0, live: false };

    // top artists can be restricted for some apps, so fail soft
    const topArtists = ta.ok ? (await ta.json()).items.map((a) => a.name) : [];

    res.setHeader("Cache-Control", "s-maxage=10, stale-while-revalidate=30");
    res.status(200).json({
      now,
      recent: recent.filter((r) => !now || r.title !== now.title).slice(0, 5),
      topArtists,
    });
  } catch (e) {
    res.status(500).json({ error: "spotify_unavailable" });
  }
};