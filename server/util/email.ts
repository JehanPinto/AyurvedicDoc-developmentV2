import nodemailer from "nodemailer";

if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
  console.error(
    "🔴 WARNING: EMAIL_USER or EMAIL_PASS is missing in .env file!",
  );
}

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function sendApplicationEmail(
  toEmail: string | null | undefined,
  applicantName: string,
  jobTitle: string,
  status: "ACCEPTED" | "REJECTED",
  message: string,
) {
  if (!toEmail || toEmail.trim() === "") {
    console.error("🔴 Error: Applicant has no email address.");
    return { 
      success: false, 
      error: "This applicant has not provided an email address. (No Email Found)" 
    };
  }

  if (!toEmail.includes("@")) {
     console.error("🔴 Error: Invalid email format.");
     return { 
         success: false, 
         error: "Invalid Email Format" 
     };
  }

  const isAccepted = status === "ACCEPTED";
  const subject = isAccepted
    ? `Application Update: Next Steps for ${jobTitle} at AyurPath`
    : `Application Update: ${jobTitle} at AyurPath`;

  const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden;">
            <div style="background-color: ${isAccepted ? "#2a9d5c" : "#d32f2f"}; padding: 20px; text-align: center;">
                <h1 style="color: white; margin: 0;">Application ${isAccepted ? "Accepted" : "Update"}</h1>
            </div>
            <div style="padding: 30px; background-color: #ffffff;">
                <p style="font-size: 16px; color: #333;">Dear ${applicantName},</p>
                <p style="font-size: 16px; color: #333; line-height: 1.5;">
                    ${
                      isAccepted
                        ? `Congratulations! We are pleased to inform you that your application for the <strong>${jobTitle}</strong> position has been accepted for the next stage.`
                        : `Thank you for taking the time to apply for the <strong>${jobTitle}</strong> position. We appreciate your interest in joining our team.`
                    }
                </p>
                <div style="background-color: #f5f5f5; padding: 15px; border-left: 4px solid ${isAccepted ? "#2a9d5c" : "#666"}; margin: 20px 0; border-radius: 4px;">
                    <h3 style="margin-top: 0; color: #333;">Message from Administration:</h3>
                    <p style="margin-bottom: 0; color: #555; white-space: pre-wrap;">${message}</p>
                </div>
                ${
                  !isAccepted
                    ? `
                <p style="font-size: 16px; color: #333; line-height: 1.5;">
                    While your qualifications are impressive, we have decided to move forward with other candidates at this time. We will keep your resume on file for future opportunities.
                </p>
                `
                    : ""
                }
                <p style="font-size: 16px; color: #333; margin-top: 30px;">Best regards,<br><strong>AyurPath Administration Team</strong></p>
            </div>
        </div>
    `;

  try {
    const info = await transporter.sendMail({
      from: `"AyurPath Admin" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: subject,
      html: htmlContent,
    });
    console.log("🟢 Email sent successfully:", info.messageId);
    return { success: true };
  } catch (error: any) {
    console.error("🔴 SMTP Error:", error.message);
    return { 
      success: false, 
      error: "There is an error with the email server (SMTP). Please check the App Key." 
    };
  }
}