import express, { type Express } from "express";
import { setupAuth } from "./auth";
import { db } from "../db";
import { teams, players, events } from "@db/schema";
import { eq } from "drizzle-orm";
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
      const filetypes = /jpeg|jpg|png|gif/;
      const mimetype = filetypes.test(file.mimetype);
      const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

      if (mimetype && extname) {
        return cb(null, true);
      }
      cb(new Error('Error: Images Only!'));
    }
  });

  // File upload endpoint
  app.post('/api/upload', requireAuth, upload.single('photo'), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const photoUrl = `/uploads/${req.file.filename}`;
    res.json({ photoUrl });
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
          homeScore: rest.homeScore === '' ? null : Number(rest.homeScore),
          awayScore: rest.awayScore === '' ? null : Number(rest.awayScore)
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
}