import { pgTable, text, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { positionEnum, matchEventTypeEnum, eventTypeEnum, cardTypeEnum } from "./types";

export const users = pgTable("users", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  email: text("email").unique().notNull(),
  password: text("password").notNull(),
  role: text("role").notNull().default("reader"),
  emailVerified: boolean("email_verified").default(false),
  verificationToken: text("verification_token"),
  passwordResetToken: text("password_reset_token"),
  passwordResetExpires: timestamp("password_reset_expires", { mode: 'string' })
});

export const organizations = pgTable("organizations", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").unique().notNull(),
  createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
  createdById: integer("created_by_id").notNull().references(() => users.id)
});

export const organizationMembers = pgTable("organization_members", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  organizationId: integer("organization_id").notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  role: text("role").notNull(),
  createdAt: timestamp("created_at", { mode: 'string' }).defaultNow()
});

export const teams = pgTable("teams", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  organizationId: integer("organization_id").notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
  createdById: integer("created_by_id").notNull().references(() => users.id)
});

export const players = pgTable("players", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  teamId: integer("team_id").notNull().references(() => teams.id),
  name: text("name").notNull(),
  position: positionEnum("position").notNull(),
  number: integer("number").notNull(),
  photoUrl: text("photo_url"),
  createdAt: timestamp("created_at", { mode: 'string' }).defaultNow()
});

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

export const news = pgTable("news", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  teamId: integer("team_id").notNull().references(() => teams.id),
  title: text("title").notNull(),
  content: text("content").notNull(),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
  createdById: integer("created_by_id").notNull().references(() => users.id)
});

export const matchLineups = pgTable("match_lineups", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  matchId: integer("match_id").notNull().references(() => events.id),
  playerId: integer("player_id").notNull().references(() => players.id),
  position: text("position").notNull(),
  createdAt: timestamp("created_at", { mode: 'string' }).defaultNow()
});

export const matchReserves = pgTable("match_reserves", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  matchId: integer("match_id").notNull().references(() => events.id),
  playerId: integer("player_id").notNull().references(() => players.id),
  createdAt: timestamp("created_at", { mode: 'string' }).defaultNow()
});

export const matchScorers = pgTable("match_scorers", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  matchId: integer("match_id").notNull().references(() => events.id),
  playerId: integer("player_id").notNull().references(() => players.id),
  minute: integer("minute").notNull(),
  eventType: matchEventTypeEnum("event_type").notNull().default('goal'),
  createdAt: timestamp("created_at", { mode: 'string' }).defaultNow()
});

export const matchCards = pgTable("match_cards", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  matchId: integer("match_id").notNull().references(() => events.id),
  playerId: integer("player_id").notNull().references(() => players.id),
  cardType: cardTypeEnum("card_type").notNull(),
  minute: integer("minute").notNull(),
  reason: text("reason"),
  createdAt: timestamp("created_at", { mode: 'string' }).defaultNow()
});

export const matchSubstitutions = pgTable("match_substitutions", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  matchId: integer("match_id").notNull().references(() => events.id),
  playerOutId: integer("player_out_id").notNull().references(() => players.id),
  playerInId: integer("player_in_id").notNull().references(() => players.id),
  minute: integer("minute").notNull(),
  half: integer("half").notNull(),
  createdAt: timestamp("created_at", { mode: 'string' }).defaultNow()
});

export const matchCommentary = pgTable("match_commentary", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  matchId: integer("match_id").notNull().references(() => events.id),
  minute: integer("minute").notNull(),
  type: text("type").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { mode: 'string' }).defaultNow()
});

export const insertUserSchema = createInsertSchema(users, {
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["admin", "manager", "reader"]).optional(),
  emailVerified: z.boolean().optional(),
  verificationToken: z.string().optional(),
  passwordResetToken: z.string().optional(),
  passwordResetExpires: z.string().optional()
});
export const selectUserSchema = createSelectSchema(users);
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = z.infer<typeof selectUserSchema>;

export const insertOrganizationSchema = createInsertSchema(organizations);
export const selectOrganizationSchema = createSelectSchema(organizations);
export type InsertOrganization = z.infer<typeof insertOrganizationSchema>;
export type Organization = z.infer<typeof selectOrganizationSchema>;

export const insertOrganizationMemberSchema = createInsertSchema(organizationMembers, {
  role: z.enum(["administrator", "manager", "reader"])
});
export const selectOrganizationMemberSchema = createSelectSchema(organizationMembers);
export type InsertOrganizationMember = z.infer<typeof insertOrganizationMemberSchema>;
export type OrganizationMember = z.infer<typeof selectOrganizationMemberSchema>;

export const insertTeamSchema = createInsertSchema(teams);
export const selectTeamSchema = createSelectSchema(teams);
export type InsertTeam = z.infer<typeof insertTeamSchema>;
export type Team = z.infer<typeof selectTeamSchema>;

export const insertNewsSchema = createInsertSchema(news);
export const selectNewsSchema = createSelectSchema(news);
export type InsertNews = z.infer<typeof insertNewsSchema>;
export type News = z.infer<typeof selectNewsSchema>;

export const insertPlayerSchema = createInsertSchema(players);
export const selectPlayerSchema = createSelectSchema(players);
export type InsertPlayer = z.infer<typeof insertPlayerSchema>;
export type Player = z.infer<typeof selectPlayerSchema>;

export const insertEventSchema = createInsertSchema(events);
export const selectEventSchema = createSelectSchema(events);
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Event = z.infer<typeof selectEventSchema>;

export const insertMatchLineupSchema = createInsertSchema(matchLineups);
export const selectMatchLineupSchema = createSelectSchema(matchLineups);
export type InsertMatchLineup = z.infer<typeof insertMatchLineupSchema>;
export type MatchLineup = z.infer<typeof selectMatchLineupSchema>;

export const insertMatchReserveSchema = createInsertSchema(matchReserves);
export const selectMatchReserveSchema = createSelectSchema(matchReserves);
export type InsertMatchReserve = z.infer<typeof insertMatchReserveSchema>;
export type MatchReserve = z.infer<typeof selectMatchReserveSchema>;

export const insertMatchScorerSchema = createInsertSchema(matchScorers);
export const selectMatchScorerSchema = createSelectSchema(matchScorers);
export type InsertMatchScorer = z.infer<typeof insertMatchScorerSchema>;
export type MatchScorer = z.infer<typeof selectMatchScorerSchema>;

export const insertMatchCardSchema = createInsertSchema(matchCards);
export const selectMatchCardSchema = createSelectSchema(matchCards);
export type InsertMatchCard = z.infer<typeof insertMatchCardSchema>;
export type MatchCard = z.infer<typeof selectMatchCardSchema>;

export const insertMatchSubstitutionSchema = createInsertSchema(matchSubstitutions);
export const selectMatchSubstitutionSchema = createSelectSchema(matchSubstitutions);
export type InsertMatchSubstitution = z.infer<typeof insertMatchSubstitutionSchema>;
export type MatchSubstitution = z.infer<typeof selectMatchSubstitutionSchema>;

export const insertMatchCommentarySchema = createInsertSchema(matchCommentary);
export const selectMatchCommentarySchema = createSelectSchema(matchCommentary);
export type InsertMatchCommentary = z.infer<typeof insertMatchCommentarySchema>;
export type MatchCommentary = z.infer<typeof selectMatchCommentarySchema>;