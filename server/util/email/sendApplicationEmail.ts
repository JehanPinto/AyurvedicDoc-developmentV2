import { resend, defaultFromEmail } from "./config";
import { getApplicationEmailHtml } from "./templates";

export async function sendApplicationEmail(
  toEmail: string | null | undefined,
  applicantName: string,
  jobTitle: string,
  status: "ACCEPTED" | "REJECTED",
  message: string,
) {
  if (!toEmail || toEmail.trim() === "") {
    console.error("🔴 Error: Applicant has no email address.");
    return { success: false, error: "This applicant has not provided an email address." };
  }

  if (!toEmail.includes("@")) {
    console.error("🔴 Error: Invalid email format.");
    return { success: false, error: "Invalid Email Format" };
  }

  const isAccepted = status === "ACCEPTED";
  const subject = isAccepted
    ? `Application Update: Next Steps for ${jobTitle} at AyurPath`
    : `Application Update: ${jobTitle} at AyurPath`;

  const htmlContent = getApplicationEmailHtml(applicantName, jobTitle, isAccepted, message);

  try {
    const { data, error } = await resend.emails.send({
    from: defaultFromEmail,
    to: [toEmail],
    subject: subject,
    html: htmlContent,
    });

    if (error) {
      console.error("🔴 Resend API Error:", error.message);
      return { success: false, error: "Failed to send email via Transactional Service." };
    }

    console.log("🟢 Email sent successfully via Resend. ID:", data?.id);
    return { success: true };
  } catch (err: any) {
    console.error("🔴 Unexpected Error sending email:", err.message);
    return { success: false, error: "An unexpected error occurred while sending the email." };
  }
}