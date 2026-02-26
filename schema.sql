CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,           -- Spotify user ID
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at INTEGER NOT NULL,   -- UNIX timestamp
  api_key TEXT NOT NULL,         -- Secure token used in /add
  default_playlist TEXT,         -- User-configurable default playlist for matches
  uncertain_playlist TEXT,       -- User-configurable playlist for low-similarity matches
  similarity_threshold REAL DEFAULT 0.6 -- Threshold for deciding uncertain matches
);
