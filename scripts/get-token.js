// One-time local helper to get your Spotify refresh token. Needs Node 18+.
const http = require("http");
const { SPOTIFY_CLIENT_ID: id, SPOTIFY_CLIENT_SECRET: secret } = process.env;
if (!id || !secret) { console.error("Set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET first."); process.exit(1); }

const redirect = "http://127.0.0.1:8888/callback";
const state = Math.random().toString(36).slice(2);
const scope = "user-read-currently-playing user-read-recently-played user-top-read";

console.log("\nOpen this URL in your browser:\n\nhttps://accounts.spotify.com/authorize?" +
  new URLSearchParams({ response_type: "code", client_id: id, scope, redirect_uri: redirect, state }) + "\n");

http.createServer(async (req, res) => {
  const u = new URL(req.url, redirect);
  if (u.pathname !== "/callback") return res.end();
  if (u.searchParams.get("state") !== state) return res.end("State mismatch, try again.");
  const r = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: "Basic " + Buffer.from(`${id}:${secret}`).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ grant_type: "authorization_code", code: u.searchParams.get("code"), redirect_uri: redirect }),
  });
  const j = await r.json();
  res.end(j.refresh_token ? "Done! Check your terminal." : "Failed: " + JSON.stringify(j));
  console.log(j.refresh_token ? "\nSPOTIFY_REFRESH_TOKEN=" + j.refresh_token + "\n" : j);
  setTimeout(() => process.exit(0), 300);
}).listen(8888, "127.0.0.1");