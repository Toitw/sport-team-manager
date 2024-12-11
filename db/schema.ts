import { pgTable, text, integer, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Define soccer positions enum
export const positionEnum = pgEnum('position_type', ['GK', 'DEF', 'MID', 'FWD']);

export const users = pgTable("users", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  username: text("username").unique().notNull(),
  password: text("password").notNull(),
  role: text("role").notNull().default("reader")
});

export const teams = pgTable("teams", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  createdById: integer("created_by_id").notNull().references(() => users.id)
});

export const players = pgTable("players", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  teamId: integer("team_id").notNull().references(() => teams.id),
  name: text("name").notNull(),
  position: positionEnum("position").notNull(),
  number: integer("number").notNull(),
  photoUrl: text("photo_url"),
  createdAt: timestamp("created_at").defaultNow()
});

// Define event type enum
export const eventTypeEnum = pgEnum('event_type', ['match', 'training', 'other']);

export const events = pgTable("events", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
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

// Zod Schemas
export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = z.infer<typeof selectUserSchema>;

export const insertTeamSchema = createInsertSchema(teams);
export const selectTeamSchema = createSelectSchema(teams);
export type InsertTeam = z.infer<typeof insertTeamSchema>;
export type Team = z.infer<typeof selectTeamSchema>;

export const insertPlayerSchema = createInsertSchema(players);
export const selectPlayerSchema = createSelectSchema(players);
export type InsertPlayer = z.infer<typeof insertPlayerSchema>;
export type Player = z.infer<typeof selectPlayerSchema>;

export const insertEventSchema = createInsertSchema(events);
export const selectEventSchema = createSelectSchema(events);
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Event = z.infer<typeof selectEventSchema>;
