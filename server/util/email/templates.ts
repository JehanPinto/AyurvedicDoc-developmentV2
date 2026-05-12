export function sanitizeHTML(text: string): string {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export const getApplicationEmailHtml = (
  applicantName: string,
  jobTitle: string,
  isAccepted: boolean,
  message: string
) => {
  const safeName = sanitizeHTML(applicantName);
  const safeTitle = sanitizeHTML(jobTitle);
  const safeMessage = sanitizeHTML(message);

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden;">
        <div style="background-color: ${isAccepted ? "#2a9d5c" : "#d32f2f"}; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">Application ${isAccepted ? "Accepted" : "Update"}</h1>
        </div>
        <div style="padding: 30px; background-color: #ffffff;">
            <p style="font-size: 16px; color: #333;">Dear ${safeName},</p>
            <p style="font-size: 16px; color: #333; line-height: 1.5;">
                ${
                  isAccepted
                    ? `Congratulations! We are pleased to inform you that your application for the <strong>${safeTitle}</strong> position has been accepted for the next stage.`
                    : `Thank you for taking the time to apply for the <strong>${safeTitle}</strong> position. We appreciate your interest in joining our team.`
                }
            </p>
            <div style="background-color: #f5f5f5; padding: 15px; border-left: 4px solid ${isAccepted ? "#2a9d5c" : "#666"}; margin: 20px 0; border-radius: 4px;">
                <h3 style="margin-top: 0; color: #333;">Message from Administration:</h3>
                <p style="margin-bottom: 0; color: #555; white-space: pre-wrap;">${safeMessage}</p>
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
};

export const getPasswordResetOtpEmailHtml = (otp: string) => {
  const safeOtp = sanitizeHTML(otp); // Just in case
  
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden;">
        <div style="background-color: #059669; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">Password Reset Request</h1>
        </div>
        <div style="padding: 30px; background-color: #ffffff; text-align: center;">
            <p style="font-size: 16px; color: #333;">Hello,</p>
            <p style="font-size: 16px; color: #333; line-height: 1.5;">
                We received a request to reset the password for your AyurPath account. 
                Please use the verification code below to proceed:
            </p>
            <div style="margin: 30px 0;">
                <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #059669; background-color: #ecfdf5; padding: 15px 25px; border-radius: 8px; border: 2px dashed #34d399;">
                    ${safeOtp}
                </span>
            </div>
            <p style="font-size: 14px; color: #666; margin-top: 20px;">
                This code will expire in <strong>10 minutes</strong>. If you did not request a password reset, please ignore this email or contact support.
            </p>
            <p style="font-size: 14px; color: #333; margin-top: 30px;">Best regards,<br><strong>AyurPath Security Team</strong></p>
        </div>
    </div>
  `;
};