import express, { type Express } from "express";
import { setupAuth } from "./auth";
import { db } from "../db";
import { teams, players, events, news } from "@db/schema";
import { eq, sql } from "drizzle-orm";
import multer from "multer";
import path from "path";
import fs from "fs";

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
  // Set up authentication first
  setupAuth(app);

  // Create uploads directory if it doesn't exist
  const uploadsDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)){
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Serve uploaded files statically
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  // Configure multer after authentication is set up
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, uploadsDir)
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
      cb(null, uniqueSuffix + path.extname(file.originalname))
    }
  });

  const upload = multer({ 
    storage: storage,
    limits: {
      fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: (req, file, cb) => {
      // Accept all common image formats
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(null, false);
        cb(new Error('Only image files are allowed'));
      }
    }
  });

  // File upload endpoint
  app.post('/api/upload', requireAuth, (req, res) => {
    upload.single('photo')(req, res, (err) => {
      if (err) {
        console.error('File upload error:', err);
        return res.status(400).json({ 
          error: err.message || 'Error uploading file',
          details: err
        });
      }

      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const photoUrl = `/uploads/${req.file.filename}`;
      res.json({ photoUrl });
    });
  });

  // Teams
  app.get("/api/teams", requireAuth, async (req, res) => {
    const allTeams = await db.select().from(teams);
    res.json(allTeams);
  });

  app.post("/api/teams", requireRole(["admin"]), async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).send("User not authenticated");
      }
      
      const newTeam = await db.insert(teams).values({
        name: req.body.name,
        createdById: req.user.id
      }).returning();
      
      res.json(newTeam[0]);
    } catch (error: any) {
      console.error('Error creating team:', error);
      res.status(500).send(error.message || "Failed to create team");
    }
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
  app.put("/api/teams/:teamId/players/:playerId", requireRole(["admin", "editor"]), async (req, res) => {
    try {
      const updatedPlayer = await db.update(players)
        .set({
          ...req.body,
          teamId: parseInt(req.params.teamId)
        })
        .where(eq(players.id, parseInt(req.params.playerId)))
        .returning();

      if (!updatedPlayer.length) {
        return res.status(404).json({ message: "Player not found" });
      }

      res.json(updatedPlayer[0]);
    } catch (error: any) {
      console.error('Error updating player:', error);
      res.status(500).json({ message: error.message || "Failed to update player" });
    }
  });

  app.delete("/api/teams/:teamId/players/:playerId", requireRole(["admin", "editor"]), async (req, res) => {
    try {
      const deleted = await db.delete(players)
        .where(eq(players.id, parseInt(req.params.playerId)))
        .returning();

      if (!deleted.length) {
        return res.status(404).json({ message: "Player not found" });
      }

      res.json({ message: "Player deleted successfully" });
    } catch (error: any) {
      console.error('Error deleting player:', error);
      res.status(500).json({ message: error.message || "Failed to delete player" });
    }
  });

  // Events
  app.get("/api/teams/:teamId/events", requireAuth, async (req, res) => {
    const teamEvents = await db.select().from(events)
      .where(eq(events.teamId, parseInt(req.params.teamId)));
    res.json(teamEvents);
  });

  app.post("/api/teams/:teamId/events", requireRole(["admin", "editor"]), async (req, res) => {
    try {
      const { startDate, endDate, ...rest } = req.body;
      
      // Validate dates
      const startDateObj = new Date(startDate);
      const endDateObj = new Date(endDate);
      
      if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
        return res.status(400).json({ message: "Invalid date format" });
      }

      const newEvent = await db.insert(events).values({
        ...rest,
        teamId: parseInt(req.params.teamId),
        startDate: startDateObj.toISOString(),
        endDate: endDateObj.toISOString(),
        type: rest.type
      }).returning();

      res.json(newEvent[0]);
    } catch (error: any) {
      console.error('Error creating event:', error);
      res.status(500).json({ message: error.message || "Failed to create event" });
    }
  });

  // Update event
  app.put("/api/teams/:teamId/events/:eventId", requireRole(["admin", "editor"]), async (req, res) => {
    try {
      const { startDate, endDate, ...rest } = req.body;
      
      // Validate dates
      const startDateObj = new Date(startDate);
      const endDateObj = new Date(endDate);
      
      if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
        return res.status(400).json({ message: "Invalid date format" });
      }

      const updatedEvent = await db.update(events)
        .set({
          ...rest,
          startDate: startDateObj.toISOString(),
          endDate: endDateObj.toISOString(),
          type: rest.type,
          homeScore: rest.type === 'match' && rest.homeScore !== undefined ? 
            (rest.homeScore === '' || rest.homeScore === null ? null : Number(rest.homeScore)) : null,
          awayScore: rest.type === 'match' && rest.awayScore !== undefined ? 
            (rest.awayScore === '' || rest.awayScore === null ? null : Number(rest.awayScore)) : null
        })
        .where(eq(events.id, parseInt(req.params.eventId)))
        .returning();

      if (!updatedEvent.length) {
        return res.status(404).json({ message: "Event not found" });
      }

      res.json(updatedEvent[0]);
    } catch (error: any) {
      console.error('Error updating event:', error);
      res.status(500).json({ message: error.message || "Failed to update event" });
    }
  });

  // Delete event
  app.delete("/api/teams/:teamId/events/:eventId", requireRole(["admin", "editor"]), async (req, res) => {
    try {
      const deleted = await db.delete(events)
        .where(eq(events.id, parseInt(req.params.eventId)))
        .returning();

      if (!deleted.length) {
        return res.status(404).json({ message: "Event not found" });
      }

      res.json({ message: "Event deleted successfully" });
    } catch (error: any) {
      console.error('Error deleting event:', error);
      res.status(500).json({ message: error.message || "Failed to delete event" });
    }
  });

  // News
  app.get("/api/teams/:teamId/news", requireAuth, async (req, res) => {
    const teamNews = await db.select().from(news)
      .where(eq(news.teamId, parseInt(req.params.teamId)));
    res.json(teamNews);
  });

  app.post("/api/teams/:teamId/news", requireRole(["admin"]), async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).send("User not authenticated");
      }

      const newNews = await db.insert(news).values({
        ...req.body,
        teamId: parseInt(req.params.teamId),
        createdById: req.user.id
      }).returning();
      
      res.json(newNews[0]);
    } catch (error: any) {
      console.error('Error creating news:', error);
      res.status(500).json({ message: error.message || "Failed to create news" });
    }
  });

  app.put("/api/teams/:teamId/news/:newsId", requireRole(["admin"]), async (req, res) => {
    try {
      const updatedNews = await db.update(news)
        .set(req.body)
        .where(eq(news.id, parseInt(req.params.newsId)))
        .returning();

      if (!updatedNews.length) {
        return res.status(404).json({ message: "News not found" });
      }

      res.json(updatedNews[0]);
    } catch (error: any) {
      console.error('Error updating news:', error);
      res.status(500).json({ message: error.message || "Failed to update news" });
    }
  });

  app.delete("/api/teams/:teamId/news/:newsId", requireRole(["admin"]), async (req, res) => {
    try {
      const deleted = await db.delete(news)
        .where(eq(news.id, parseInt(req.params.newsId)))
        .returning();

      if (!deleted.length) {
        return res.status(404).json({ message: "News not found" });
      }

      res.json({ message: "News deleted successfully" });
    } catch (error: any) {
      console.error('Error deleting news:', error);
      res.status(500).json({ message: error.message || "Failed to delete news" });
    }
  });

  // Next match endpoint
  app.get("/api/teams/:teamId/next-match", requireAuth, async (req, res) => {
    const now = new Date().toISOString();
    const nextMatch = await db.select()
      .from(events)
      .where(
        sql`${events.teamId} = ${parseInt(req.params.teamId)} AND 
            ${events.type} = 'match' AND 
            ${events.startDate} > ${now}`
      )
      .orderBy(events.startDate)
      .limit(1);
    
    res.json(nextMatch[0] || null);
  });

  // Match lineup endpoints
  app.get("/api/matches/:matchId/lineup", requireAuth, async (req, res) => {
    try {
      const lineup = await db.execute(sql`
        SELECT ml.*, p.name, p.number, p.position
        FROM match_lineups ml
        JOIN players p ON ml.player_id = p.id
        WHERE ml.match_id = ${parseInt(req.params.matchId)}
        ORDER BY ml.is_starter DESC, p.position
      `);
      res.json(lineup);
    } catch (error: any) {
      console.error('Error fetching match lineup:', error);
      res.status(500).json({ message: error.message || "Failed to fetch lineup" });
    }
  });

  app.post("/api/matches/:matchId/lineup", requireRole(["admin", "editor"]), async (req, res) => {
    try {
      const { players } = req.body;
      const matchId = parseInt(req.params.matchId);

      // First, remove existing lineup for this match
      await db.execute(sql`DELETE FROM match_lineups WHERE match_id = ${matchId}`);

      // Insert new lineup
      const lineup = await Promise.all(
        players.map(async (player: any) => {
          return db.execute(sql`
            INSERT INTO match_lineups (match_id, player_id, is_starter, position_in_match)
            VALUES (${matchId}, ${player.playerId}, ${player.isStarter}, ${player.positionInMatch})
            RETURNING *
          `);
        })
      );

      res.json(lineup);
    } catch (error: any) {
      console.error('Error updating match lineup:', error);
      res.status(500).json({ message: error.message || "Failed to update lineup" });
    }
  });

  // Match goals endpoints
  app.get("/api/matches/:matchId/goals", requireAuth, async (req, res) => {
    try {
      const goals = await db.execute(sql`
        SELECT mg.*, p.name, p.number
        FROM match_goals mg
        JOIN players p ON mg.player_id = p.id
        WHERE mg.match_id = ${parseInt(req.params.matchId)}
        ORDER BY mg.minute
      `);
      res.json(goals);
    } catch (error: any) {
      console.error('Error fetching match goals:', error);
      res.status(500).json({ message: error.message || "Failed to fetch goals" });
    }
  });

  app.post("/api/matches/:matchId/goals", requireRole(["admin", "editor"]), async (req, res) => {
    try {
      const { playerId, minute } = req.body;
      const matchId = parseInt(req.params.matchId);

      const goal = await db.execute(sql`
        INSERT INTO match_goals (match_id, player_id, minute)
        VALUES (${matchId}, ${playerId}, ${minute})
        RETURNING *
      `);

      res.json(goal);
    } catch (error: any) {
      console.error('Error adding match goal:', error);
      res.status(500).json({ message: error.message || "Failed to add goal" });
    }
  });
}