import { db, pool } from "../server/db";
import { sql } from "drizzle-orm";

async function migrateSettings() {
  console.log("Creating platform_settings table...");
  
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "platform_settings" (
        "id" varchar(50) PRIMARY KEY DEFAULT 'default' NOT NULL,
        "platform_commission_rate" integer DEFAULT 10 NOT NULL,
        "booking_charges" integer DEFAULT 100 NOT NULL,
        "tax_rate" integer DEFAULT 4 NOT NULL,
        "max_advance_booking_days" integer DEFAULT 30 NOT NULL,
        "min_booking_notice_hours" integer DEFAULT 2 NOT NULL,
        "default_slot_duration" integer DEFAULT 30 NOT NULL,
        "default_buffer_time" integer DEFAULT 10 NOT NULL,
        "email_notifications" boolean DEFAULT true,
        "sms_notifications" boolean DEFAULT true,
        "push_notifications" boolean DEFAULT false,
        "auto_confirm_appointments" boolean DEFAULT false,
        "require_doctor_verification" boolean DEFAULT true,
        "allow_online_payments" boolean DEFAULT true,
        "allow_clinic_payments" boolean DEFAULT false,
        "default_language" varchar(20) DEFAULT 'english',
        "maintenance_mode" boolean DEFAULT false,
        "updated_at" timestamp DEFAULT now() NOT NULL
      )
    `);
    console.log("platform_settings table created successfully!");
  } catch (error) {
    console.log("Table may already exist or error:", error);
  }
  
  await pool.end();
  process.exit(0);
}

migrateSettings();
