DO $$ BEGIN
    CREATE TYPE card_type AS ENUM ('yellow', 'red');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Match Cards table
CREATE TABLE IF NOT EXISTS match_cards (
    id SERIAL PRIMARY KEY,
    match_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    card_type card_type NOT NULL,
    minute INTEGER NOT NULL CHECK (minute >= 0 AND minute <= 120),
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_match_cards_match_id ON match_cards(match_id);
