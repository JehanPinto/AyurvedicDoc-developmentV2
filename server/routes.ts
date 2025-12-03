import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { randomUUID } from "crypto";
import { createHash } from "crypto";
import bcrypt from "bcrypt";
import {
  insertUserSchema, loginSchema, insertDoctorProfileSchema,
  insertAppointmentSchema, insertPaymentSchema, insertPrescriptionSchema,
  insertReviewSchema, insertNotificationSchema, insertHospitalSchema,
  insertSpecializationSchema, insertDoctorScheduleSchema, insertAppointmentSlotSchema,
  bookingSchema, doctorSearchSchema,
  UserRole, DoctorStatus, AppointmentStatus, PaymentStatus, PaymentMethod,
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

const JWT_SECRET = process.env.SESSION_SECRET || "ayurvedic-doctor-secret-key-2024";

function generateToken(payload: object): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const body = Buffer.from(JSON.stringify({ ...payload, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 })).toString("base64url");
  const signature = createHash("sha256").update(`${header}.${body}.${JWT_SECRET}`).digest("base64url");
  return `${header}.${body}.${signature}`;
}

function verifyToken(token: string): { id: string; email: string; role: string; fullName: string } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    
    const [header, body, signature] = parts;
    const expectedSignature = createHash("sha256").update(`${header}.${body}.${JWT_SECRET}`).digest("base64url");
    
    if (signature !== expectedSignature) return null;
    
    const payload = JSON.parse(Buffer.from(body, "base64url").toString());
    if (payload.exp < Date.now()) return null;
    
    return { id: payload.id, email: payload.email, role: payload.role, fullName: payload.fullName };
  } catch {
    return null;
  }
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

  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const data = insertUserSchema.parse(req.body);
      
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

  app.post("/api/auth/register-doctor", async (req: Request, res: Response) => {
    try {
      const userData = insertUserSchema.parse({ ...req.body, role: UserRole.DOCTOR });
      
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ error: "Email already registered" });
      }
      
      const hashedPassword = await hashPassword(userData.password);
      const user = await storage.createUser({ ...userData, password: hashedPassword });
      
      const doctorData = insertDoctorProfileSchema.parse({
        userId: user.id,
        registrationNumber: req.body.registrationNumber,
        qualifications: req.body.qualifications,
        experienceYears: req.body.experienceYears || 0,
        specializationIds: req.body.specializationIds || [],
        languagesSpoken: req.body.languagesSpoken || ["english"],
        consultationTypes: req.body.consultationTypes || ["in_person"],
        consultationFee: req.body.consultationFee || 0,
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

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      
      const user = await storage.getUserByEmail(email);
      if (!user || !(await verifyPassword(password, user.password))) {
        return res.status(401).json({ error: "Invalid email or password" });
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
      
      const bookingCharges = 100;
      const tax = Math.round(consultationFee * 0.05);
      const platformCommission = Math.round(consultationFee * 0.1);
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
        await storage.createNotification({
          userId: appointment.patientId,
          title: "Appointment Confirmed",
          message: `Your appointment for ${appointment.appointmentDate} at ${appointment.appointmentTime} has been confirmed`,
          type: "appointment",
          relatedId: appointment.id,
        });
      }
      
      res.json(appointment);
    } catch (error) {
      res.status(500).json({ error: "Failed to confirm appointment" });
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
        await storage.createNotification({
          userId: appointment.patientId,
          title: "Appointment Completed",
          message: `Your appointment has been completed. Please leave a review!`,
          type: "appointment",
          relatedId: appointment.id,
        });
      }
      
      res.json(appointment);
    } catch (error) {
      res.status(500).json({ error: "Failed to complete appointment" });
    }
  });

  app.patch("/api/appointments/:id/cancel", authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { reason } = req.body;
      const appointment = await storage.cancelAppointment(req.params.id, reason, req.user!.role);
      res.json(appointment);
    } catch (error) {
      res.status(500).json({ error: "Failed to cancel appointment" });
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
      const doctor = await storage.updateDoctorStatus(req.params.id, DoctorStatus.REJECTED);
      
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
