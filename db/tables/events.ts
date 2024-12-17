import { pgTable, text, integer, timestamp } from "drizzle-orm/pg-core";
import { teams } from "../schema";
import { eventTypeEnum } from "../types";

export const events = pgTable("events", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  teamId: integer("team_id").notNull().references(() => teams.id),
  title: text("title").notNull(),
  description: text("description"),
  startDate: timestamp("start_date", { mode: 'string' }).notNull(),
  endDate: timestamp("end_date", { mode: 'string' }).notNull(),
  type: eventTypeEnum("type").notNull(),
  homeScore: integer("home_score"),
  awayScore: integer("away_score"),
  createdAt: timestamp("created_at", { mode: 'string' }).defaultNow()
});
