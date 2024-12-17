import { pgEnum } from "drizzle-orm/pg-core";

// Define soccer positions enum
export const positionEnum = pgEnum('position_type', ['GK', 'DEF', 'MID', 'FWD']);

// Define match event type enum
export const matchEventTypeEnum = pgEnum("match_event_type", ["goal", "own_goal", "penalty"]);

// Define event type enum
export const eventTypeEnum = pgEnum('event_type', ['match', 'training', 'other']);
