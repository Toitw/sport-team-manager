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

// All subsequent tables should reference teams which are already organization-scoped
export const players = pgTable("players", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  teamId: integer("team_id").notNull().references(() => teams.id, { onDelete: 'cascade' }),
  name: text("name").notNull(),
  position: positionEnum("position").notNull(),
  number: integer("number").notNull(),
  photoUrl: text("photo_url"),
  createdAt: timestamp("created_at", { mode: 'string' }).defaultNow()
});

export const events = pgTable("events", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  teamId: integer("team_id").notNull().references(() => teams.id, { onDelete: 'cascade' }),
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
  teamId: integer("team_id").notNull().references(() => teams.id, { onDelete: 'cascade' }),
  title: text("title").notNull(),
  content: text("content").notNull(),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
  createdById: integer("created_by_id").notNull().references(() => users.id)
});

// Match-related tables inherit organization scope from events table
export const matchLineups = pgTable("match_lineups", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  matchId: integer("match_id").notNull().references(() => events.id, { onDelete: 'cascade' }),
  playerId: integer("player_id").notNull().references(() => players.id, { onDelete: 'cascade' }),
  position: text("position").notNull(),
  createdAt: timestamp("created_at", { mode: 'string' }).defaultNow()
});

export const matchReserves = pgTable("match_reserves", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  matchId: integer("match_id").notNull().references(() => events.id, { onDelete: 'cascade' }),
  playerId: integer("player_id").notNull().references(() => players.id, { onDelete: 'cascade' }),
  createdAt: timestamp("created_at", { mode: 'string' }).defaultNow()
});

export const matchScorers = pgTable("match_scorers", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  matchId: integer("match_id").notNull().references(() => events.id, { onDelete: 'cascade' }),
  playerId: integer("player_id").notNull().references(() => players.id, { onDelete: 'cascade' }),
  minute: integer("minute").notNull(),
  eventType: matchEventTypeEnum("event_type").notNull().default('goal'),
  createdAt: timestamp("created_at", { mode: 'string' }).defaultNow()
});

export const matchCards = pgTable("match_cards", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  matchId: integer("match_id").notNull().references(() => events.id, { onDelete: 'cascade' }),
  playerId: integer("player_id").notNull().references(() => players.id, { onDelete: 'cascade' }),
  cardType: cardTypeEnum("card_type").notNull(),
  minute: integer("minute").notNull(),
  reason: text("reason"),
  createdAt: timestamp("created_at", { mode: 'string' }).defaultNow()
});

export const matchSubstitutions = pgTable("match_substitutions", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  matchId: integer("match_id").notNull().references(() => events.id, { onDelete: 'cascade' }),
  playerOutId: integer("player_out_id").notNull().references(() => players.id, { onDelete: 'cascade' }),
  playerInId: integer("player_in_id").notNull().references(() => players.id, { onDelete: 'cascade' }),
  minute: integer("minute").notNull(),
  half: integer("half").notNull(),
  createdAt: timestamp("created_at", { mode: 'string' }).defaultNow()
});

export const matchCommentary = pgTable("match_commentary", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  matchId: integer("match_id").notNull().references(() => events.id, { onDelete: 'cascade' }),
  minute: integer("minute").notNull(),
  type: text("type").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { mode: 'string' }).defaultNow()
});

// Schema definitions with improved validation
export const insertUserSchema = createInsertSchema(users, {
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["admin", "manager", "reader"]).optional(),
  emailVerified: z.boolean().optional(),
  verificationToken: z.string().optional(),
  passwordResetToken: z.string().optional(),
  passwordResetExpires: z.string().optional()
});

export const insertOrganizationSchema = createInsertSchema(organizations, {
  name: z.string().min(1, "Organization name is required"),
  createdById: z.number().int().positive()
});

export const insertOrganizationMemberSchema = createInsertSchema(organizationMembers, {
  role: z.enum(["administrator", "manager", "reader"]),
  organizationId: z.number().int().positive(),
  userId: z.number().int().positive()
});

export const insertTeamSchema = createInsertSchema(teams, {
  name: z.string().min(1, "Team name is required"),
  organizationId: z.number().int().positive(),
  createdById: z.number().int().positive()
});

export const insertNewsSchema = createInsertSchema(news, {
    title: z.string().min(1, "News title is required"),
    content: z.string().min(1, "News content is required"),
    teamId: z.number().int().positive(),
    createdById: z.number().int().positive()
});

