import { pgEnum } from "drizzle-orm/pg-core";

// Define soccer positions enum
export const positionEnum = pgEnum('position_type', ['GK', 'DEF', 'MID', 'FWD']);

// Define match event type enum
export const matchEventTypeEnum = pgEnum("match_event_type", ["goal", "own_goal", "penalty"]);

// Define event type enum
export const eventTypeEnum = pgEnum("event_type", ["training", "match", "meeting"]);

// Define card type enum
export const cardTypeEnum = pgEnum('card_type', ['yellow', 'red']);

export type Event = {
  id: number;
  teamId: number;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string;
  type: "training" | "match" | "meeting";
  homeScore: number | null;
  awayScore: number | null;
  opponent: string | null;
  location: string | null;
  createdAt: string;
};