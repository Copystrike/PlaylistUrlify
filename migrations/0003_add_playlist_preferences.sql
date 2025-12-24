-- Migration number: 0003 	 2025-12-24T16:14:23.000Z
ALTER TABLE users ADD COLUMN default_playlist TEXT;
ALTER TABLE users ADD COLUMN uncertain_playlist TEXT;
ALTER TABLE users ADD COLUMN similarity_threshold REAL DEFAULT 0.6;
