import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { randomUUID } from "crypto";
import { createHash } from "crypto";
import bcrypt from "bcrypt";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import rateLimit from "express-rate-limit";
import { upload } from "../config/cloudinary";
import path from "path";

// Password strength validation utility
function validatePasswordStrength(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long");
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }
  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }
  if (!/[0-9]/.test(password)) {
    errors.push("Password must contain at least one number");
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push("Password must contain at least one special character");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: "Too many login attempts, try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

const registrationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: { error: "Too many registration attempts, try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: "Too many upload attempts, try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

interface RegistrationSession {
  token: string;
  email: string;
  createdAt: number;
  expiresAt: number;
  uploadedFiles: string[];
  uploadCount: number;
}

const emailToSession = new Map<string, string>();

const registrationSessions = new Map<string, RegistrationSession>();
const SESSION_EXPIRY_MS = 2 * 60 * 60 * 1000;
const MAX_UPLOADS_PER_SESSION = 5;

function createRegistrationSession(email: string): string {
  const existingToken = emailToSession.get(email.toLowerCase());
  if (existingToken) {
    const existingSession = registrationSessions.get(existingToken);
    if (existingSession && Date.now() < existingSession.expiresAt) {
      return existingToken;
    }
    cleanupSession(existingToken);
  }
  
  const token = randomUUID() + "-" + randomUUID();
  const now = Date.now();
  registrationSessions.set(token, {
    token,
    email: email.toLowerCase(),
    createdAt: now,
    expiresAt: now + SESSION_EXPIRY_MS,
    uploadedFiles: [],
    uploadCount: 0,
  });
  emailToSession.set(email.toLowerCase(), token);
  return token;
}

function validateRegistrationSession(token: string): RegistrationSession | null {
  if (!token) return null;
  const session = registrationSessions.get(token);
  if (!session) return null;
  if (Date.now() > session.expiresAt) {
    cleanupSession(token);
    return null;
  }
  return session;
}

function cleanupSession(token: string): void {
  const session = registrationSessions.get(token);
  if (session) {
    emailToSession.delete(session.email);
    for (const filePath of session.uploadedFiles) {
      const fullPath = path.join(uploadDir, path.basename(filePath));
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    }
    registrationSessions.delete(token);
  }
}

setInterval(() => {
  const now = Date.now();
  for (const [token, session] of registrationSessions.entries()) {
    if (now > session.expiresAt) {
      cleanupSession(token);
    }
  }
}, 15 * 60 * 1000);

const sessionCreationLimits = new Map<string, { count: number; resetTime: number }>();
const MAX_SESSIONS_PER_IP = 3;
const SESSION_CREATION_WINDOW_MS = 60 * 60 * 1000;

function checkSessionCreationLimit(ip: string): boolean {
  const now = Date.now();
  const limit = sessionCreationLimits.get(ip);
  
  if (!limit || now > limit.resetTime) {
    sessionCreationLimits.set(ip, { count: 1, resetTime: now + SESSION_CREATION_WINDOW_MS });
    return true;
  }
  
  if (limit.count >= MAX_SESSIONS_PER_IP) {
    return false;
  }
  
  limit.count++;
  return true;
}

setInterval(() => {
  const now = Date.now();
  for (const [ip, limit] of sessionCreationLimits.entries()) {
    if (now > limit.resetTime) {
      sessionCreationLimits.delete(ip);
    }
  }
}, SESSION_CREATION_WINDOW_MS);

function consumeSession(token: string): string[] | null {
  const session = registrationSessions.get(token);
  if (!session || Date.now() > session.expiresAt) {
    return null;
  }
  const files = [...session.uploadedFiles];
  registrationSessions.delete(token);
  return files;
}
import {
  insertUserSchema, loginSchema, insertDoctorProfileSchema,
  insertAppointmentSchema, insertPaymentSchema, insertPrescriptionSchema,
  insertReviewSchema, insertNotificationSchema, insertHospitalSchema,
  insertSpecializationSchema, insertDoctorScheduleSchema, insertAppointmentSlotSchema,
  bookingSchema, doctorSearchSchema,
  UserRole, DoctorStatus, AppointmentStatus, PaymentStatus, PaymentMethod, AuthProvider, Language, ConsultationType,
} from "@shared/schema";
import { z } from "zod";

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    fullName: string;
  };
}

if (!process.env.SESSION_SECRET) {
  throw new Error(
    "SESSION_SECRET environment variable must be set. " +
    "Do not use hardcoded secrets in production."
  );
}

const JWT_SECRET = process.env.SESSION_SECRET;
const REGISTRATION_TOKEN_TTL_MS = 30 * 60 * 1000; // 30 minutes to complete signup

type JwtPayload = { id: string; email: string; role?: string; fullName?: string; provider?: string; purpose?: string; exp?: number };

function generateToken(payload: object, ttlMs = 7 * 24 * 60 * 60 * 1000): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const body = Buffer.from(JSON.stringify({ ...payload, exp: Date.now() + ttlMs })).toString("base64url");
  const signature = createHash("sha256").update(`${header}.${body}.${JWT_SECRET}`).digest("base64url");
  return `${header}.${body}.${signature}`;
}

function decodeToken(token: string): JwtPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const [header, body, signature] = parts;
    const expectedSignature = createHash("sha256").update(`${header}.${body}.${JWT_SECRET}`).digest("base64url");
    if (signature !== expectedSignature) return null;

    const payload = JSON.parse(Buffer.from(body, "base64url").toString());
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

function verifyToken(token: string): { id: string; email: string; role: string; fullName: string } | null {
  const payload = decodeToken(token);
  if (!payload || !payload.id || !payload.email || !payload.role || !payload.fullName) return null;
  return { id: payload.id, email: payload.email, role: payload.role, fullName: payload.fullName };
}

function generateRegistrationToken(payload: Pick<JwtPayload, "id" | "email" | "provider">) {
  return generateToken({ ...payload, purpose: "complete-registration" }, REGISTRATION_TOKEN_TTL_MS);
}

function verifyRegistrationToken(token: string): JwtPayload | null {
  const payload = decodeToken(token);
  if (!payload || payload.purpose !== "complete-registration") return null;
  return payload;
}

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  
  const token = authHeader.split(" ")[1];
  const user = verifyToken(token);
  
  if (!user) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
  
  req.user = user;
  next();
}

