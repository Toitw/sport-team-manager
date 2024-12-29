import passport from "passport";
import { IVerifyOptions, Strategy as LocalStrategy } from "passport-local";
import { type Express } from "express";
import session from "express-session";
import createMemoryStore from "memorystore";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { users, insertUserSchema, type User as SelectUser } from "@db/schema";
import { getDb } from "../db";
import { eq } from "drizzle-orm";
import { sendVerificationEmail, sendPasswordResetEmail } from "./services/email";

const scryptAsync = promisify(scrypt);
const crypto = {
  hash: async (password: string) => {
    const salt = randomBytes(16).toString("hex");
    const buf = (await scryptAsync(password, salt, 64)) as Buffer;
    return `${buf.toString("hex")}.${salt}`;
  },
  compare: async (suppliedPassword: string, storedPassword: string) => {
    const [hashedPassword, salt] = storedPassword.split(".");
    const hashedPasswordBuf = Buffer.from(hashedPassword, "hex");
    const suppliedPasswordBuf = (await scryptAsync(
      suppliedPassword,
      salt,
      64
    )) as Buffer;
    return timingSafeEqual(hashedPasswordBuf, suppliedPasswordBuf);
  },
  generateToken: () => randomBytes(32).toString("hex"),
};

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

export async function setupAuth(app: Express) {
  const MemoryStore = createMemoryStore(session);
  const sessionSettings: session.SessionOptions = {
    secret: process.env.REPL_ID || "sports-team-manager",
    resave: false,
    saveUninitialized: false,
    cookie: {},
    store: new MemoryStore({
      checkPeriod: 86400000,
    }),
  };

  if (app.get("env") === "production") {
    app.set("trust proxy", 1);
    sessionSettings.cookie = { secure: true };
  }

  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // Create test users in development mode
  if (process.env.NODE_ENV === 'development') {
    try {
      const db = await getDb();
      const testUsers = [
        { email: "test@example.com", role: "admin" },
        { email: "manager@example.com", role: "manager" },
        { email: "reader@example.com", role: "reader" }
      ];

      for (const testUser of testUsers) {
        console.log(`Checking for test user existence: ${testUser.email}`);
        const [existingUser] = await db
          .select()
          .from(users)
          .where(eq(users.email, testUser.email))
          .limit(1);

        if (!existingUser) {
          console.log(`Creating test user: ${testUser.email}`);
          const hashedPassword = await crypto.hash("testpass123");
          const [newUser] = await db
            .insert(users)
            .values({
              email: testUser.email,
              password: hashedPassword,
              role: testUser.role,
              emailVerified: true,
              verificationToken: null,
              createdAt: new Date().toISOString()
            })
            .returning();

          console.log('Test user created successfully:', {
            email: testUser.email,
            id: newUser.id,
            role: newUser.role
          });
        } else {
          console.log('Test user already exists:', {
            email: testUser.email,
            id: existingUser.id,
            role: existingUser.role
          });
        }
      }
    } catch (error) {
      console.error('Error setting up test users:', error);
    }
  }

  passport.use(
    new LocalStrategy(
      { usernameField: 'email' },
      async (email, password, done) => {
        try {
          console.log('Attempting authentication for:', email);
          const db = await getDb();
          const [user] = await db
            .select()
            .from(users)
            .where(eq(users.email, email))
            .limit(1);

          if (!user) {
            console.log('User not found:', email);
            return done(null, false, { message: "Invalid email or password." });
          }

          if (!user.emailVerified) {
            console.log('Email not verified for:', email);
            return done(null, false, { message: "Please verify your email first." });
          }

          const isMatch = await crypto.compare(password, user.password);
          if (!isMatch) {
            console.log('Invalid password for:', email);
            return done(null, false, { message: "Invalid email or password." });
          }

          console.log('Authentication successful for:', email);
          return done(null, user);
        } catch (err) {
          console.error('Authentication error:', err);
          return done(err);
        }
      }
    )
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const db = await getDb();
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, id))
        .limit(1);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      const result = insertUserSchema.safeParse(req.body);
      if (!result.success) {
        return res
          .status(400)
          .send("Invalid input: " + result.error.issues.map(i => i.message).join(", "));
      }

      const { email, password, role } = result.data;
      const db = await getDb();

      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (existingUser) {
        return res.status(400).send("Email already registered");
      }

      const hashedPassword = await crypto.hash(password);
      const verificationToken = crypto.generateToken();

      const [newUser] = await db
        .insert(users)
        .values({
          email,
          password: hashedPassword,
          role: role || "reader",
          verificationToken,
          emailVerified: false
        })
        .returning();

      try {
        await sendVerificationEmail(email, verificationToken);
      } catch (error) {
        console.error('Failed to send verification email:', error);
        await db
          .delete(users)
          .where(eq(users.id, newUser.id));
        return res.status(500).send("Failed to send verification email. Please try again.");
      }

      res.json({
        message: "Registration successful. Please check your email to verify your account.",
        user: { id: newUser.id, email: newUser.email, role: newUser.role },
      });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/verify-email", async (req, res) => {
    try {
      const { token } = req.query;

      if (!token || typeof token !== 'string') {
        return res.status(400).send("Invalid verification link");
      }

      const db = await getDb();
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.verificationToken, token))
        .limit(1);

      if (!user) {
        return res.status(400).send("Invalid or expired verification link");
      }

      if (user.emailVerified) {
        return res.status(400).send("Email is already verified");
      }

      await db
        .update(users)
        .set({
          emailVerified: true,
          verificationToken: null
        })
        .where(eq(users.id, user.id));

      res.send("Email verified successfully. You can now log in.");
    } catch (error) {
      console.error("Error verifying email:", error);
      res.status(500).send("Error verifying email");
    }
  });

  app.post("/api/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).send("Email is required");
      }

      const db = await getDb();
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (!user) {
        return res.json({ message: "If your email is registered, you'll receive a password reset link." });
      }

      const resetToken = crypto.generateToken();
      const resetExpires = new Date(Date.now() + 60 * 60 * 1000);

      await db
        .update(users)
        .set({
          passwordResetToken: resetToken,
          passwordResetExpires: resetExpires.toISOString()
        })
        .where(eq(users.id, user.id));

      try {
        const emailResult = await sendPasswordResetEmail(email, resetToken);
        if (!emailResult.success) {
          console.error('Failed to send password reset email:', emailResult.error);
          return res.status(500).send("Failed to send password reset email");
        }
      } catch (error) {
        console.error('Failed to send password reset email:', error);
        return res.status(500).send("Failed to send password reset email");
      }

      res.json({ message: "If your email is registered, you'll receive a password reset link." });
    } catch (error) {
      console.error("Error requesting password reset:", error);
      res.status(500).send("Error requesting password reset");
    }
  });

  app.post("/api/reset-password", async (req, res) => {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        return res.status(400).send("Missing token or new password");
      }

      const db = await getDb();
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.passwordResetToken, token))
        .limit(1);

      if (!user || !user.passwordResetExpires) {
        return res.status(400).send("Invalid or expired reset token");
      }

      const now = new Date();
      const expires = new Date(user.passwordResetExpires);

      if (now > expires) {
        return res.status(400).send("Reset token has expired. Please request a new password reset.");
      }

      const hashedPassword = await crypto.hash(newPassword);

      await db
        .update(users)
        .set({
          password: hashedPassword,
          passwordResetToken: null,
          passwordResetExpires: null
        })
        .where(eq(users.id, user.id));

      res.json({ message: "Password reset successful. You can now log in with your new password." });
    } catch (error) {
      console.error("Error resetting password:", error);
      res.status(500).send("Error resetting password");
    }
  });

  app.post("/api/login", async (req, res, next) => {
    try {
      const result = insertUserSchema.safeParse(req.body);
      if (!result.success) {
        return res
          .status(400)
          .send("Invalid input: " + result.error.issues.map(i => i.message).join(", "));
      }

      passport.authenticate("local", (err: any, user: Express.User, info: IVerifyOptions) => {
        if (err) return next(err);
        if (!user) return res.status(400).send(info.message ?? "Login failed");

        req.logIn(user, (err) => {
          if (err) return next(err);
          return res.json({
            message: "Login successful",
            user: { id: user.id, email: user.email, role: user.role },
          });
        });
      })(req, res, next);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/logout", (req, res) => {
    req.logout((err) => {
      if (err) return res.status(500).send("Logout failed");
      res.json({ message: "Logout successful" });
    });
  });

  app.get("/api/user", (req, res) => {
    if (req.isAuthenticated()) {
      console.log('User authenticated:', req.user.email);
      return res.json(req.user);
    }

    console.log('User not authenticated');
    res.status(401).send("Not logged in");
  });
}