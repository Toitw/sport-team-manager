import { pgTable, text, integer, timestamp } from "drizzle-orm/pg-core";
import { teams } from "../schema";
import { positionEnum } from "../types";

export const players = pgTable("players", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  teamId: integer("team_id").notNull().references(() => teams.id),
  name: text("name").notNull(),
  position: positionEnum("position").notNull(),
  number: integer("number").notNull(),
  photoUrl: text("photo_url"),
  createdAt: timestamp("created_at", { mode: 'string' }).defaultNow()
});
