import { z } from "zod";

// ================== ENUMS ==================
export const UserRole = {
  PATIENT: "patient",
  DOCTOR: "doctor",
  ADMIN: "admin",
} as const;

export const DoctorStatus = {
  PENDING: "pending",
  VERIFIED: "verified",
  REJECTED: "rejected",
  SUSPENDED: "suspended",
} as const;

export const AppointmentStatus = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
  NO_SHOW: "no_show",
} as const;

export const PaymentStatus = {
  PENDING: "pending",
  COMPLETED: "completed",
  REFUNDED: "refunded",
  FAILED: "failed",
} as const;

export const PaymentMethod = {
  ONLINE: "online",
  AT_CLINIC: "at_clinic",
} as const;

export const ConsultationType = {
  IN_PERSON: "in_person",
  ONLINE: "online",
  HOME_VISIT: "home_visit",
} as const;

export const DayOfWeek = {
  SUNDAY: "sunday",
  MONDAY: "monday",
  TUESDAY: "tuesday",
  WEDNESDAY: "wednesday",
  THURSDAY: "thursday",
  FRIDAY: "friday",
  SATURDAY: "saturday",
} as const;

export const Gender = {
  MALE: "male",
  FEMALE: "female",
  OTHER: "other",
} as const;

export const Language = {
  ENGLISH: "english",
  SINHALA: "sinhala",
  TAMIL: "tamil",
} as const;

// ================== USER SCHEMA ==================
export const insertUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  fullName: z.string().min(2, "Full name is required"),
  phone: z.string().min(10, "Valid phone number required"),
  role: z.enum([UserRole.PATIENT, UserRole.DOCTOR, UserRole.ADMIN]),
  nic: z.string().optional(),
  gender: z.enum([Gender.MALE, Gender.FEMALE, Gender.OTHER]).optional(),
  dateOfBirth: z.string().optional(),
  preferredLanguages: z.array(z.enum([Language.ENGLISH, Language.SINHALA, Language.TAMIL])).default([Language.ENGLISH]),
  profileImage: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  isEmailVerified: z.boolean().default(false),
  isPhoneVerified: z.boolean().default(false),
});

export type InsertUser = z.infer<typeof insertUserSchema>;

export interface User extends InsertUser {
  id: string;
  createdAt: string;
  updatedAt: string;
}

// ================== SPECIALIZATION SCHEMA ==================
export const insertSpecializationSchema = z.object({
  name: z.string().min(2, "Specialization name required"),
  description: z.string().optional(),
  icon: z.string().optional(),
});

export type InsertSpecialization = z.infer<typeof insertSpecializationSchema>;

export interface Specialization extends InsertSpecialization {
  id: string;
}

// ================== HOSPITAL/CLINIC SCHEMA ==================
export const insertHospitalSchema = z.object({
  name: z.string().min(2, "Hospital name required"),
  address: z.string().min(5, "Address required"),
  city: z.string().min(2, "City required"),
  contactNumber: z.string().min(10, "Contact number required"),
  email: z.string().email().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  parkingAvailable: z.boolean().default(false),
  directions: z.string().optional(),
});

export type InsertHospital = z.infer<typeof insertHospitalSchema>;

export interface Hospital extends InsertHospital {
  id: string;
}

// ================== DOCTOR PROFILE SCHEMA ==================
export const insertDoctorProfileSchema = z.object({
  userId: z.string(),
  registrationNumber: z.string().min(5, "Registration number required"),
  qualifications: z.string().min(10, "Qualifications required"),
  biography: z.string().optional(),
  experienceYears: z.number().min(0, "Experience years must be positive"),
  specializationIds: z.array(z.string()).min(1, "At least one specialization required"),
  languagesSpoken: z.array(z.enum([Language.ENGLISH, Language.SINHALA, Language.TAMIL])).min(1, "At least one language required"),
  consultationTypes: z.array(z.enum([ConsultationType.IN_PERSON, ConsultationType.ONLINE, ConsultationType.HOME_VISIT])).min(1),
  hospitalIds: z.array(z.string()).default([]),
  consultationFee: z.number().min(0, "Fee must be positive"),
  onlineConsultationFee: z.number().min(0).optional(),
  homeVisitFee: z.number().min(0).optional(),
  status: z.enum([DoctorStatus.PENDING, DoctorStatus.VERIFIED, DoctorStatus.REJECTED, DoctorStatus.SUSPENDED]).default(DoctorStatus.PENDING),
  verificationDocuments: z.array(z.string()).default([]),
  bankName: z.string().optional(),
  bankAccountNumber: z.string().optional(),
  bankBranch: z.string().optional(),
  isAvailable: z.boolean().default(true),
  maxAdvanceBookingDays: z.number().default(30),
  minBookingNoticeHours: z.number().default(2),
  slotDurationMinutes: z.number().default(30),
  bufferTimeMinutes: z.number().default(10),
});

export type InsertDoctorProfile = z.infer<typeof insertDoctorProfileSchema>;

