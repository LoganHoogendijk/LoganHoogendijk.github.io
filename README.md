# Logan Hoogendijk's Portfolio

Personal portfolio site: **https://loganhooegndijk.com**

Static HTML/CSS/JS frontend with a small Vercel serverless function (`/api/spotify`) that powers the "now playing" widget.

## Setup

Set these environment variables in Vercel (Production and Preview), then redeploy:

- `SPOTIFY_CLIENT_ID`
- `SPOTIFY_CLIENT_SECRET`
- `SPOTIFY_REFRESH_TOKEN`

Requires Node 18+ (uses the built-in `fetch`).
