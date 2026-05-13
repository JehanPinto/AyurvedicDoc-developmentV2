import { resend, defaultFromEmail } from "./config"; 

import { getPasswordResetOtpEmailHtml } from "./templates";

export async function sendPasswordResetOtpEmail(toEmail: string, otp: string) {
  try {
    const { data, error } = await resend.emails.send({
      from: defaultFromEmail,
      to: toEmail,
      subject: 'Your Password Reset Verification Code - AyurPath',
      html: getPasswordResetOtpEmailHtml(otp)
    });

    if (error) {
      return { success: false, error: "Failed to send email" };
    }
    return { success: true };
    
  } catch (err) {
    return { success: false, error: "Server Error" };
  }
}