export const insertPlayerSchema = createInsertSchema(players, {
    name: z.string().min(1, "Player name is required"),
    position: z.enum(['goalie','defender','midfielder','forward']),
    number: z.number().int().positive(),
    teamId: z.number().int().positive()
});

export const insertEventSchema = createInsertSchema(events, {
    title: z.string().min(1, "Event title is required"),
    startDate: z.string(),
    endDate: z.string(),
    type: z.enum(['match','training','other']),
    teamId: z.number().int().positive()
});

export const insertMatchLineupSchema = createInsertSchema(matchLineups, {
    matchId: z.number().int().positive(),
    playerId: z.number().int().positive(),
    position: z.string().min(1, "Position is required")
});

export const insertMatchReserveSchema = createInsertSchema(matchReserves, {
    matchId: z.number().int().positive(),
    playerId: z.number().int().positive()
});

export const insertMatchScorerSchema = createInsertSchema(matchScorers, {
    matchId: z.number().int().positive(),
    playerId: z.number().int().positive(),
    minute: z.number().int().positive(),
    eventType: z.enum(['goal','assist','own_goal'])
});

export const insertMatchCardSchema = createInsertSchema(matchCards, {
    matchId: z.number().int().positive(),
    playerId: z.number().int().positive(),
    cardType: z.enum(['yellow','red','yellow_red']),
    minute: z.number().int().positive()
});

export const insertMatchSubstitutionSchema = createInsertSchema(matchSubstitutions, {
    matchId: z.number().int().positive(),
    playerOutId: z.number().int().positive(),
    playerInId: z.number().int().positive(),
    minute: z.number().int().positive(),
    half: z.number().int().positive()
});

export const insertMatchCommentarySchema = createInsertSchema(matchCommentary, {
    matchId: z.number().int().positive(),
    minute: z.number().int().positive(),
    type: z.string().min(1, "Commentary type is required"),
    content: z.string().min(1, "Commentary content is required")
});

// Export types
export type User = z.infer<typeof selectUserSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Organization = z.infer<typeof selectOrganizationSchema>;
export type InsertOrganization = z.infer<typeof insertOrganizationSchema>;
export type OrganizationMember = z.infer<typeof selectOrganizationMemberSchema>;
export type InsertOrganizationMember = z.infer<typeof insertOrganizationMemberSchema>;
export type Team = z.infer<typeof selectTeamSchema>;
export type InsertTeam = z.infer<typeof insertTeamSchema>;
export type News = z.infer<typeof selectNewsSchema>;
export type InsertNews = z.infer<typeof insertNewsSchema>;
export type Player = z.infer<typeof selectPlayerSchema>;
export type InsertPlayer = z.infer<typeof insertPlayerSchema>;
export type Event = z.infer<typeof selectEventSchema>;
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type MatchLineup = z.infer<typeof selectMatchLineupSchema>;
export type InsertMatchLineup = z.infer<typeof insertMatchLineupSchema>;
export type MatchReserve = z.infer<typeof selectMatchReserveSchema>;
export type InsertMatchReserve = z.infer<typeof insertMatchReserveSchema>;
export type MatchScorer = z.infer<typeof selectMatchScorerSchema>;
export type InsertMatchScorer = z.infer<typeof insertMatchScorerSchema>;
export type MatchCard = z.infer<typeof selectMatchCardSchema>;
export type InsertMatchCard = z.infer<typeof insertMatchCardSchema>;
export type MatchSubstitution = z.infer<typeof selectMatchSubstitutionSchema>;
export type InsertMatchSubstitution = z.infer<typeof insertMatchSubstitutionSchema>;
export type MatchCommentary = z.infer<typeof selectMatchCommentarySchema>;
export type InsertMatchCommentary = z.infer<typeof insertMatchCommentarySchema>;

// Create select schemas
export const selectUserSchema = createSelectSchema(users);
export const selectOrganizationSchema = createSelectSchema(organizations);
export const selectOrganizationMemberSchema = createSelectSchema(organizationMembers);
export const selectTeamSchema = createSelectSchema(teams);
export const selectNewsSchema = createSelectSchema(news);
export const selectPlayerSchema = createSelectSchema(players);
export const selectEventSchema = createSelectSchema(events);
export const selectMatchLineupSchema = createSelectSchema(matchLineups);
export const selectMatchReserveSchema = createSelectSchema(matchReserves);
export const selectMatchScorerSchema = createSelectSchema(matchScorers);
export const selectMatchCardSchema = createSelectSchema(matchCards);
export const selectMatchSubstitutionSchema = createSelectSchema(matchSubstitutions);
export const selectMatchCommentarySchema = createSelectSchema(matchCommentary);