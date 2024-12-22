import passport from "passport";
import { IVerifyOptions, Strategy as LocalStrategy } from "passport-local";
import { type Express } from "express";
import session from "express-session";
import createMemoryStore from "memorystore";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { users, insertUserSchema, type User as SelectUser } from "@db/schema";
import { db } from "../db";
import { eq } from "drizzle-orm";
import sgMail from '@sendgrid/mail';

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

// Configure SendGrid with error handling
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
let emailFunctionalityAvailable = false;

if (!SENDGRID_API_KEY) {
  console.warn('SendGrid API key is not set. Email functionality will be disabled.');
} else {
  try {
    sgMail.setApiKey(SENDGRID_API_KEY);
    emailFunctionalityAvailable = true;
    console.log('Email functionality is enabled.');
  } catch (error) {
    console.error('Error configuring SendGrid:', error);
  }
}

// Set APP_URL for local development
const APP_URL = 'http://localhost:3000';

async function sendEmail(to: string, subject: string, text: string, html: string) {
  if (!emailFunctionalityAvailable) {
    console.warn('Attempted to send email but email functionality is disabled.');
    return;
  }

  const msg = {
    to,
    from: 'noreply@sportsteammanager.com',
    subject,
    text,
    html,
  };

  try {
    await sgMail.send(msg);
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send email');
  }
}

export function setupAuth(app: Express) {
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

  passport.use(
    new LocalStrategy(
      { usernameField: 'email' },
      async (email, password, done) => {
        try {
          const [user] = await db
            .select()
            .from(users)
            .where(eq(users.email, email))
            .limit(1);

          if (!user) {
            return done(null, false, { message: "Incorrect email." });
          }

          if (!user.emailVerified && emailFunctionalityAvailable) {
            return done(null, false, { message: "Please verify your email first." });
          }

          const isMatch = await crypto.compare(password, user.password);
          if (!isMatch) {
            return done(null, false, { message: "Incorrect password." });
          }
          return done(null, user);
        } catch (err) {
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

  // Register endpoint with optional email verification
  app.post("/api/register", async (req, res, next) => {
    try {
      const result = insertUserSchema.safeParse(req.body);
      if (!result.success) {
        return res
          .status(400)
          .send("Invalid input: " + result.error.issues.map(i => i.message).join(", "));
      }

      const { email, password, role } = result.data;

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
          verificationToken: emailFunctionalityAvailable ? verificationToken : null,
          emailVerified: !emailFunctionalityAvailable // Auto-verify if email functionality is disabled
        })
        .returning();

      if (emailFunctionalityAvailable) {
        try {
          const verificationUrl = `${APP_URL}/verify-email?token=${verificationToken}`;
          await sendEmail(
            email,
            'Verify your email',
            `Welcome to Sports Team Manager! Please verify your email by clicking: ${verificationUrl}`,
            `
              <h1>Welcome to Sports Team Manager!</h1>
              <p>Please click the link below to verify your email address:</p>
              <a href="${verificationUrl}">${verificationUrl}</a>
              <p>This link will expire in 24 hours.</p>
            `
          );
        } catch (error) {
          console.error('Failed to send verification email:', error);
          // Continue with registration even if email fails
        }
      }

      res.json({
        message: emailFunctionalityAvailable
          ? "Registration successful. Please check your email to verify your account."
          : "Registration successful. Email verification is currently disabled.",
        user: { id: newUser.id, email: newUser.email, role: newUser.role },
      });
    } catch (error) {
      next(error);
    }
  });

  // Email verification endpoint
  app.get("/api/verify-email", async (req, res) => {
    try {
      const { token } = req.query;

      if (!token || typeof token !== 'string') {
        return res.status(400).send("Invalid verification token");
      }

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.verificationToken, token))
        .limit(1);

      if (!user) {
        return res.status(400).send("Invalid or expired verification token");
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

  // Password reset request endpoint
  app.post("/api/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (!user) {
        // Don't reveal whether a user exists
        return res.json({ message: "If your email is registered, you'll receive a password reset link." });
      }

      const resetToken = crypto.generateToken();
      const resetExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      await db
        .update(users)
        .set({
          passwordResetToken: resetToken,
          passwordResetExpires: resetExpires.toISOString()
        })
        .where(eq(users.id, user.id));

      const resetUrl = `${APP_URL}/reset-password?token=${resetToken}`;
      await sendEmail(
        email,
        'Password Reset Request',
        `You requested a password reset. Click this link to reset your password: ${resetUrl}`,
        `
          <h1>Password Reset Request</h1>
          <p>You requested a password reset. Click the link below to reset your password:</p>
          <a href="${resetUrl}">${resetUrl}</a>
          <p>This link will expire in 24 hours.</p>
          <p>If you didn't request this, please ignore this email.</p>
        `
      );

      res.json({ message: "If your email is registered, you'll receive a password reset link." });
    } catch (error) {
      console.error("Error requesting password reset:", error);
      res.status(500).send("Error requesting password reset");
    }
  });

  // Reset password endpoint
  app.post("/api/reset-password", async (req, res) => {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        return res.status(400).send("Missing token or new password");
      }

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
        return res.status(400).send("Reset token has expired");
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

  app.post("/api/login", (req, res, next) => {
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
  });

  app.post("/api/logout", (req, res) => {
    req.logout((err) => {
      if (err) return res.status(500).send("Logout failed");
      res.json({ message: "Logout successful" });
    });
  });

  app.get("/api/user", (req, res) => {
    if (req.isAuthenticated()) {
      return res.json(req.user);
    }
    res.status(401).send("Not logged in");
  });
  // Get all users (admin only)
  app.get("/api/users", async (req, res) => {
    if (!req.isAuthenticated() || req.user?.role !== "admin") {
      return res.status(403).send("Unauthorized");
    }
    try {
      const result = await db
        .select({
          id: users.id,
          email: users.email, 
          role: users.role,
        })
        .from(users);
      res.json(result);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).send("Internal server error");
    }
  });

  // Update user role (admin only)
  app.patch("/api/users/:id/role", async (req, res) => {
    if (!req.isAuthenticated() || req.user?.role !== "admin") {
      return res.status(403).send("Unauthorized");
    }

    const userId = parseInt(req.params.id);
    const { role } = req.body;

    if (!role || !["admin", "manager", "reader"].includes(role)) {
      return res.status(400).send("Invalid role");
    }

    try {
      const [updatedUser] = await db
        .update(users)
        .set({ role })
        .where(eq(users.id, userId))
        .returning();

      if (!updatedUser) {
        return res.status(404).send("User not found");
      }

      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).send("Internal server error");
    }
  });
}