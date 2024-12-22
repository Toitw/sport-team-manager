import sgMail from "@sendgrid/mail";

if (!process.env.SENDGRID_API_KEY) {
  throw new Error("SENDGRID_API_KEY is required");
}

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

type SendEmailParams = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

export async function sendEmail({ to, subject, text, html }: SendEmailParams) {
  try {
    await sgMail.send({
      to,
      from: "noreply@sportsteam.com", // Update this with your verified sender
      subject,
      text,
      html: html || text,
    });
    return { success: true };
  } catch (error) {
    console.error("Error sending email:", error);
    return { success: false, error };
  }
}

export function sendVerificationEmail(email: string, token: string) {
  const verificationLink = `${process.env.APP_URL || 'http://localhost:3000'}/verify-email?token=${token}`;
  
  return sendEmail({
    to: email,
    subject: "Verify your email address",
    text: `Welcome to Sports Team Manager! Please verify your email by clicking this link: ${verificationLink}`,
    html: `
      <h1>Welcome to Sports Team Manager!</h1>
      <p>Please verify your email address by clicking the link below:</p>
      <p><a href="${verificationLink}">Verify Email Address</a></p>
      <p>If you didn't create this account, you can safely ignore this email.</p>
    `
  });
}

export function sendPasswordResetEmail(email: string, token: string) {
  const resetLink = `${process.env.APP_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
  
  return sendEmail({
    to: email,
    subject: "Reset your password",
    text: `You requested to reset your password. Click this link to reset it: ${resetLink}`,
    html: `
      <h1>Reset Your Password</h1>
      <p>You requested to reset your password. Click the link below to set a new password:</p>
      <p><a href="${resetLink}">Reset Password</a></p>
      <p>If you didn't request this, you can safely ignore this email.</p>
      <p>This link will expire in 1 hour.</p>
    `
  });
}
