-- Match Substitutions table
CREATE TABLE IF NOT EXISTS match_substitutions (
    id SERIAL PRIMARY KEY,
    match_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    player_out_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    player_in_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    minute INTEGER NOT NULL CHECK (minute >= 0 AND minute <= 120),
    half SMALLINT NOT NULL CHECK (half IN (1, 2)),  -- 1 for first half, 2 for second half
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_match_substitutions_match_id ON match_substitutions(match_id);