function roleMiddleware(...roles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    next();
  };
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.use(passport.initialize());
  passport.serializeUser((user: any, done) => {
    done(null, user);
  });

  passport.deserializeUser((user: any, done) => {
    done(null, user);
  });

  app.post("/api/auth/register", registrationLimiter, async (req: Request, res: Response) => {
    try {
      const data = insertUserSchema.parse(req.body);
      
      // Validate password strength
      const passwordValidation = validatePasswordStrength(data.password);
      if (!passwordValidation.valid) {
        return res.status(400).json({ 
          error: "Password does not meet security requirements",
          details: passwordValidation.errors 
        });
      }
      
      const existingUser = await storage.getUserByEmail(data.email);
      if (existingUser) {
        return res.status(400).json({ error: "Email already registered" });
      }
      
      const hashedPassword = await hashPassword(data.password);
      const user = await storage.createUser({ ...data, password: hashedPassword });
      
      const token = generateToken({ id: user.id, email: user.email, role: user.role, fullName: user.fullName });
      
      const { password: _, ...userWithoutPassword } = user;
      res.status(201).json({ user: userWithoutPassword, token });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Registration failed" });
    }
  });

  app.post("/api/auth/register-doctor", registrationLimiter, async (req: Request, res: Response) => {
    try {
      const registrationToken = req.headers["x-registration-token"] as string;
      let sessionFiles: string[] = [];
      
      if (registrationToken) {
        const files = consumeSession(registrationToken);
        if (files) {
          sessionFiles = files;
        }
      }
      
      const userData = insertUserSchema.parse({ ...req.body, role: UserRole.DOCTOR });
      
      // Validate password strength
      const passwordValidation = validatePasswordStrength(userData.password);
      if (!passwordValidation.valid) {
        return res.status(400).json({ 
          error: "Password does not meet security requirements",
          details: passwordValidation.errors 
        });
      }
      
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ error: "Email already registered" });
      }
      
      const hashedPassword = await hashPassword(userData.password);
      const user = await storage.createUser({ ...userData, password: hashedPassword });
      
      const verificationDocs = sessionFiles.length > 0 
        ? sessionFiles 
        : (req.body.verificationDocuments || []);
      
      const doctorData = insertDoctorProfileSchema.parse({
        userId: user.id,
        registrationNumber: req.body.registrationNumber,
        qualifications: req.body.qualifications,
        specializationIds: req.body.specializationIds || [],
        languagesSpoken: req.body.languagesSpoken || ["english"],
        consultationTypes: req.body.consultationTypes || ["in_person"],
        consultationFee: parseInt(req.body.consultationFee) || 0,
        onlineConsultationFee: req.body.onlineConsultationFee ? parseInt(req.body.onlineConsultationFee) : undefined,
        homeVisitFee: req.body.homeVisitFee ? parseInt(req.body.homeVisitFee) : undefined,
        verificationDocuments: verificationDocs,
        bankName: req.body.bankName || null,
        bankAccountNumber: req.body.bankAccountNumber || null,
        bankBranch: req.body.bankBranch || null,
        status: DoctorStatus.PENDING,
      });
      
      await storage.createDoctorProfile(doctorData);
      
      const token = generateToken({ id: user.id, email: user.email, role: user.role, fullName: user.fullName });
      
      const { password: _, ...userWithoutPassword } = user;
      res.status(201).json({ user: userWithoutPassword, token });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Doctor registration failed" });
    }
  });

  const completeRegistrationSchema = z.object({
    registrationToken: z.string(),
    role: z.enum([UserRole.PATIENT, UserRole.DOCTOR]),
    fullName: z.string().min(2, "Full name is required"),
    phone: z.string().min(8, "Phone is required"),
    preferredLanguages: z.array(z.enum([Language.ENGLISH, Language.SINHALA, Language.TAMIL])).min(1).optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    gender: z.string().optional(),
    profileImage: z.string().optional(),
    registrationNumber: z.string().optional(),
    qualifications: z.string().optional(),
    specializationIds: z.array(z.string()).optional(),
    languagesSpoken: z.array(z.enum([Language.ENGLISH, Language.SINHALA, Language.TAMIL])).optional(),
    consultationTypes: z.array(z.enum([ConsultationType.IN_PERSON, ConsultationType.ONLINE, ConsultationType.HOME_VISIT])).optional(),
    consultationFee: z.number().optional(),
    onlineConsultationFee: z.number().optional(),
    homeVisitFee: z.number().optional(),
    bankName: z.string().optional(),
    bankAccountNumber: z.string().optional(),
    bankBranch: z.string().optional(),
  }).superRefine((data, ctx) => {
    if (data.role === UserRole.DOCTOR) {
      if (!data.registrationNumber) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Registration number required", path: ["registrationNumber"] });
      if (!data.qualifications) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Qualifications required", path: ["qualifications"] });
      if (!data.specializationIds || data.specializationIds.length === 0) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Specializations required", path: ["specializationIds"] });
      if (!data.consultationTypes || data.consultationTypes.length === 0) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Consultation types required", path: ["consultationTypes"] });
      if (data.consultationFee === undefined) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Consultation fee required", path: ["consultationFee"] });
    }
  });

  app.post("/api/auth/complete-registration", async (req: Request, res: Response) => {
    try {
      const payload = completeRegistrationSchema.parse(req.body);
      const decoded = verifyRegistrationToken(payload.registrationToken);
      if (!decoded?.id) {
        return res.status(401).json({ error: "Invalid or expired registration token" });
      }

      const user = await storage.getUser(decoded.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      if (user.registrationComplete) {
        return res.status(400).json({ error: "Registration already completed" });
      }

      const updates: any = {
        fullName: payload.fullName,
        phone: payload.phone,
        role: payload.role,
        provider: user.provider || decoded.provider || AuthProvider.LOCAL,
        registrationComplete: true,
        preferredLanguages: payload.preferredLanguages || user.preferredLanguages || [Language.ENGLISH],
        address: payload.address ?? user.address,
        city: payload.city ?? user.city,
        gender: payload.gender ?? user.gender,
        profileImage: payload.profileImage ?? user.profileImage,
        isEmailVerified: true,
      };

      let updatedUser = await storage.updateUser(user.id, updates);
      if (!updatedUser) {
        return res.status(500).json({ error: "Failed to update user" });
      }

      if (payload.role === UserRole.DOCTOR) {
        const doctorData = insertDoctorProfileSchema.parse({
          userId: updatedUser.id,
          registrationNumber: payload.registrationNumber,
          qualifications: payload.qualifications,
          biography: req.body.biography,
          specializationIds: payload.specializationIds || [],
          languagesSpoken: payload.languagesSpoken || [Language.ENGLISH],
          consultationTypes: payload.consultationTypes || [ConsultationType.IN_PERSON],
          consultationFee: payload.consultationFee || 0,
          onlineConsultationFee: payload.onlineConsultationFee,
          homeVisitFee: payload.homeVisitFee,
          verificationDocuments: req.body.verificationDocuments || [],
          bankName: payload.bankName,
          bankAccountNumber: payload.bankAccountNumber,
          bankBranch: payload.bankBranch,
          status: DoctorStatus.PENDING,
        });

        await storage.createDoctorProfile(doctorData);
      }

      updatedUser = await storage.getUser(user.id) || updatedUser;
      const token = generateToken({ id: updatedUser.id, email: updatedUser.email, role: updatedUser.role, fullName: updatedUser.fullName });
      const { password: _, ...userWithoutPassword } = updatedUser;

      res.json({ user: userWithoutPassword, token });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to complete registration" });
    }
  });

  app.post("/api/auth/login", loginLimiter, async (req: Request, res: Response) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      
      const user = await storage.getUserByEmail(email);
      if (!user || !(await verifyPassword(password, user.password))) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      if (!user.registrationComplete && user.provider !== AuthProvider.LOCAL) {
        return res.status(400).json({ error: "Please finish signing up with your social account before logging in." });
      }
      
      const token = generateToken({ id: user.id, email: user.email, role: user.role, fullName: user.fullName });
      
      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword, token });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Login failed" });
    }
  });

  // Google OAuth Configuration
  const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
  
  if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) {
    passport.use(new GoogleStrategy({
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: "/api/auth/google/callback",
      scope: ["profile", "email"],
    }, async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (!email) {
          return done(new Error("No email found in Google profile"), undefined);
        }

        let user = await storage.getUserByEmail(email);
        
        const baseUserData = {
          email,
          fullName: profile.displayName || email.split("@")[0],
          password: await hashPassword(randomUUID()),
          role: UserRole.PATIENT,
          phone: "",
          profileImage: profile.photos?.[0]?.value || null,
          googleId: profile.id,
          provider: AuthProvider.GOOGLE,
          providerId: profile.id,
          registrationComplete: false,
          isEmailVerified: true,
        };

        if (!user) {
          user = await storage.createUser(baseUserData as any);
        } else {
          const updates: any = {};
          if (!user.googleId) updates.googleId = profile.id;
          if (!user.provider) updates.provider = AuthProvider.GOOGLE;
          if (!user.providerId) updates.providerId = profile.id;
          if (user.registrationComplete === undefined) updates.registrationComplete = false;
          if (Object.keys(updates).length > 0) {
            user = await storage.updateUser(user.id, updates) as any ?? user;
          }
        }
        
        done(null, user);
      } catch (error) {
        done(error as Error, undefined);
      }
    }));

    app.get("/api/auth/google", passport.authenticate("google", { 
      scope: ["profile", "email"],
      session: false,
    }));

    app.get("/api/auth/google/callback", 
      passport.authenticate("google", { 
        failureRedirect: "/login?error=google_auth_failed",
        session: false,
      }),
      (req: Request, res: Response) => {
        const user = req.user as any;
        if (!user) {
          return res.redirect("/login?error=google_auth_failed");
        }
        
        const { password: _, ...userWithoutPassword } = user;

        if (!user.registrationComplete || !user.phone) {
          const registrationToken = generateRegistrationToken({ 
            id: user.id, 
            email: user.email, 
            provider: user.provider || AuthProvider.GOOGLE 
          });
          const userJson = encodeURIComponent(JSON.stringify({
            ...userWithoutPassword,
            registrationComplete: false,
          }));
          return res.redirect(`/auth/callback?status=incomplete&registrationToken=${registrationToken}&provider=google&user=${userJson}`);
        }

        const token = generateToken({ 
          id: user.id, 
          email: user.email, 
          role: user.role, 
          fullName: user.fullName 
        });

        const userJson = encodeURIComponent(JSON.stringify(userWithoutPassword));
        
        res.redirect(`/auth/callback?status=ok&token=${token}&user=${userJson}`);
      }
    );
  }
  else {
    app.get("/api/auth/google", (_req: Request, res: Response) => {
      res.status(503).json({ error: "Google OAuth is not configured on the server." });
    });
    app.get("/api/auth/google/callback", (_req: Request, res: Response) => {
      res.status(503).json({ error: "Google OAuth is not configured on the server." });
    });
  }

  const APPLE_CLIENT_ID = process.env.APPLE_CLIENT_ID;
  const APPLE_TEAM_ID = process.env.APPLE_TEAM_ID;
  const APPLE_KEY_ID = process.env.APPLE_KEY_ID;
  const APPLE_PRIVATE_KEY = process.env.APPLE_PRIVATE_KEY;

  if (APPLE_CLIENT_ID && APPLE_TEAM_ID && APPLE_KEY_ID && APPLE_PRIVATE_KEY) {
    try {
      const { Strategy: AppleStrategy } = await import("passport-apple");

      passport.use(new AppleStrategy({
        clientID: APPLE_CLIENT_ID,
        teamID: APPLE_TEAM_ID,
        keyID: APPLE_KEY_ID,
        key: APPLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
        callbackURL: "/api/auth/apple/callback",
        scope: ["name", "email"],
      }, async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.email;
          if (!email) {
            return done(new Error("No email found in Apple profile"), undefined);
          }

          let user = await storage.getUserByEmail(email);
          const baseUserData = {
            email,
            fullName: profile.name?.firstName 
              ? `${profile.name.firstName} ${profile.name?.lastName || ""}`.trim()
              : email.split("@")[0],
            password: await hashPassword(randomUUID()),
            role: UserRole.PATIENT,
            phone: "",
            profileImage: null,
            provider: AuthProvider.APPLE,
            providerId: profile.id || profile.user,
            registrationComplete: false,
            isEmailVerified: true,
          };

          if (!user) {
            user = await storage.createUser(baseUserData as any);
          } else {
            const updates: any = {};
            if (!user.providerId) updates.providerId = profile.id || profile.user;
            if (!user.provider) updates.provider = AuthProvider.APPLE;
            if (user.registrationComplete === undefined) updates.registrationComplete = false;
            if (Object.keys(updates).length > 0) {
              user = await storage.updateUser(user.id, updates) as any ?? user;
            }
          }

          done(null, user);
        } catch (error) {
          done(error as Error, undefined);
        }
      }));

      app.get("/api/auth/apple", passport.authenticate("apple", { session: false }));

      app.post("/api/auth/apple/callback",
        passport.authenticate("apple", { failureRedirect: "/login?error=apple_auth_failed", session: false }),
        (req: Request, res: Response) => {
          const user = req.user as any;
          if (!user) {
            return res.redirect("/login?error=apple_auth_failed");
          }

          const { password: _, ...userWithoutPassword } = user;

          if (!user.registrationComplete || !user.phone) {
            const registrationToken = generateRegistrationToken({ 
              id: user.id, 
              email: user.email, 
              provider: user.provider || AuthProvider.APPLE,
            });
            const userJson = encodeURIComponent(JSON.stringify({
              ...userWithoutPassword,
              registrationComplete: false,
            }));
            return res.redirect(`/auth/callback?status=incomplete&registrationToken=${registrationToken}&provider=apple&user=${userJson}`);
          }

          const token = generateToken({ 
            id: user.id, 
            email: user.email, 
            role: user.role, 
            fullName: user.fullName 
          });

          const userJson = encodeURIComponent(JSON.stringify(userWithoutPassword));
          res.redirect(`/auth/callback?status=ok&token=${token}&user=${userJson}`);
        }
      );
    } catch (err) {
      console.warn("Apple auth disabled: passport-apple not installed or failed to load.");
    }
  }

  app.get("/api/auth/me", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = await storage.getUser(req.user!.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const { password: _, ...userWithoutPassword } = user;
      
      let doctorProfile = null;
      if (user.role === UserRole.DOCTOR) {
        doctorProfile = await storage.getDoctorProfileByUserId(user.id);
      }
      
      res.json({ user: userWithoutPassword, doctorProfile });
    } catch (error) {
      res.status(500).json({ error: "Failed to get user" });
    }
  });

  app.post("/api/registration/session", async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      
      if (!email || typeof email !== "string" || !email.includes("@")) {
        return res.status(400).json({ error: "Valid email address is required" });
      }
      
      const clientIp = req.ip || req.socket.remoteAddress || "unknown";
      
      if (!checkSessionCreationLimit(clientIp)) {
        return res.status(429).json({ error: "Too many registration attempts. Please try again later." });
      }
      
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: "This email is already registered. Please login instead." });
      }
      
      const token = createRegistrationSession(email);
      res.json({ token, email });
    } catch (error) {
      res.status(500).json({ error: "Failed to create registration session" });
    }
  });

  app.post("/api/upload", uploadLimiter, upload.single("file"), async (req: Request, res: Response) => {
    try {
      const token = req.headers["x-registration-token"] as string;
      const email = req.headers["x-registration-email"] as string;
      const session = validateRegistrationSession(token);
      
      if (!session) {
        return res.status(401).json({ error: "Invalid or expired registration session" });
      }
      
      if (!email || email.toLowerCase() !== session.email) {
        return res.status(401).json({ error: "Email mismatch with registration session" });
      }
      
      if (session.uploadCount >= MAX_UPLOADS_PER_SESSION) {
        return res.status(429).json({ error: "Maximum uploads reached for this session" });
      }
      
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }
      
      // With Cloudinary, req.file.path contains the full cloud URL
      const fileUrl = req.file.path;
      session.uploadedFiles.push(fileUrl);
      session.uploadCount++;
      
      res.json({ 
        url: fileUrl, 
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        cloudinary: true // Indicates this is a Cloudinary URL
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to upload file" });
    }
  });

// Allow admins to fetch verification documents by redirecting to Cloudinary
  // Or access them directly via the Cloudinary URL stored in the database
  app.get("/api/documents/:filename", async (req: AuthenticatedRequest, res: Response) => {
    try {
      const authHeader = req.headers.authorization;
      const headerToken = authHeader?.startsWith("Bearer ")
        ? authHeader.split(" ")[1]
        : null;
      const queryToken = typeof req.query.token === "string" ? req.query.token : null;
      const token = headerToken || queryToken;
      const user = token ? verifyToken(token) : null;
      
      if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      if (user.role !== UserRole.ADMIN) {
        const doctorProfile = await storage.getDoctorProfileByUserId(user.id);
        // Check if the document URL belongs to this doctor's profile
        if (!doctorProfile || !doctorProfile.verificationDocuments?.some((doc: string) => 
          doc.includes(req.params.filename)
        )) {
          return res.status(403).json({ error: "Access denied" });
        }
      }
      
      // Find the full Cloudinary URL from the database
      const doctorProfile = await storage.getDoctorProfileByUserId(user.id);
      const documentUrl = doctorProfile?.verificationDocuments?.find((doc: string) => 
        doc.includes(req.params.filename)
      );
      
      if (!documentUrl) {
        return res.status(404).json({ error: "Document not found" });
      }
      
      // Redirect to Cloudinary URL (Cloudinary handles display/download)
      res.redirect(documentUrl);
    } catch (error) {
      res.status(500).json({ error: "Failed to serve document" });
    }
  });

  
  // ================== BLOG ROUTES ==================
  app.get("/api/blogs", async (_req: Request, res: Response) => {
    try {
      const blogs = await storage.getAllBlogs();
      res.json(blogs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch blogs" });
    }
  });

  app.post("/api/blogs", authMiddleware, roleMiddleware(UserRole.ADMIN), async (req: Request, res: Response) => {
    try {
      const blog = await storage.createBlog(req.body);
      res.status(201).json(blog);
    } catch (error) {
      res.status(500).json({ error: "Failed to create blog" });
    }
  });

  app.delete("/api/blogs/:id", authMiddleware, roleMiddleware(UserRole.ADMIN), async (req: Request, res: Response) => {
    try {
      await storage.deleteBlog(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete blog" });
    }
  });

  app.get("/api/specializations", async (_req: Request, res: Response) => {
    try {
      const specializations = await storage.getAllSpecializations();
      res.json(specializations);
    } catch (error) {
      res.status(500).json({ error: "Failed to get specializations" });
    }
  });

  app.post("/api/specializations", authMiddleware, roleMiddleware(UserRole.ADMIN), async (req: Request, res: Response) => {
    try {
      const data = insertSpecializationSchema.parse(req.body);
      const specialization = await storage.createSpecialization(data);

      // Announce new specialization to all patients
      const patients = await storage.getAllUsers("patient");
      await Promise.all(patients.map((p) =>
        storage.createNotification({
          userId: p.id,
          title: "New specialization available",
          message: `${specialization.name} is now available on AyurvedicDoctor. Book a consultation with our specialists today.`,
          type: "system",
          isRead: false,
        })
      ));

      res.status(201).json(specialization);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create specialization" });
    }
  });

  app.get("/api/hospitals", async (_req: Request, res: Response) => {
    try {
      const hospitals = await storage.getAllHospitals();
      res.json(hospitals);
    } catch (error) {
      res.status(500).json({ error: "Failed to get hospitals" });
    }
  });

  app.get("/api/hospitals/:id", async (req: Request, res: Response) => {
    try {
      const hospital = await storage.getHospital(req.params.id);
      if (!hospital) {
        return res.status(404).json({ error: "Hospital not found" });
      }
      res.json(hospital);
    } catch (error) {
      res.status(500).json({ error: "Failed to get hospital" });
    }
  });

  app.post("/api/hospitals", authMiddleware, roleMiddleware(UserRole.ADMIN), async (req: Request, res: Response) => {
    try {
      const data = insertHospitalSchema.parse(req.body);
      const hospital = await storage.createHospital(data);
      res.status(201).json(hospital);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create hospital" });
    }
  });

  app.get("/api/doctors", async (req: Request, res: Response) => {
    try {
      const filters: any = { status: DoctorStatus.VERIFIED };
      
      if (req.query.specializationId) filters.specializationId = req.query.specializationId as string;
      if (req.query.city) filters.city = req.query.city as string;
      if (req.query.minRating) filters.minRating = parseFloat(req.query.minRating as string);
      if (req.query.consultationType) filters.consultationType = req.query.consultationType as string;
      
      const doctors = await storage.getAllDoctors(filters);
      res.json(doctors);
    } catch (error) {
      res.status(500).json({ error: "Failed to get doctors" });
    }
  });

  app.get("/api/doctors/featured", async (_req: Request, res: Response) => {
    try {
      const doctors = await storage.getVerifiedDoctors();
      const featured = doctors
        .sort((a, b) => b.averageRating - a.averageRating)
        .slice(0, 6);
      res.json(featured);
    } catch (error) {
      res.status(500).json({ error: "Failed to get featured doctors" });
    }
  });

  app.get("/api/doctors/:id", async (req: Request, res: Response) => {
    try {
      const doctor = await storage.getDoctorWithDetails(req.params.id);
      if (!doctor) {
        return res.status(404).json({ error: "Doctor not found" });
      }
      res.json(doctor);
    } catch (error) {
      res.status(500).json({ error: "Failed to get doctor" });
    }
  });

  app.get("/api/doctors/:id/slots", async (req: Request, res: Response) => {
    try {
      const { date } = req.query;
      if (!date) {
        return res.status(400).json({ error: "Date is required" });
      }
      
      const slots = await storage.getAvailableSlots(req.params.id, date as string);
      res.json(slots);
    } catch (error) {
      res.status(500).json({ error: "Failed to get slots" });
    }
  });

  // Fetch a slot by id (used when returning from the doctor profile booking CTA)
  app.get("/api/slots/:id", async (req: Request, res: Response) => {
    try {
      const slot = await storage.getAppointmentSlot(req.params.id);
      if (!slot) {
        return res.status(404).json({ error: "Slot not found" });
      }
      res.json(slot);
    } catch (error) {
      res.status(500).json({ error: "Failed to get slot" });
    }
  });

  app.get("/api/doctors/:id/reviews", async (req: Request, res: Response) => {
    try {
      const reviews = await storage.getDoctorReviews(req.params.id);
      res.json(reviews);
    } catch (error) {
      res.status(500).json({ error: "Failed to get reviews" });
    }
  });

  app.get("/api/doctor/profile", authMiddleware, roleMiddleware(UserRole.DOCTOR), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const profile = await storage.getDoctorProfileByUserId(req.user!.id);
      if (!profile) {
        return res.status(404).json({ error: "Doctor profile not found" });
      }
      
      const doctor = await storage.getDoctorWithDetails(profile.id);
      res.json(doctor);
    } catch (error) {
      res.status(500).json({ error: "Failed to get doctor profile" });
    }
  });

  app.put("/api/doctor/profile", authMiddleware, roleMiddleware(UserRole.DOCTOR), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const profile = await storage.getDoctorProfileByUserId(req.user!.id);
      if (!profile) {
        return res.status(404).json({ error: "Doctor profile not found" });
      }
      
      const updated = await storage.updateDoctorProfile(profile.id, req.body);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  app.get("/api/doctor/schedules", authMiddleware, roleMiddleware(UserRole.DOCTOR), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const profile = await storage.getDoctorProfileByUserId(req.user!.id);
      if (!profile) {
        return res.status(404).json({ error: "Doctor profile not found" });
      }
      
      const schedules = await storage.getDoctorSchedules(profile.id);
      res.json(schedules);
    } catch (error) {
      res.status(500).json({ error: "Failed to get schedules" });
    }
  });

  app.post("/api/doctor/schedules", authMiddleware, roleMiddleware(UserRole.DOCTOR), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const profile = await storage.getDoctorProfileByUserId(req.user!.id);
      if (!profile) {
        return res.status(404).json({ error: "Doctor profile not found" });
      }
      
      const data = insertDoctorScheduleSchema.parse({ ...req.body, doctorId: profile.id });
      const schedule = await storage.createDoctorSchedule(data);
      res.status(201).json(schedule);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create schedule" });
    }
  });

  app.delete("/api/doctor/schedules/:id", authMiddleware, roleMiddleware(UserRole.DOCTOR), async (req: AuthenticatedRequest, res: Response) => {
    try {
      await storage.deleteDoctorSchedule(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete schedule" });
    }
  });

  app.get("/api/doctor/slots", authMiddleware, roleMiddleware(UserRole.DOCTOR), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const profile = await storage.getDoctorProfileByUserId(req.user!.id);
      if (!profile) {
        return res.status(404).json({ error: "Doctor profile not found" });
      }
      
      const { startDate, endDate } = req.query;
      if (!startDate || !endDate) {
        return res.status(400).json({ error: "Start and end dates are required" });
      }
      
      const slots = await storage.getDoctorSlots(profile.id, startDate as string, endDate as string);
      res.json(slots);
    } catch (error) {
      res.status(500).json({ error: "Failed to get slots" });
    }
  });

  app.post("/api/doctor/slots", authMiddleware, roleMiddleware(UserRole.DOCTOR), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const profile = await storage.getDoctorProfileByUserId(req.user!.id);
      if (!profile) {
        return res.status(404).json({ error: "Doctor profile not found" });
      }
      
      const data = insertAppointmentSlotSchema.parse({ ...req.body, doctorId: profile.id });
      const slot = await storage.createAppointmentSlot(data);
      res.status(201).json(slot);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create slot" });
    }
  });

  app.patch("/api/doctor/slots/:id/block", authMiddleware, roleMiddleware(UserRole.DOCTOR), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const slot = await storage.blockSlot(req.params.id);
      res.json(slot);
    } catch (error) {
      res.status(500).json({ error: "Failed to block slot" });
    }
  });

  app.patch("/api/doctor/slots/:id/unblock", authMiddleware, roleMiddleware(UserRole.DOCTOR), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const slot = await storage.unblockSlot(req.params.id);
      res.json(slot);
    } catch (error) {
      res.status(500).json({ error: "Failed to unblock slot" });
    }
  });

  app.delete("/api/slots/:id", authMiddleware, roleMiddleware(UserRole.DOCTOR), async (req: AuthenticatedRequest, res: Response) => {
    try {
      // Verify the slot belongs to this doctor
      const profile = await storage.getDoctorProfileByUserId(req.user!.id);
      if (!profile) {
        return res.status(404).json({ error: "Doctor profile not found" });
      }
      
      const slot = await storage.getAppointmentSlot(req.params.id);
      if (!slot) {
        return res.status(404).json({ error: "Slot not found" });
      }
      
      if (slot.doctorId !== profile.id) {
        return res.status(403).json({ error: "Not authorized to delete this slot" });
      }
      
      if (slot.isBooked) {
        return res.status(400).json({ error: "Cannot delete a booked slot" });
      }
      
      const success = await storage.deleteSlot(req.params.id);
      if (success) {
        res.json({ success: true, message: "Slot deleted successfully" });
      } else {
        res.status(500).json({ error: "Failed to delete slot" });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to delete slot" });
    }
  });

  app.get("/api/doctor/appointments", authMiddleware, roleMiddleware(UserRole.DOCTOR), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const profile = await storage.getDoctorProfileByUserId(req.user!.id);
      if (!profile) {
        return res.status(404).json({ error: "Doctor profile not found" });
      }
      
      const { date } = req.query;
      const appointments = await storage.getDoctorAppointments(profile.id, date as string | undefined);
      res.json(appointments);
    } catch (error) {
      res.status(500).json({ error: "Failed to get appointments" });
    }
  });

  app.get("/api/doctor/dashboard", authMiddleware, roleMiddleware(UserRole.DOCTOR), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const profile = await storage.getDoctorProfileByUserId(req.user!.id);
      if (!profile) {
        return res.status(404).json({ error: "Doctor profile not found" });
      }
      
      const stats = await storage.getDoctorDashboardStats(profile.id);
      const today = new Date().toISOString().split('T')[0];
      const todayAppointments = await storage.getDoctorAppointments(profile.id, today);
      const upcomingAppointments = await storage.getDoctorAppointments(profile.id);
      
      res.json({
        stats,
        todayAppointments: todayAppointments.filter(a => 
          [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED].includes(a.status as any)
        ),
        upcomingAppointments: upcomingAppointments.filter(a => 
          a.appointmentDate >= today && 
          [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED].includes(a.status as any)
        ).slice(0, 10),
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to get dashboard stats" });
    }
  });

  app.get("/api/doctor/patients", authMiddleware, roleMiddleware(UserRole.DOCTOR), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const profile = await storage.getDoctorProfileByUserId(req.user!.id);
      if (!profile) {
        return res.status(404).json({ error: "Doctor profile not found" });
      }
      
      const patients = await storage.getDoctorPatients(profile.id);
      res.json(patients);
    } catch (error) {
      res.status(500).json({ error: "Failed to get patients" });
    }
  });

  app.get("/api/doctor/reviews", authMiddleware, roleMiddleware(UserRole.DOCTOR), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const profile = await storage.getDoctorProfileByUserId(req.user!.id);
      if (!profile) {
        return res.status(404).json({ error: "Doctor profile not found" });
      }
      
      const reviews = await storage.getDoctorReviews(profile.id);
      res.json(reviews);
    } catch (error) {
      res.status(500).json({ error: "Failed to get reviews" });
    }
  });

  app.patch("/api/doctor/reviews/:id/respond", authMiddleware, roleMiddleware(UserRole.DOCTOR), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { response } = req.body;
      if (!response || typeof response !== 'string') {
        return res.status(400).json({ error: "Response is required" });
      }
      
      const review = await storage.getReview(req.params.id);
      if (!review) {
        return res.status(404).json({ error: "Review not found" });
      }
      
      const profile = await storage.getDoctorProfileByUserId(req.user!.id);
      if (!profile || review.doctorId !== profile.id) {
        return res.status(403).json({ error: "Forbidden" });
      }
      
      const updatedReview = await storage.respondToReview(req.params.id, response);
      res.json(updatedReview);
    } catch (error) {
      res.status(500).json({ error: "Failed to respond to review" });
    }
  });

  app.get("/api/doctor/earnings", authMiddleware, roleMiddleware(UserRole.DOCTOR), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const profile = await storage.getDoctorProfileByUserId(req.user!.id);
      if (!profile) {
        return res.status(404).json({ error: "Doctor profile not found" });
      }
      
      const summary = await storage.getDoctorEarningsSummary(profile.id);
      const payments = await storage.getDoctorPayments(profile.id);
      
      res.json({ summary, payments });
    } catch (error) {
      res.status(500).json({ error: "Failed to get earnings" });
    }
  });

  app.patch("/api/doctor/appointments/:id/call", authMiddleware, roleMiddleware(UserRole.DOCTOR), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const appointment = await storage.getAppointment(req.params.id);
      if (!appointment) {
        return res.status(404).json({ error: "Appointment not found" });
      }
      
      const profile = await storage.getDoctorProfileByUserId(req.user!.id);
      if (!profile || appointment.doctorId !== profile.id) {
        return res.status(403).json({ error: "Forbidden" });
      }
      
      const updated = await storage.markAppointmentAsCalled(req.params.id);
      
      if (updated) {
        await storage.createNotification({
          userId: updated.patientId,
          title: "You're Being Called",
          message: "The doctor is ready for you. Please proceed to the consultation room.",
          type: "appointment",
          relatedId: updated.id,
        });
      }
      
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to mark appointment as called" });
    }
  });

  app.patch("/api/doctor/appointments/:id/no-show", authMiddleware, roleMiddleware(UserRole.DOCTOR), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const appointment = await storage.getAppointment(req.params.id);
      if (!appointment) {
        return res.status(404).json({ error: "Appointment not found" });
      }
      
      const profile = await storage.getDoctorProfileByUserId(req.user!.id);
      if (!profile || appointment.doctorId !== profile.id) {
        return res.status(403).json({ error: "Forbidden" });
      }
      
      const updated = await storage.markAppointmentNoShow(req.params.id);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to mark appointment as no-show" });
    }
  });

  app.post("/api/appointments", authMiddleware, roleMiddleware(UserRole.PATIENT), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const bookingData = bookingSchema.parse(req.body);
      
      const slot = await storage.getAppointmentSlot(bookingData.slotId);
      if (!slot || slot.isBooked || slot.isBlocked) {
        return res.status(400).json({ error: "Slot not available" });
      }
      
      const doctor = await storage.getDoctorProfile(bookingData.doctorId);
      if (!doctor || doctor.status !== DoctorStatus.VERIFIED) {
        return res.status(400).json({ error: "Doctor not available" });
      }
      
      const appointmentData = {
        patientId: req.user!.id,
        doctorId: bookingData.doctorId,
        slotId: bookingData.slotId,
        hospitalId: bookingData.hospitalId,
        appointmentDate: slot.date,
        appointmentTime: slot.startTime,
        consultationType: bookingData.consultationType,
        symptoms: bookingData.symptoms,
        isForDependent: bookingData.isForDependent,
        dependentName: bookingData.dependentName,
        dependentAge: bookingData.dependentAge,
        dependentGender: bookingData.dependentGender,
        dependentContact: bookingData.dependentContact,
        status: AppointmentStatus.PENDING,
      };
      
      const appointment = await storage.createAppointment(appointmentData);
      
      let consultationFee = doctor.consultationFee;
      if (bookingData.consultationType === "online" && doctor.onlineConsultationFee) {
        consultationFee = doctor.onlineConsultationFee;
      } else if (bookingData.consultationType === "home_visit" && doctor.homeVisitFee) {
        consultationFee = doctor.homeVisitFee;
      }
      
      // Get platform settings for fee calculations
      const platformSettings = await storage.getPlatformSettings();
      const bookingCharges = platformSettings.bookingCharges;
      const tax = Math.round(consultationFee * (platformSettings.taxRate / 100));
      const platformCommission = Math.round(consultationFee * (platformSettings.platformCommissionRate / 100));
      const doctorEarnings = consultationFee - platformCommission;
      const totalAmount = consultationFee + bookingCharges + tax;
      
      const paymentData = {
        appointmentId: appointment.id,
        patientId: req.user!.id,
        doctorId: bookingData.doctorId,
        consultationFee,
        bookingCharges,
        tax,
        platformCommission,
        doctorEarnings,
        totalAmount,
        status: bookingData.paymentMethod === PaymentMethod.ONLINE ? PaymentStatus.PENDING : PaymentStatus.PENDING,
        method: bookingData.paymentMethod,
      };
      
      await storage.createPayment(paymentData);
      
      await storage.createNotification({
        userId: req.user!.id,
        title: "Appointment Booked",
        message: `Your appointment with ${doctor.registrationNumber} has been booked for ${slot.date} at ${slot.startTime}`,
        type: "appointment",
        relatedId: appointment.id,
      });
      
      const fullAppointment = await storage.getAppointmentWithDetails(appointment.id);
      res.status(201).json(fullAppointment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to book appointment" });
    }
  });

  app.get("/api/appointments", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
      let appointments;
      
      if (req.user!.role === UserRole.PATIENT) {
        appointments = await storage.getPatientAppointments(req.user!.id);
      } else if (req.user!.role === UserRole.DOCTOR) {
        const profile = await storage.getDoctorProfileByUserId(req.user!.id);
        if (!profile) {
          return res.status(404).json({ error: "Doctor profile not found" });
        }
        appointments = await storage.getDoctorAppointments(profile.id);
      } else {
        return res.status(403).json({ error: "Forbidden" });
      }
      
      res.json(appointments);
    } catch (error) {
      res.status(500).json({ error: "Failed to get appointments" });
    }
  });

  app.get("/api/appointments/:id", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const appointment = await storage.getAppointmentWithDetails(req.params.id);
      if (!appointment) {
        return res.status(404).json({ error: "Appointment not found" });
      }
      
      if (req.user!.role === UserRole.PATIENT && appointment.patientId !== req.user!.id) {
        return res.status(403).json({ error: "Forbidden" });
      }
      
      if (req.user!.role === UserRole.DOCTOR) {
        const profile = await storage.getDoctorProfileByUserId(req.user!.id);
        if (!profile || appointment.doctorId !== profile.id) {
          return res.status(403).json({ error: "Forbidden" });
        }
      }
      
      res.json(appointment);
    } catch (error) {
      res.status(500).json({ error: "Failed to get appointment" });
    }
  });

  app.patch("/api/appointments/:id/confirm", authMiddleware, roleMiddleware(UserRole.DOCTOR), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const appointment = await storage.updateAppointment(req.params.id, { status: AppointmentStatus.CONFIRMED });
      
      if (appointment) {
        const doctorProfile = await storage.getDoctorProfile(appointment.doctorId);
        const doctorUser = doctorProfile ? await storage.getUser(doctorProfile.userId) : null;
        const doctorName = doctorUser?.fullName || "your doctor";
        const [yr, mo, dy] = appointment.appointmentDate.split("-");
        const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
        const formattedDate = `${parseInt(dy)} ${months[parseInt(mo) - 1]}`;

        await storage.createNotification({
          userId: appointment.patientId,
          title: "Appointment Confirmed",
          message: `Your consultation with Dr. ${doctorName} on ${formattedDate} at ${appointment.appointmentTime} has been confirmed.`,
          type: "appointment",
          isRead: false,
          relatedId: appointment.id,
        });
      }

      res.json(appointment);
    } catch (error) {
      res.status(500).json({ error: "Failed to confirm appointment" });
    }
  });

  app.patch("/api/appointments/:id/reschedule", authMiddleware, roleMiddleware(UserRole.DOCTOR), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { newSlotId, reason } = req.body;

      const appointment = await storage.getAppointment(req.params.id);
      if (!appointment) return res.status(404).json({ error: "Appointment not found" });

      const profile = await storage.getDoctorProfileByUserId(req.user!.id);
      if (!profile || appointment.doctorId !== profile.id) {
        return res.status(403).json({ error: "Forbidden" });
      }

      const newSlot = await storage.getAppointmentSlot(newSlotId);
      if (!newSlot || newSlot.isBooked || newSlot.isBlocked) {
        return res.status(400).json({ error: "New slot not available" });
      }

      const doctorUser = await storage.getUser(profile.userId);
      const doctorName = doctorUser?.fullName || "your doctor";

      const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
      const [,omo,ody] = appointment.appointmentDate.split("-");
      const originalDate = `${parseInt(ody)} ${months[parseInt(omo) - 1]}`;
      const [,nmo,ndy] = newSlot.date.split("-");
      const newDate = `${parseInt(ndy)} ${months[parseInt(nmo) - 1]}`;

      await storage.updateAppointmentSlot(appointment.slotId, { isBooked: false });
      await storage.updateAppointmentSlot(newSlotId, { isBooked: true });

      const updated = await storage.updateAppointment(req.params.id, {
        slotId: newSlotId,
        appointmentDate: newSlot.date,
        appointmentTime: newSlot.startTime,
      });

      await storage.createNotification({
        userId: appointment.patientId,
        title: "Appointment Rescheduled",
        message: `Dr. ${doctorName} has rescheduled your ${originalDate} session to ${newDate} at ${newSlot.startTime} due to an emergency.`,
        type: "appointment",
        isRead: false,
        relatedId: appointment.id,
      });

      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to reschedule appointment" });
    }
  });

  app.patch("/api/appointments/:id/complete", authMiddleware, roleMiddleware(UserRole.DOCTOR), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { consultationNotes } = req.body;
      const appointment = await storage.updateAppointment(req.params.id, { 
        status: AppointmentStatus.COMPLETED,
        consultationNotes,
      });
      
      const payment = await storage.getPaymentByAppointment(req.params.id);
      if (payment) {
        await storage.updatePayment(payment.id, { status: PaymentStatus.COMPLETED });
      }

      if (appointment) {
        const doctorProfile = await storage.getDoctorProfile(appointment.doctorId);
        const doctorUser = doctorProfile ? await storage.getUser(doctorProfile.userId) : null;
        const doctorName = doctorUser?.fullName || "your doctor";

        await storage.createNotification({
          userId: appointment.patientId,
          title: "Doctor approved your request",
          message: `Dr. ${doctorName} has reviewed your referral request and approved specialist care.`,
          type: "system",
          isRead: false,
          relatedId: appointment.id,
        });

        if (payment) {
          const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
          const [,mo,dy] = appointment.appointmentDate.split("-");
          const formattedDate = `${parseInt(dy)} ${months[parseInt(mo) - 1]}`;
          const formattedAmount = `LKR ${payment.totalAmount.toLocaleString("en-LK")}`;

          await storage.createNotification({
            userId: appointment.patientId,
            title: "Payment successful",
            message: `${formattedAmount} was successfully charged for your consultation on ${formattedDate}. Receipt has been emailed.`,
            type: "payment",
            isRead: false,
            relatedId: payment.id,
          });
        }
      }

      res.json(appointment);
    } catch (error) {
      res.status(500).json({ error: "Failed to complete appointment" });
    }
  });

  app.patch("/api/appointments/:id/cancel", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { reason } = req.body;
      const existing = await storage.getAppointment(req.params.id);
      const appointment = await storage.cancelAppointment(req.params.id, reason, req.user!.role);

      if (appointment && existing) {
        const doctorProfile = await storage.getDoctorProfile(existing.doctorId);
        const doctorUser = doctorProfile ? await storage.getUser(doctorProfile.userId) : null;
        const doctorName = doctorUser?.fullName || "your doctor";
        const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
        const [,mo,dy] = existing.appointmentDate.split("-");
        const formattedDate = `${parseInt(dy)} ${months[parseInt(mo) - 1]}`;

        await storage.createNotification({
          userId: existing.patientId,
          title: "Appointment cancelled",
          message: `Your ${formattedDate} appointment with Dr. ${doctorName} has been cancelled. You may rebook at your convenience.`,
          type: "appointment",
          isRead: false,
          relatedId: appointment.id,
        });
      }

      res.json(appointment);
    } catch (error) {
      res.status(500).json({ error: "Failed to cancel appointment" });
    }
  });

  app.patch("/api/payments/:id/fail", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { lastFourDigits } = req.body;

      const payment = await storage.getPayment(req.params.id);
      if (!payment) return res.status(404).json({ error: "Payment not found" });

      if (req.user!.role !== UserRole.ADMIN && req.user!.id !== payment.patientId) {
        return res.status(403).json({ error: "Forbidden" });
      }

      const updated = await storage.updatePayment(req.params.id, { status: PaymentStatus.FAILED });

      const formattedAmount = `LKR ${payment.totalAmount.toLocaleString("en-LK")}`;
      const last4 = lastFourDigits || "0000";

      await storage.createNotification({
        userId: payment.patientId,
        title: "Payment Failed",
        message: `We were unable to charge your card ending in ${last4} for ${formattedAmount}. Please update your payment method.`,
        type: "payment",
        isRead: false,
        relatedId: payment.id,
      });

      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update payment status" });
    }
  });

  app.post("/api/appointments/:id/prescription", authMiddleware, roleMiddleware(UserRole.DOCTOR), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const appointment = await storage.getAppointment(req.params.id);
      if (!appointment) {
        return res.status(404).json({ error: "Appointment not found" });
      }
      
      const data = insertPrescriptionSchema.parse({
        ...req.body,
        appointmentId: appointment.id,
        patientId: appointment.patientId,
        doctorId: appointment.doctorId,
      });
      
      const prescription = await storage.createPrescription(data);
      
      await storage.createNotification({
        userId: appointment.patientId,
        title: "New Prescription",
        message: "Your doctor has created a new prescription for you",
        type: "appointment",
        relatedId: prescription.id,
      });
      
      res.status(201).json(prescription);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create prescription" });
    }
  });

  app.post("/api/appointments/:id/review", authMiddleware, roleMiddleware(UserRole.PATIENT), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const appointment = await storage.getAppointment(req.params.id);
      if (!appointment) {
        return res.status(404).json({ error: "Appointment not found" });
      }
      
      if (appointment.patientId !== req.user!.id) {
        return res.status(403).json({ error: "Forbidden" });
      }
      
      if (appointment.status !== AppointmentStatus.COMPLETED) {
        return res.status(400).json({ error: "Can only review completed appointments" });
      }
      
      const existingReview = await storage.getReviewByAppointment(req.params.id);
      if (existingReview) {
        return res.status(400).json({ error: "Review already exists" });
      }
      
      const data = insertReviewSchema.parse({
        ...req.body,
        appointmentId: appointment.id,
        patientId: req.user!.id,
        doctorId: appointment.doctorId,
      });
      
      const review = await storage.createReview(data);
      res.status(201).json(review);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create review" });
    }
  });

  app.get("/api/prescriptions", authMiddleware, roleMiddleware(UserRole.PATIENT), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const prescriptions = await storage.getPatientPrescriptions(req.user!.id);
      res.json(prescriptions);
    } catch (error) {
      res.status(500).json({ error: "Failed to get prescriptions" });
    }
  });

  app.get("/api/prescriptions/:id", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const prescription = await storage.getPrescription(req.params.id);
      if (!prescription) {
        return res.status(404).json({ error: "Prescription not found" });
      }
      
      if (req.user!.role === UserRole.PATIENT && prescription.patientId !== req.user!.id) {
        return res.status(403).json({ error: "Forbidden" });
      }
      
      res.json(prescription);
    } catch (error) {
      res.status(500).json({ error: "Failed to get prescription" });
    }
  });

  app.get("/api/patient/dashboard", authMiddleware, roleMiddleware(UserRole.PATIENT), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const stats = await storage.getPatientDashboardStats(req.user!.id);
      const allAppointments = await storage.getPatientAppointments(req.user!.id);
      
      const today = new Date().toISOString().split('T')[0];
      const upcomingAppointments = allAppointments.filter(a => 
        a.appointmentDate >= today && 
        [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED].includes(a.status as any)
      ).slice(0, 5);
      
      const recentAppointments = allAppointments.filter(a => 
        a.status === AppointmentStatus.COMPLETED
      ).slice(0, 5);
      
      res.json({
        stats,
        upcomingAppointments,
        recentAppointments,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to get dashboard stats" });
    }
  });

  app.get("/api/patient/reviews", authMiddleware, roleMiddleware(UserRole.PATIENT), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const reviews = await storage.getPatientReviews(req.user!.id);
      res.json(reviews);
    } catch (error) {
      res.status(500).json({ error: "Failed to get reviews" });
    }
  });

  app.get("/api/notifications", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const notifications = await storage.getUserNotifications(req.user!.id);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ error: "Failed to get notifications" });
    }
  });

  app.get("/api/notifications/unread", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const notifications = await storage.getUnreadNotifications(req.user!.id);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ error: "Failed to get notifications" });
    }
  });

  app.patch("/api/notifications/:id/read", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const notification = await storage.markNotificationRead(req.params.id);
      res.json(notification);
    } catch (error) {
      res.status(500).json({ error: "Failed to mark notification as read" });
    }
  });

  app.patch("/api/notifications/read-all", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
      await storage.markAllNotificationsRead(req.user!.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to mark all notifications as read" });
    }
  });

  app.get("/api/admin/dashboard", authMiddleware, roleMiddleware(UserRole.ADMIN), async (_req: Request, res: Response) => {
    try {
      const stats = await storage.getAdminDashboardStats();
      const pendingDoctors = await storage.getPendingDoctors();
      
      res.json({
        stats,
        pendingDoctors: pendingDoctors.slice(0, 5),
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to get dashboard stats" });
    }
  });

  app.get("/api/admin/doctors/pending", authMiddleware, roleMiddleware(UserRole.ADMIN), async (_req: Request, res: Response) => {
    try {
      const doctors = await storage.getPendingDoctors();
      res.json(doctors);
    } catch (error) {
      res.status(500).json({ error: "Failed to get pending doctors" });
    }
  });

  app.get("/api/admin/doctors", authMiddleware, roleMiddleware(UserRole.ADMIN), async (req: Request, res: Response) => {
    try {
      const { status } = req.query;
      const filters = status ? { status: status as string } : undefined;
      const doctors = await storage.getAllDoctors(filters);
      res.json(doctors);
    } catch (error) {
      res.status(500).json({ error: "Failed to get doctors" });
    }
  });

  app.patch("/api/admin/doctors/:id/verify", authMiddleware, roleMiddleware(UserRole.ADMIN), async (req: Request, res: Response) => {
    try {
      await storage.updateDoctorProfile(req.params.id, { rejectionReason: null });
      const doctor = await storage.updateDoctorStatus(req.params.id, DoctorStatus.VERIFIED);
      
      if (doctor) {
        await storage.createNotification({
          userId: doctor.userId,
          title: "Account Verified",
          message: "Congratulations! Your doctor account has been verified. You can now accept appointments.",
          type: "verification",
        });
      }
      
      res.json(doctor);
    } catch (error) {
      res.status(500).json({ error: "Failed to verify doctor" });
    }
  });

  app.patch("/api/admin/doctors/:id/reject", authMiddleware, roleMiddleware(UserRole.ADMIN), async (req: Request, res: Response) => {
    try {
      const { reason } = req.body;
      const doctor = await storage.updateDoctorStatus(req.params.id, DoctorStatus.REJECTED, reason);
      
      if (doctor) {
        await storage.createNotification({
          userId: doctor.userId,
          title: "Account Rejected",
          message: reason || "Your doctor account verification was not approved.",
          type: "verification",
        });
      }
      
      res.json(doctor);
    } catch (error) {
      res.status(500).json({ error: "Failed to reject doctor" });
    }
  });

  app.patch("/api/admin/doctors/:id/suspend", authMiddleware, roleMiddleware(UserRole.ADMIN), async (req: Request, res: Response) => {
    try {
      await storage.updateDoctorProfile(req.params.id, { rejectionReason: null });
      const doctor = await storage.updateDoctorStatus(req.params.id, DoctorStatus.SUSPENDED);
      
      if (doctor) {
        await storage.createNotification({
          userId: doctor.userId,
          title: "Account Suspended",
          message: "Your doctor account has been suspended. Please contact support for more information.",
          type: "verification",
        });
      }
      
      res.json(doctor);
    } catch (error) {
      res.status(500).json({ error: "Failed to suspend doctor" });
    }
  });

  app.get("/api/admin/users", authMiddleware, roleMiddleware(UserRole.ADMIN), async (req: Request, res: Response) => {
    try {
      const { role } = req.query;
      const users = await storage.getAllUsers(role as string | undefined);
      const usersWithoutPasswords = users.map(({ password: _, ...user }) => user);
      res.json(usersWithoutPasswords);
    } catch (error) {
      res.status(500).json({ error: "Failed to get users" });
    }
  });

  app.patch("/api/admin/users/:id/suspend", authMiddleware, roleMiddleware(UserRole.ADMIN), async (req: Request, res: Response) => {
    try {
      const user = await storage.updateUserStatus(req.params.id, false);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Failed to suspend user:", error);
      res.status(500).json({ error: "Failed to suspend user" });
    }
  });

  app.patch("/api/admin/users/:id/reactivate", authMiddleware, roleMiddleware(UserRole.ADMIN), async (req: Request, res: Response) => {
    try {
      const user = await storage.updateUserStatus(req.params.id, true);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Failed to reactivate user:", error);
      res.status(500).json({ error: "Failed to reactivate user" });
    }
  });

  app.patch("/api/admin/reviews/:id/hide", authMiddleware, roleMiddleware(UserRole.ADMIN), async (req: Request, res: Response) => {
    try {
      const review = await storage.hideReview(req.params.id);
      res.json(review);
    } catch (error) {
      res.status(500).json({ error: "Failed to hide review" });
    }
  });

  app.get("/api/admin/appointments", authMiddleware, roleMiddleware(UserRole.ADMIN), async (req: Request, res: Response) => {
    try {
      const { status, date, doctorId, patientId } = req.query;
      const allAppointments = await storage.getAllAppointments();
      
      let filtered = allAppointments;
      if (status) {
        filtered = filtered.filter(a => a.status === status);
      }
      if (date) {
        filtered = filtered.filter(a => a.appointmentDate === date);
      }
      if (doctorId) {
        filtered = filtered.filter(a => a.doctorId === doctorId);
      }
      if (patientId) {
        filtered = filtered.filter(a => a.patientId === patientId);
      }
      
      res.json(filtered);
    } catch (error) {
      res.status(500).json({ error: "Failed to get appointments" });
    }
  });

  app.get("/api/admin/payments", authMiddleware, roleMiddleware(UserRole.ADMIN), async (req: Request, res: Response) => {
    try {
      const { status, method, startDate, endDate } = req.query;
      const payments = await storage.getAllPayments();
      
      let filtered = payments;
      if (status) {
        filtered = filtered.filter(p => p.status === status);
      }
      if (method) {
        filtered = filtered.filter(p => p.method === method);
      }
      if (startDate) {
        filtered = filtered.filter(p => p.createdAt >= (startDate as string));
      }
      if (endDate) {
        filtered = filtered.filter(p => p.createdAt <= (endDate as string));
      }
      
      res.json(filtered);
    } catch (error) {
      res.status(500).json({ error: "Failed to get payments" });
    }
  });

  app.patch("/api/admin/payments/:id/refund", authMiddleware, roleMiddleware(UserRole.ADMIN), async (req: Request, res: Response) => {
    try {
      const { refundAmount, refundReason } = req.body;
      const payment = await storage.updatePayment(req.params.id, {
        status: PaymentStatus.REFUNDED,
        refundAmount,
        refundReason,
        refundDate: new Date().toISOString().split('T')[0],
      });
      res.json(payment);
    } catch (error) {
      res.status(500).json({ error: "Failed to refund payment" });
    }
  });

  // Public booking settings endpoint (for fee calculations - only online payments available)
  app.get("/api/booking-settings", async (_req: Request, res: Response) => {
    try {
      const settings = await storage.getPlatformSettings();
      const payload = {
        platformCommissionRate: Number(settings.platformCommissionRate ?? 0),
        bookingCharges: Number(settings.bookingCharges ?? 0),
        taxRate: Number(settings.taxRate ?? 0),
      };

      console.log("Returning booking settings:", payload);
      // Prevent caching to ensure fresh settings
      res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');
      // Expose fee configuration to public
      res.json(payload);
    } catch (error) {
      console.error("Failed to get booking settings:", error);
      res.status(500).json({ error: "Failed to get booking settings" });
    }
  });

  // Platform Settings endpoints
  app.get("/api/admin/settings", authMiddleware, roleMiddleware(UserRole.ADMIN), async (_req: Request, res: Response) => {
    try {
      const settings = await storage.getPlatformSettings();
      res.json(settings);
    } catch (error) {
      console.error("Failed to get platform settings:", error);
      res.status(500).json({ error: "Failed to get platform settings" });
    }
  });

  app.put("/api/admin/settings", authMiddleware, roleMiddleware(UserRole.ADMIN), async (req: Request, res: Response) => {
    try {
      console.log("Updating platform settings with:", {
        bookingCharges: req.body.bookingCharges,
        taxRate: req.body.taxRate,
        platformCommissionRate: req.body.platformCommissionRate,
      });
      const settings = await storage.updatePlatformSettings(req.body);
      console.log("Settings updated successfully:", {
        bookingCharges: settings.bookingCharges,
        taxRate: settings.taxRate,
        platformCommissionRate: settings.platformCommissionRate,
      });
      res.json(settings);
    } catch (error) {
      console.error("Failed to update platform settings:", error);
      res.status(500).json({ error: "Failed to update platform settings" });
    }
  });

  app.put("/api/admin/specializations/:id", authMiddleware, roleMiddleware(UserRole.ADMIN), async (req: Request, res: Response) => {
    try {
      const data = insertSpecializationSchema.parse(req.body);
      const specialization = await storage.updateSpecialization(req.params.id, data);
      res.json(specialization);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to update specialization" });
    }
  });

  app.delete("/api/admin/specializations/:id", authMiddleware, roleMiddleware(UserRole.ADMIN), async (req: Request, res: Response) => {
    try {
      await storage.deleteSpecialization(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete specialization" });
    }
  });

  // Profile image upload endpoint for authenticated users
  app.post("/api/users/profile-image", authMiddleware, upload.single("image"), async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No image uploaded" });
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(req.file.mimetype)) {
        try { fs.unlinkSync(req.file.path); } catch (e) {}
        return res.status(400).json({ error: "Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed." });
      }

      const imageUrl = `/uploads/${req.file.filename}`;
      
      // Update user's profile image
      const user = await storage.updateUser(req.user!.id, { profileImage: imageUrl });
      if (!user) {
        try { fs.unlinkSync(req.file.path); } catch (e) {}
        return res.status(404).json({ error: "User not found" });
      }

      const { password: _, ...userWithoutPassword } = user;
      res.json({ 
        url: imageUrl,
        user: userWithoutPassword
      });
    } catch (error) {
      console.error("Profile image upload error:", error);
      if (req.file) {
        try { fs.unlinkSync(req.file.path); } catch (e) {}
      }
      res.status(500).json({ error: "Failed to upload profile image" });
    }
  });

  app.put("/api/users/profile", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const allowedUpdates = ["fullName", "phone", "gender", "dateOfBirth", "address", "city", "preferredLanguages", "profileImage"];
      const updates: any = {};
      
      for (const key of allowedUpdates) {
        if (req.body[key] !== undefined) {
          updates[key] = req.body[key];
        }
      }
      
      const user = await storage.updateUser(req.user!.id, updates);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  app.put("/api/users/password", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { currentPassword, newPassword } = req.body;
      
      const user = await storage.getUser(req.user!.id);
      if (!user || !(await verifyPassword(currentPassword, user.password))) {
        return res.status(400).json({ error: "Current password is incorrect" });
      }
      
      const hashedPassword = await hashPassword(newPassword);
      await storage.updateUser(req.user!.id, { password: hashedPassword });
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to update password" });
    }
  });

  return httpServer;
}
