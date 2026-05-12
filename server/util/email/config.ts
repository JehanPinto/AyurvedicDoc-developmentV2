import { Resend } from 'resend';

if (!process.env.RESEND_API_KEY) {
  throw new Error("🔴 CRITICAL: RESEND_API_KEY is missing in .env file! Email service cannot start.");
}

export const resend = new Resend(process.env.RESEND_API_KEY);

// Standardise the "from" email address across all emails
export const defaultFromEmail = "AyurPath Admin <onboarding@resend.dev>";