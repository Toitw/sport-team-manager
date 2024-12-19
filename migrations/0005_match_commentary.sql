-- Match Commentary table
CREATE TABLE IF NOT EXISTS match_commentary (
    id SERIAL PRIMARY KEY,
    match_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    minute INTEGER NOT NULL CHECK (minute >= 0 AND minute <= 120),
    type TEXT NOT NULL CHECK (type IN ('highlight', 'commentary')),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_match_commentary_match_id ON match_commentary(match_id);
