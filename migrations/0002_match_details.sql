DO $$ BEGIN
    CREATE TYPE match_event_type AS ENUM ('goal', 'own_goal', 'penalty');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Match Lineups table
CREATE TABLE IF NOT EXISTS match_lineups (
    id SERIAL PRIMARY KEY,
    match_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    position VARCHAR(3) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(match_id, player_id)
);

-- Match Reserves table
CREATE TABLE IF NOT EXISTS match_reserves (
    id SERIAL PRIMARY KEY,
    match_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(match_id, player_id)
);

-- Match Scorers table
CREATE TABLE IF NOT EXISTS match_scorers (
    id SERIAL PRIMARY KEY,
    match_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    minute INTEGER NOT NULL CHECK (minute >= 0 AND minute <= 120),
    event_type match_event_type NOT NULL DEFAULT 'goal',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_match_lineups_match_id ON match_lineups(match_id);
CREATE INDEX IF NOT EXISTS idx_match_reserves_match_id ON match_reserves(match_id);
CREATE INDEX IF NOT EXISTS idx_match_scorers_match_id ON match_scorers(match_id);