export interface DoctorProfile extends InsertDoctorProfile {
  id: string;
  averageRating: number;
  totalReviews: number;
  totalAppointments: number;
  currentQueueNumber: number;
  createdAt: string;
  updatedAt: string;
}

// Extended doctor with user info for display
export interface DoctorWithDetails extends DoctorProfile {
  user: User;
  specializations: Specialization[];
  hospitals: Hospital[];
}

// ================== DOCTOR SCHEDULE SCHEMA ==================
export const insertDoctorScheduleSchema = z.object({
  doctorId: z.string(),
  hospitalId: z.string().optional(),
  dayOfWeek: z.enum([DayOfWeek.SUNDAY, DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY, DayOfWeek.THURSDAY, DayOfWeek.FRIDAY, DayOfWeek.SATURDAY]),
  startTime: z.string(), // HH:mm format
  endTime: z.string(),
  consultationType: z.enum([ConsultationType.IN_PERSON, ConsultationType.ONLINE, ConsultationType.HOME_VISIT]),
  isActive: z.boolean().default(true),
});

export type InsertDoctorSchedule = z.infer<typeof insertDoctorScheduleSchema>;

export interface DoctorSchedule extends InsertDoctorSchedule {
  id: string;
}

// ================== APPOINTMENT SLOT SCHEMA ==================
export const insertAppointmentSlotSchema = z.object({
  doctorId: z.string(),
  hospitalId: z.string().optional(),
  date: z.string(), // YYYY-MM-DD format
  startTime: z.string(), // HH:mm format
  endTime: z.string(),
  consultationType: z.enum([ConsultationType.IN_PERSON, ConsultationType.ONLINE, ConsultationType.HOME_VISIT]),
  isBooked: z.boolean().default(false),
  isBlocked: z.boolean().default(false),
});

export type InsertAppointmentSlot = z.infer<typeof insertAppointmentSlotSchema>;

export interface AppointmentSlot extends InsertAppointmentSlot {
  id: string;
}

// ================== APPOINTMENT SCHEMA ==================
export const insertAppointmentSchema = z.object({
  patientId: z.string(),
  doctorId: z.string(),
  slotId: z.string(),
  hospitalId: z.string().optional(),
  appointmentDate: z.string(),
  appointmentTime: z.string(),
  consultationType: z.enum([ConsultationType.IN_PERSON, ConsultationType.ONLINE, ConsultationType.HOME_VISIT]),
  status: z.enum([AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED, AppointmentStatus.COMPLETED, AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW]).default(AppointmentStatus.PENDING),
  symptoms: z.string().min(10, "Please describe your symptoms"),
  queueNumber: z.number().optional(),
  isCalled: z.boolean().default(false),
  isForDependent: z.boolean().default(false),
  dependentName: z.string().optional(),
  dependentAge: z.number().optional(),
  dependentGender: z.enum([Gender.MALE, Gender.FEMALE, Gender.OTHER]).optional(),
  dependentContact: z.string().optional(),
  consultationNotes: z.string().optional(),
  videoSessionId: z.string().optional(),
  cancelReason: z.string().optional(),
  cancelledBy: z.enum([UserRole.PATIENT, UserRole.DOCTOR, UserRole.ADMIN]).optional(),
});

export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;

export interface Appointment extends InsertAppointment {
  id: string;
  createdAt: string;
  updatedAt: string;
}

// Extended appointment with related data
export interface AppointmentWithDetails extends Appointment {
  patient: User;
  doctor: DoctorWithDetails;
  slot: AppointmentSlot;
  hospital?: Hospital;
  payment?: Payment;
  prescription?: Prescription;
  review?: Review;
}

// ================== PAYMENT SCHEMA ==================
export const insertPaymentSchema = z.object({
  appointmentId: z.string(),
  patientId: z.string(),
  doctorId: z.string(),
  consultationFee: z.number().min(0),
  bookingCharges: z.number().min(0).default(0),
  tax: z.number().min(0).default(0),
  platformCommission: z.number().min(0).default(0),
  doctorEarnings: z.number().min(0),
  totalAmount: z.number().min(0),
  status: z.enum([PaymentStatus.PENDING, PaymentStatus.COMPLETED, PaymentStatus.REFUNDED, PaymentStatus.FAILED]).default(PaymentStatus.PENDING),
  method: z.enum([PaymentMethod.ONLINE, PaymentMethod.AT_CLINIC]),
  transactionId: z.string().optional(),
  refundAmount: z.number().optional(),
  refundReason: z.string().optional(),
  refundDate: z.string().optional(),
});

export type InsertPayment = z.infer<typeof insertPaymentSchema>;

export interface Payment extends InsertPayment {
  id: string;
  createdAt: string;
  updatedAt: string;
}

// ================== PRESCRIPTION SCHEMA ==================
export const insertPrescriptionSchema = z.object({
  appointmentId: z.string(),
  patientId: z.string(),
  doctorId: z.string(),
  diagnosis: z.string(),
  medications: z.array(z.object({
    name: z.string(),
    dosage: z.string(),
    frequency: z.string(),
    duration: z.string(),
    instructions: z.string().optional(),
  })),
  treatments: z.array(z.string()).default([]),
  dietaryAdvice: z.string().optional(),
  lifestyleAdvice: z.string().optional(),
  followUpDate: z.string().optional(),
  additionalNotes: z.string().optional(),
});

