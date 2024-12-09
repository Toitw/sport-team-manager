DO $$ BEGIN
    CREATE TYPE event_type AS ENUM ('match', 'training', 'other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

ALTER TABLE IF EXISTS events
ALTER COLUMN type TYPE event_type USING type::event_type,
ALTER COLUMN start_date TYPE timestamp with time zone,
ALTER COLUMN end_date TYPE timestamp with time zone;
