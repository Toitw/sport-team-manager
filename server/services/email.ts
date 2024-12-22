import sgMail from "@sendgrid/mail";

let isInitialized = false;

function initializeSendGrid() {
  if (isInitialized) return true;

  if (!process.env.SENDGRID_API_KEY) {
    console.error("SendGrid initialization failed: SENDGRID_API_KEY is missing");
    return false;
  }

  try {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    isInitialized = true;
    console.log("SendGrid initialized successfully");
    return true;
  } catch (error) {
    console.error("Failed to initialize SendGrid:", error);
    return false;
  }
}

type SendEmailParams = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

type SendEmailResult = {
  success: true;
} | {
  success: false;
  error: unknown;
};

export async function sendEmail({ to, subject, text, html }: SendEmailParams): Promise<SendEmailResult> {
  if (!isInitialized && !initializeSendGrid()) {
    return { 
      success: false, 
      error: new Error("SendGrid is not properly initialized. Check if SENDGRID_API_KEY is set.")
    };
  }

  try {
    await sgMail.send({
      to,
      from: process.env.SENDGRID_FROM_EMAIL || "noreply@sportsteammanager.com",
      subject,
      text,
      html: html || text,
    });
    console.log('Email sent successfully to:', to);
    return { success: true };
  } catch (err: unknown) {
    console.error("Error sending email:", err);
    if (err && typeof err === 'object' && 'response' in err) {
      console.error('SendGrid error response:', (err as { response: { body: unknown } }).response.body);
    }
    return { success: false, error: err };
  }
}

export function sendVerificationEmail(email: string, token: string) {
  const baseUrl = process.env.APP_URL || 'http://localhost:3000';
  const verificationLink = `${baseUrl}/verify-email?token=${token}`;

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
  const baseUrl = process.env.APP_URL || 'http://localhost:3000';
  const resetLink = `${baseUrl}/reset-password?token=${token}`;

  return sendEmail({
    to: email,
    subject: "Reset your password",
    text: `You requested to reset your password. Click this link to reset it: ${resetLink}`,
    html: `
      <h1>Reset Your Password</h1>
      <p>You requested to reset your password. Click the link below to set a new password:</p>
      <p><a href="${resetLink}">Reset Password</a></p>
      <p>If you didn't request this, you can safely ignore this email.</p>
      <p>This link will expire in 24 hours.</p>
    `
  });
}