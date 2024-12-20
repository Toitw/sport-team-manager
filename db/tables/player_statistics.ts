import { pgTable, integer } from "drizzle-orm/pg-core";
import { players } from "./players";

export const playerStatistics = pgTable("player_statistics", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  playerId: integer("player_id").notNull().references(() => players.id),
  gamesPlayed: integer("games_played").notNull().default(0),
  goals: integer("goals").notNull().default(0),
  yellowCards: integer("yellow_cards").notNull().default(0),
  redCards: integer("red_cards").notNull().default(0),
  seasonYear: integer("season_year").notNull()
});
