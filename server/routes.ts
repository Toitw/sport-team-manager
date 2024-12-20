import express, { type Express } from "express";
import { setupAuth } from "./auth";
import { db } from "../db";
import { teams, players, events, news, matchLineups, matchReserves, matchScorers, matchCards, matchSubstitutions, matchCommentary, playerStatistics } from "@db/schema";
import { eq, sql, desc, and } from "drizzle-orm";
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
    try {
      // Create new player
      const newPlayer = await db.insert(players).values({
        ...req.body,
        teamId: parseInt(req.params.teamId)
      }).returning();

      // Initialize player statistics for current year
      const currentYear = new Date().getFullYear();
      await db.insert(playerStatistics).values({
        playerId: newPlayer[0].id,
        seasonYear: currentYear,
        gamesPlayed: 0,
        goals: 0,
        yellowCards: 0,
        redCards: 0
      });

      res.json(newPlayer[0]);
    } catch (error: any) {
      console.error('Error creating player:', error);
      res.status(500).json({ message: error.message || "Failed to create player" });
    }
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

  // Players section - Add this new endpoint
  app.get("/api/players/:playerId/statistics", requireAuth, async (req, res) => {
    try {
      const playerId = parseInt(req.params.playerId);
      const currentYear = new Date().getFullYear();

      // Get player statistics
      const stats = await db.select()
        .from(playerStatistics)
        .where(and(
          eq(playerStatistics.playerId, playerId),
          eq(playerStatistics.seasonYear, currentYear)
        ));

      if (stats.length === 0) {
        // Return default values for new players
        return res.json({
          gamesPlayed: 0,
          goals: 0,
          yellowCards: 0,
          redCards: 0,
          seasonYear: currentYear
        });
      }

      res.json(stats[0]);
    } catch (error: any) {
      console.error('Error fetching player statistics:', error);
      res.status(500).json({ message: error.message || "Failed to fetch player statistics" });
    }
  });

  // Update statistics after match events
  async function updatePlayerStatistics(matchId: number) {
    const currentYear = new Date().getFullYear();

    try {
      // Get match details first to verify it's completed
      const match = await db.select().from(events)
        .where(eq(events.id, matchId))
        .limit(1);

      if (!match.length || match[0].type !== 'match') {
        console.log('Match not found or not a match type event');
        return;
      }

      // For completed matches, we need both scores to be set
      if (match[0].homeScore === null || match[0].awayScore === null) {
        console.log('Match scores not set, skipping statistics update');
        return;
      }

      console.log(`Processing statistics for match ${matchId}`);

      // Get all players who participated (lineup + substitutes)
      const lineupPlayers = await db.select().from(matchLineups)
        .where(eq(matchLineups.matchId, matchId));

      console.log(`Found ${lineupPlayers.length} players in lineup`);

      // Get substituted players
      const substitutions = await db.select().from(matchSubstitutions)
        .where(eq(matchSubstitutions.matchId, matchId));

      console.log(`Found ${substitutions.length} substitutions`);

      // Get all players who participated
      const allPlayerIds = [...new Set([
        ...lineupPlayers.map(p => p.playerId),
        ...substitutions.map(s => s.playerInId)
      ])];

      console.log(`Updating statistics for ${allPlayerIds.length} players`);

      // Process each player
      for (const playerId of allPlayerIds) {
        // Get goals scored
        const goals = await db.select().from(matchScorers)
          .where(and(
            eq(matchScorers.matchId, matchId),
            eq(matchScorers.playerId, playerId),
            eq(matchScorers.eventType, 'goal')
          ));

        // Get cards received
        const cards = await db.select().from(matchCards)
          .where(and(
            eq(matchCards.matchId, matchId),
            eq(matchCards.playerId, playerId)
          ));

        const yellowCards = cards.filter(c => c.cardType === 'yellow').length;
        const redCards = cards.filter(c => c.cardType === 'red').length;

        // Update player statistics
        const stats = await db.select().from(playerStatistics)
          .where(and(
            eq(playerStatistics.playerId, playerId),
            eq(playerStatistics.seasonYear, currentYear)
          ));

        if (stats.length === 0) {
          // Create new statistics record
          await db.insert(playerStatistics).values({
            playerId,
            seasonYear: currentYear,
            gamesPlayed: 1,
            goals: goals.length,
            yellowCards,
            redCards
          });
          console.log(`Created new statistics for player ${playerId}`);
        } else {
          // Update existing statistics
          await db.update(playerStatistics)
            .set({
              gamesPlayed: sql`${playerStatistics.gamesPlayed} + 1`,
              goals: sql`${playerStatistics.goals} + ${goals.length}`,
              yellowCards: sql`${playerStatistics.yellowCards} + ${yellowCards}`,
              redCards: sql`${playerStatistics.redCards} + ${redCards}`
            })
            .where(and(
              eq(playerStatistics.playerId, playerId),
              eq(playerStatistics.seasonYear, currentYear)
            ));
          console.log(`Updated statistics for player ${playerId}`);
        }
      }

      console.log(`Successfully updated statistics for match ${matchId}`);
    } catch (error) {
      console.error('Error updating player statistics:', error);
      throw error;
    }
  }

  // Update event endpoint
  app.put("/api/teams/:teamId/events/:eventId", requireRole(["admin", "editor"]), async (req, res) => {
    try {
      const { startDate, endDate, ...rest } = req.body;

      // Validate dates
      const startDateObj = new Date(startDate);
      const endDateObj = new Date(endDate);

      if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
        return res.status(400).json({ message: "Invalid date format" });
      }

      // Get the current event to check if scores are being updated
      const currentEvent = await db.select().from(events)
        .where(eq(events.id, parseInt(req.params.eventId)))
        .limit(1);

      if (!currentEvent.length) {
        return res.status(404).json({ message: "Event not found" });
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

      // Update player statistics if this is a match and scores are being updated
      if (updatedEvent[0].type === 'match' && 
          (updatedEvent[0].homeScore !== null || updatedEvent[0].awayScore !== null) &&
          (currentEvent[0].homeScore === null || currentEvent[0].awayScore === null)) {
        console.log('Updating player statistics for match:', updatedEvent[0].id);
        await updatePlayerStatistics(updatedEvent[0].id);
      }

      res.json(updatedEvent[0]);
    } catch (error: any) {
      console.error('Error updating event:', error);
      res.status(500).json({ message: error.message || "Failed to update event" });
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

  // Match Details endpoints
  // Get match details (lineup, reserves, scorers)
  app.get("/api/matches/:matchId/details", requireAuth, async (req, res) => {
    try {
      const matchId = parseInt(req.params.matchId);
      
      // Get lineup
      const lineup = await db.select()
        .from(matchLineups)
        .where(eq(matchLineups.matchId, matchId));
      
      // Get reserves
      const reserves = await db.select()
        .from(matchReserves)
        .where(eq(matchReserves.matchId, matchId));
      
      // Get scorers
      const scorers = await db.select()
        .from(matchScorers)
        .where(eq(matchScorers.matchId, matchId));
      
      // Get cards
      const cards = await db.select()
        .from(matchCards)
        .where(eq(matchCards.matchId, matchId));

      // Get substitutions
      const substitutions = await db.select()
        .from(matchSubstitutions)
        .where(eq(matchSubstitutions.matchId, matchId));

      res.json({ lineup, reserves, scorers, cards, substitutions });
    } catch (error: any) {
      console.error('Error fetching match details:', error);
      res.status(500).json({ message: error.message || "Failed to fetch match details" });
    }
  });

  // Update match lineup
  app.post("/api/matches/:matchId/lineup", requireRole(["admin", "editor"]), async (req, res) => {
    try {
      const matchId = parseInt(req.params.matchId);
      const { players } = req.body; // Array of { playerId, position }
      
      // First, remove existing lineup
      await db.delete(matchLineups)
        .where(eq(matchLineups.matchId, matchId));
      
      // Then insert new lineup
      const lineup = await db.insert(matchLineups)
        .values(players.map((p: any) => ({
          matchId,
          playerId: p.playerId,
          position: p.position
        })))
        .returning();
      
      res.json(lineup);
    } catch (error: any) {
      console.error('Error updating match lineup:', error);
      res.status(500).json({ message: error.message || "Failed to update match lineup" });
    }
  });

  // Update match reserves
  app.post("/api/matches/:matchId/reserves", requireRole(["admin", "editor"]), async (req, res) => {
    try {
      const matchId = parseInt(req.params.matchId);
      const { players } = req.body; // Array of playerIds
      
      // First, remove existing reserves
      await db.delete(matchReserves)
        .where(eq(matchReserves.matchId, matchId));
      
      // Then insert new reserves
      const reserves = await db.insert(matchReserves)
        .values(players.map((playerId: number) => ({
          matchId,
          playerId
        })))
        .returning();
      
      res.json(reserves);
    } catch (error: any) {
      console.error('Error updating match reserves:', error);
      res.status(500).json({ message: error.message || "Failed to update match reserves" });
    }
  });

  // Add match scorer
  app.post("/api/matches/:matchId/scorers", requireRole(["admin", "editor"]), async (req, res) => {
    try {
      const matchId = parseInt(req.params.matchId);
      const { playerId, minute, eventType = 'goal' } = req.body;
      
      const scorer = await db.insert(matchScorers)
        .values({
          matchId,
          playerId,
          minute,
          eventType
        })
        .returning();
      
      res.json(scorer[0]);
    } catch (error: any) {
      console.error('Error adding match scorer:', error);
      res.status(500).json({ message: error.message || "Failed to add match scorer" });
    }
  });

  // Delete match scorer
  app.delete("/api/matches/:matchId/scorers/:scorerId", requireRole(["admin", "editor"]), async (req, res) => {
    try {
      const { matchId, scorerId } = req.params;
      
      const deleted = await db.delete(matchScorers)
        .where(sql`${matchScorers.id} = ${parseInt(scorerId)} AND ${matchScorers.matchId} = ${parseInt(matchId)}`)
        .returning();

      if (!deleted.length) {
        return res.status(404).json({ message: "Scorer not found" });
      }
      
      res.json({ message: "Scorer deleted successfully" });
    } catch (error: any) {
      console.error('Error deleting match scorer:', error);
      res.status(500).json({ message: error.message || "Failed to delete match scorer" });
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

  // Update match cards endpoint
  app.post("/api/matches/:matchId/cards", requireRole(["admin", "editor"]), async (req, res) => {
    try {
      const matchId = parseInt(req.params.matchId);
      const { cards } = req.body; // Array of { playerId, minute, cardType, reason? }

      // Validate match exists and is completed
      const match = await db.select().from(events)
        .where(eq(events.id, matchId))
        .limit(1);

      if (!match.length || match[0].type !== 'match') {
        return res.status(404).json({ message: "Match not found" });
      }

      // First, remove existing cards
      await db.delete(matchCards)
        .where(eq(matchCards.matchId, matchId));

      // Then insert new cards
      if (cards.length > 0) {
        // Validate cards data
        const invalidCards = cards.filter(
          (card: any) => !card.playerId || !card.cardType || card.minute < 0 || card.minute > 120
        );

        if (invalidCards.length > 0) {
          return res.status(400).json({ 
            message: "Invalid card data",
            details: "All cards must have valid player ID, type, and minute (0-120)"
          });
        }

        const currentYear = new Date().getFullYear();

        // Insert new cards and update player statistics
        const newCards = await db.insert(matchCards)
          .values(cards.map((card: any) => ({
            matchId,
            playerId: card.playerId,
            cardType: card.cardType,
            minute: card.minute,
            reason: card.reason
          })))
          .returning();

        // Update player statistics for each card
        for (const card of cards) {
          // Get or create player statistics for current season
          let stats = await db.select().from(playerStatistics)
            .where(and(
              eq(playerStatistics.playerId, card.playerId),
              eq(playerStatistics.seasonYear, currentYear)
            ));

          if (stats.length === 0) {
            // Create new statistics record
            await db.insert(playerStatistics).values({
              playerId: card.playerId,
              seasonYear: currentYear,
              gamesPlayed: 0,
              goals: 0,
              yellowCards: card.cardType === 'yellow' ? 1 : 0,
              redCards: card.cardType === 'red' ? 1 : 0
            });
          } else {
            // Update existing statistics
            await db.update(playerStatistics)
              .set({
                yellowCards: sql`${playerStatistics.yellowCards} + ${card.cardType === 'yellow' ? 1 : 0}`,
                redCards: sql`${playerStatistics.redCards} + ${card.cardType === 'red' ? 1 : 0}`
              })
              .where(and(
                eq(playerStatistics.playerId, card.playerId),
                eq(playerStatistics.seasonYear, currentYear)
              ));
          }
        }

        res.json(newCards);
      } else {
        res.json([]);
      }
    } catch (error: any) {
      console.error('Error updating match cards:', error);
      res.status(500).json({ 
        message: "Failed to update match cards",
        error: error.message 
      });
    }
  });

  // Add the substitutions endpoint with improved error handling
  app.post("/api/matches/:matchId/substitutions", requireRole(["admin", "editor"]), async (req, res) => {
    try {
      const matchId = parseInt(req.params.matchId);
      const { substitutions } = req.body; // Array of { playerOutId, playerInId, minute, half }

      if (!substitutions || !Array.isArray(substitutions)) {
        return res.status(400).json({ message: "Invalid substitutions data format" });
      }

      // Validate substitutions data
      const invalidSubs = substitutions.filter(
        sub => !sub.playerOutId || !sub.playerInId || sub.minute < 0 || 
               sub.minute > 120 || ![1, 2].includes(sub.half)
      );

      if (invalidSubs.length > 0) {
        return res.status(400).json({ 
          message: "Invalid substitution data",
          details: "All substitutions must have valid player IDs, minute (0-120), and half (1 or 2)"
        });
      }

      console.log('Removing existing substitutions for match:', matchId);
      // First, remove existing substitutions
      await db.delete(matchSubstitutions)
        .where(eq(matchSubstitutions.matchId, matchId));

      console.log('Adding new substitutions:', substitutions);
      // Then insert new substitutions
      if (substitutions.length > 0) {
        const newSubstitutions = await db.insert(matchSubstitutions)
          .values(substitutions.map((sub: any) => ({
            matchId,
            playerOutId: sub.playerOutId,
            playerInId: sub.playerInId,
            minute: sub.minute,
            half: sub.half
          })))
          .returning();

        console.log('Successfully added substitutions:', newSubstitutions);
        res.json(newSubstitutions);
      } else {
        res.json([]);
      }
    } catch (error: any) {
      console.error('Error updating match substitutions:', error);
      res.status(500).json({ 
        message: "Failed to update match substitutions",
        error: error.message 
      });
    }
  });

  // Match Commentary endpoints
  app.get("/api/matches/:matchId/commentary", requireAuth, async (req, res) => {
    try {
      const matchId = parseInt(req.params.matchId);
      const commentary = await db.select()
        .from(matchCommentary)
        .where(eq(matchCommentary.matchId, matchId))
        .orderBy(sql`${matchCommentary.minute}`);

      res.json(commentary);
    } catch (error: any) {
      console.error('Error fetching match commentary:', error);
      res.status(500).json({ message: error.message || "Failed to fetch match commentary" });
    }
  });

  app.post("/api/matches/:matchId/commentary", requireRole(["admin", "editor"]), async (req, res) => {
    try {
      const matchId = parseInt(req.params.matchId);
      const { minute, type, content } = req.body;

      if (!["highlight", "commentary"].includes(type)) {
        return res.status(400).json({ message: "Invalid commentary type" });
      }

      if (minute < 0 || minute > 120) {
        return res.status(400).json({ message: "Invalid minute" });
      }

      const newCommentary = await db.insert(matchCommentary)
        .values({
          matchId,
          minute,
          type,
          content
        })
        .returning();

      res.json(newCommentary[0]);
    } catch (error: any) {
      console.error('Error adding match commentary:', error);
      res.status(500).json({ message: error.message || "Failed to add match commentary" });
    }
  });
}