import { type Express } from "express";
import { setupAuth } from "./auth";
import { db } from "../db";
import { teams, players, events } from "@db/schema";
import { eq } from "drizzle-orm";

function requireAuth(req: any, res: any, next: any) {
  if (!req.isAuthenticated()) {
    return res.status(401).send("Unauthorized");
  }
  next();
}

function requireRole(roles: string[]) {
  return (req: any, res: any, next: any) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Unauthorized");
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).send("Forbidden");
    }
    next();
  };
}

export function registerRoutes(app: Express) {
  setupAuth(app);

  // Teams
  app.get("/api/teams", requireAuth, async (req, res) => {
    const allTeams = await db.select().from(teams);
    res.json(allTeams);
  });

  app.post("/api/teams", requireRole(["admin"]), async (req, res) => {
    if (!req.user) {
      return res.status(401).send("User not authenticated");
    }
    const newTeam = await db.insert(teams).values({
      ...req.body,
      createdById: req.user.id
    }).returning();
    res.json(newTeam[0]);
  });

  // Players
  app.get("/api/teams/:teamId/players", requireAuth, async (req, res) => {
    const teamPlayers = await db.select().from(players)
      .where(eq(players.teamId, parseInt(req.params.teamId)));
    res.json(teamPlayers);
  });

  app.post("/api/teams/:teamId/players", requireRole(["admin", "editor"]), async (req, res) => {
    const newPlayer = await db.insert(players).values({
      ...req.body,
      teamId: parseInt(req.params.teamId)
    }).returning();
    res.json(newPlayer[0]);
  });

  // Events
  app.get("/api/teams/:teamId/events", requireAuth, async (req, res) => {
    const teamEvents = await db.select().from(events)
      .where(eq(events.teamId, parseInt(req.params.teamId)));
    res.json(teamEvents);
  });

  app.post("/api/teams/:teamId/events", requireRole(["admin", "editor"]), async (req, res) => {
    const newEvent = await db.insert(events).values({
      ...req.body,
      teamId: parseInt(req.params.teamId)
    }).returning();
    res.json(newEvent[0]);
  });
}
