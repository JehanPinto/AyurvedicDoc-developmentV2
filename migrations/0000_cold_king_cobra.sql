CREATE TABLE "appointment_slots" (
	"id" varchar(50) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"doctor_id" varchar(50) NOT NULL,
	"hospital_id" varchar(50),
	"date" varchar(10) NOT NULL,
	"start_time" varchar(5) NOT NULL,
	"end_time" varchar(5) NOT NULL,
	"consultation_type" varchar(20) NOT NULL,
	"is_booked" boolean DEFAULT false,
	"is_blocked" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "appointments" (
	"id" varchar(50) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"patient_id" varchar(50) NOT NULL,
	"doctor_id" varchar(50) NOT NULL,
	"slot_id" varchar(50) NOT NULL,
	"hospital_id" varchar(50),
	"appointment_date" varchar(10) NOT NULL,
	"appointment_time" varchar(5) NOT NULL,
	"consultation_type" varchar(20) NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"symptoms" text NOT NULL,
	"queue_number" integer,
	"is_called" boolean DEFAULT false,
	"is_for_dependent" boolean DEFAULT false,
	"dependent_name" varchar(255),
	"dependent_age" integer,
	"dependent_gender" varchar(10),
	"dependent_contact" varchar(20),
	"consultation_notes" text,
	"video_session_id" varchar(100),
	"cancel_reason" text,
	"cancelled_by" varchar(20),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "doctor_profiles" (
	"id" varchar(50) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(50) NOT NULL,
	"registration_number" varchar(50) NOT NULL,
	"qualifications" text NOT NULL,
	"biography" text,
	"experience_years" integer DEFAULT 0 NOT NULL,
	"specialization_ids" text[] DEFAULT ARRAY[]::text[],
	"languages_spoken" text[] DEFAULT ARRAY['english']::text[],
	"consultation_types" text[] DEFAULT ARRAY['in_person']::text[],
	"hospital_ids" text[] DEFAULT ARRAY[]::text[],
	"consultation_fee" integer DEFAULT 0 NOT NULL,
	"online_consultation_fee" integer,
	"home_visit_fee" integer,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"rejection_reason" text,
	"verification_documents" text[] DEFAULT ARRAY[]::text[],
	"bank_name" varchar(100),
	"bank_account_number" varchar(50),
	"bank_branch" varchar(100),
	"is_available" boolean DEFAULT true,
	"max_advance_booking_days" integer DEFAULT 30,
	"min_booking_notice_hours" integer DEFAULT 2,
	"slot_duration_minutes" integer DEFAULT 30,
	"buffer_time_minutes" integer DEFAULT 10,
	"average_rating" real DEFAULT 0,
	"total_reviews" integer DEFAULT 0,
	"total_appointments" integer DEFAULT 0,
	"current_queue_number" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "doctor_profiles_registration_number_unique" UNIQUE("registration_number")
);
--> statement-breakpoint
CREATE TABLE "doctor_schedules" (
	"id" varchar(50) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"doctor_id" varchar(50) NOT NULL,
	"hospital_id" varchar(50),
	"day_of_week" varchar(10) NOT NULL,
	"start_time" varchar(5) NOT NULL,
	"end_time" varchar(5) NOT NULL,
	"consultation_type" varchar(20) NOT NULL,
	"is_active" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "hospitals" (
	"id" varchar(50) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"address" text NOT NULL,
	"city" varchar(100) NOT NULL,
	"contact_number" varchar(20) NOT NULL,
	"email" varchar(255),
	"latitude" real,
	"longitude" real,
	"parking_available" boolean DEFAULT false,
	"directions" text
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" varchar(50) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(50) NOT NULL,
	"title" varchar(255) NOT NULL,
	"message" text NOT NULL,
	"type" varchar(20) NOT NULL,
	"is_read" boolean DEFAULT false,
	"related_id" varchar(50),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" varchar(50) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"appointment_id" varchar(50) NOT NULL,
	"patient_id" varchar(50) NOT NULL,
	"doctor_id" varchar(50) NOT NULL,
	"consultation_fee" integer NOT NULL,
	"booking_charges" integer DEFAULT 0,
	"tax" integer DEFAULT 0,
	"platform_commission" integer DEFAULT 0,
	"doctor_earnings" integer NOT NULL,
	"total_amount" integer NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"method" varchar(20) NOT NULL,
	"transaction_id" varchar(100),
	"refund_amount" integer,
	"refund_reason" text,
	"refund_date" varchar(10),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prescriptions" (
	"id" varchar(50) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"appointment_id" varchar(50) NOT NULL,
	"patient_id" varchar(50) NOT NULL,
	"doctor_id" varchar(50) NOT NULL,
	"diagnosis" text NOT NULL,
	"medications" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"treatments" text[] DEFAULT ARRAY[]::text[],
	"dietary_advice" text,
	"lifestyle_advice" text,
	"follow_up_date" varchar(10),
	"additional_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" varchar(50) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"appointment_id" varchar(50) NOT NULL,
	"patient_id" varchar(50) NOT NULL,
	"doctor_id" varchar(50) NOT NULL,
	"rating" integer NOT NULL,
	"comment" text,
	"doctor_response" text,
	"doctor_responded_at" timestamp,
	"is_hidden" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "specializations" (
	"id" varchar(50) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"icon" varchar(50),
	CONSTRAINT "specializations_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar(50) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"password" varchar(255) NOT NULL,
	"full_name" varchar(255) NOT NULL,
	"phone" varchar(20) NOT NULL,
	"role" varchar(20) DEFAULT 'patient' NOT NULL,
	"nic" varchar(20),
	"gender" varchar(10),
	"date_of_birth" varchar(10),
	"preferred_languages" text[] DEFAULT ARRAY['english']::text[],
	"profile_image" text,
	"address" text,
	"city" varchar(100),
	"is_email_verified" boolean DEFAULT false,
	"is_phone_verified" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"google_id" varchar(100),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "appointment_slots" ADD CONSTRAINT "appointment_slots_doctor_id_doctor_profiles_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "public"."doctor_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_patient_id_users_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_doctor_id_doctor_profiles_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "public"."doctor_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_slot_id_appointment_slots_id_fk" FOREIGN KEY ("slot_id") REFERENCES "public"."appointment_slots"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "doctor_profiles" ADD CONSTRAINT "doctor_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "doctor_schedules" ADD CONSTRAINT "doctor_schedules_doctor_id_doctor_profiles_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "public"."doctor_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_appointment_id_appointments_id_fk" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_patient_id_users_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_doctor_id_doctor_profiles_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "public"."doctor_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_appointment_id_appointments_id_fk" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_patient_id_users_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_doctor_id_doctor_profiles_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "public"."doctor_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_appointment_id_appointments_id_fk" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_patient_id_users_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_doctor_id_doctor_profiles_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "public"."doctor_profiles"("id") ON DELETE no action ON UPDATE no action;