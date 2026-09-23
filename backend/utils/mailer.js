import nodemailer from "nodemailer";

let transporter;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD,
      },
      // Without these, a blocked/slow outbound SMTP connection (common on
      // some hosts/networks) makes sendMail() hang indefinitely — the
      // request never resolves or rejects, so the "Send Reset Link"
      // button just spins forever with no error shown. These timeouts
      // make it fail fast instead, so the route can respond with a
      // proper error the frontend actually displays.
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 15_000,
    });
  }
  return transporter;
}

export async function sendPasswordResetEmail(toEmail, resetUrl) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
    throw new Error(
      "Email is not configured on the server (EMAIL_USER / EMAIL_APP_PASSWORD missing in .env)."
    );
  }

  const mailOptions = {
    from: `"Tekky Job" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: "Reset your Job Portal password",
    html: `
      <p>You requested a password reset.</p>
      <p><a href="${resetUrl}">Click here to reset your password</a></p>
      <p>This link expires in 1 hour. If you didn't request this, you can ignore this email.</p>
    `,
  };

  await getTransporter().sendMail(mailOptions);
}
