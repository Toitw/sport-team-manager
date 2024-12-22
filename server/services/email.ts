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
  error: string;
  details?: unknown;
};

export async function sendEmail({ to, subject, text, html }: SendEmailParams): Promise<SendEmailResult> {
  console.log(`Attempting to send email to: ${to}`);

  if (!isInitialized && !initializeSendGrid()) {
    console.error("SendGrid is not initialized");
    return { 
      success: false, 
      error: "Email service is not properly configured"
    };
  }

  try {
    const msg = {
      to,
      from: process.env.SENDGRID_FROM_EMAIL || "noreply@sportsteammanager.com",
      subject,
      text,
      html: html || text,
    };

    console.log("Sending email with configuration:", {
      to: msg.to,
      from: msg.from,
      subject: msg.subject
    });

    await sgMail.send(msg);
    console.log('Email sent successfully to:', to);
    return { success: true };
  } catch (err: unknown) {
    console.error("Error sending email:", err);
    let errorMessage = "Failed to send email";
    let errorDetails = undefined;

    if (err && typeof err === 'object' && 'response' in err) {
      const response = (err as { response: { body: unknown } }).response.body;
      console.error('SendGrid error response:', response);
      errorDetails = response;
      if (typeof response === 'string') {
        errorMessage = response;
      }
    }

    return { 
      success: false, 
      error: errorMessage,
      details: errorDetails
    };
  }
}

export function sendVerificationEmail(email: string, token: string) {
  console.log(`Preparing verification email for: ${email}`);
  const baseUrl = process.env.APP_URL || (process.env.REPL_SLUG ? `https://${process.env.REPL_SLUG}.replit.app` : 'http://localhost:3000');
  const verificationLink = `${baseUrl}/verify-email?token=${token}`;

  return sendEmail({
    to: email,
    subject: "Verify your Sports Team Manager account",
    text: `Welcome to Sports Team Manager! Click this magic link to verify your email: ${verificationLink} (Link is valid for this verification only)`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2563eb;">Welcome to Sports Team Manager!</h1>
        <p>Click the magic link below to verify your email address:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationLink}" 
             style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
            Verify Email with Magic Link
          </a>
        </div>
        <p style="color: #666;">This link can only be used once to verify your email address.</p>
        <p style="word-break: break-all; color: #666;">${verificationLink}</p>
        <p style="color: #666; margin-top: 30px;">If you didn't create this account, you can safely ignore this email.</p>
      </div>
    `
  });
}

export function sendPasswordResetEmail(email: string, token: string) {
  console.log(`Preparing password reset email for: ${email}`);
  const baseUrl = process.env.APP_URL || (process.env.REPL_SLUG ? `https://${process.env.REPL_SLUG}.replit.app` : 'http://localhost:3000');
  const resetLink = `${baseUrl}/reset-password?token=${token}`;

  return sendEmail({
    to: email,
    subject: "Reset your Sports Team Manager password",
    text: `You requested to reset your password. Click this link to set a new password: ${resetLink} (Link expires in 1 hour)`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2563eb;">Reset Your Password</h1>
        <p>You requested to reset your password. Click the button below to set a new password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" 
             style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p style="color: #666;">This link will expire in 1 hour.</p>
        <p style="word-break: break-all; color: #666;">${resetLink}</p>
        <p style="color: #666; margin-top: 30px;">If you didn't request this password reset, you can safely ignore this email.</p>
      </div>
    `
  });
}