export type InsertPrescription = z.infer<typeof insertPrescriptionSchema>;

export interface Prescription extends InsertPrescription {
  id: string;
  createdAt: string;
}

// ================== REVIEW SCHEMA ==================
export const insertReviewSchema = z.object({
  appointmentId: z.string(),
  patientId: z.string(),
  doctorId: z.string(),
  rating: z.number().min(1).max(5),
  comment: z.string().optional(),
  isHidden: z.boolean().default(false),
});

export type InsertReview = z.infer<typeof insertReviewSchema>;

export interface Review extends InsertReview {
  id: string;
  createdAt: string;
  updatedAt: string;
}

// Extended review with patient info
export interface ReviewWithPatient extends Review {
  patient: User;
}

// ================== NOTIFICATION SCHEMA ==================
export const insertNotificationSchema = z.object({
  userId: z.string(),
  title: z.string(),
  message: z.string(),
  type: z.enum(["appointment", "payment", "reminder", "system", "verification"]),
  isRead: z.boolean().default(false),
  relatedId: z.string().optional(),
});

export type InsertNotification = z.infer<typeof insertNotificationSchema>;

export interface Notification extends InsertNotification {
  id: string;
  createdAt: string;
}

// ================== AUTH SCHEMAS ==================
export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const registerPatientSchema = insertUserSchema.extend({
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
}).refine((data) => data.role === UserRole.PATIENT, {
  message: "Invalid role for patient registration",
  path: ["role"],
});

export type RegisterPatientInput = z.infer<typeof registerPatientSchema>;

export const registerDoctorSchema = insertUserSchema.extend({
  confirmPassword: z.string(),
  registrationNumber: z.string().min(5, "Registration number required"),
  qualifications: z.string().min(10, "Qualifications required"),
  experienceYears: z.number().min(0),
  specializationIds: z.array(z.string()).min(1),
  consultationTypes: z.array(z.enum([ConsultationType.IN_PERSON, ConsultationType.ONLINE, ConsultationType.HOME_VISIT])).min(1),
  consultationFee: z.number().min(0),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
}).refine((data) => data.role === UserRole.DOCTOR, {
  message: "Invalid role for doctor registration",
  path: ["role"],
});

export type RegisterDoctorInput = z.infer<typeof registerDoctorSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

// ================== SEARCH & FILTER SCHEMAS ==================
export const doctorSearchSchema = z.object({
  query: z.string().optional(),
  specializationIds: z.array(z.string()).optional(),
  city: z.string().optional(),
  languages: z.array(z.enum([Language.ENGLISH, Language.SINHALA, Language.TAMIL])).optional(),
  consultationType: z.enum([ConsultationType.IN_PERSON, ConsultationType.ONLINE, ConsultationType.HOME_VISIT]).optional(),
  minRating: z.number().min(0).max(5).optional(),
  maxFee: z.number().optional(),
  minFee: z.number().optional(),
  sortBy: z.enum(["rating", "fee_asc", "fee_desc", "experience"]).optional(),
  page: z.number().default(1),
  limit: z.number().default(10),
});

export type DoctorSearchInput = z.infer<typeof doctorSearchSchema>;

// ================== BOOKING SCHEMA ==================
export const bookingSchema = z.object({
  doctorId: z.string(),
  slotId: z.string(),
  hospitalId: z.string().optional(),
  symptoms: z.string().min(10, "Please describe your symptoms"),
  consultationType: z.enum([ConsultationType.IN_PERSON, ConsultationType.ONLINE, ConsultationType.HOME_VISIT]),
  paymentMethod: z.enum([PaymentMethod.ONLINE, PaymentMethod.AT_CLINIC]),
  isForDependent: z.boolean().default(false),
  dependentName: z.string().optional(),
  dependentAge: z.number().optional(),
  dependentGender: z.enum([Gender.MALE, Gender.FEMALE, Gender.OTHER]).optional(),
  dependentContact: z.string().optional(),
});

export type BookingInput = z.infer<typeof bookingSchema>;

// ================== DASHBOARD STATS ==================
export interface PatientDashboardStats {
  upcomingAppointments: number;
  completedAppointments: number;
  totalSpent: number;
  prescriptionsCount: number;
}

export interface DoctorDashboardStats {
  todayAppointments: number;
  upcomingAppointments: number;
  completedAppointments: number;
  totalEarnings: number;
  pendingEarnings: number;
  averageRating: number;
  totalReviews: number;
  currentQueueNumber: number;
}

export interface AdminDashboardStats {
  totalPatients: number;
  totalDoctors: number;
  verifiedDoctors: number;
  pendingDoctors: number;
  totalAppointments: number;
  todayAppointments: number;
  totalRevenue: number;
  platformEarnings: number;
}
