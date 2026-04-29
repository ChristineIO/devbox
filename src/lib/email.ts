import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = "onboarding@resend.dev";

function getAppUrl(): string {
  return process.env.NEXTAUTH_URL ?? "http://localhost:3000";
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${getAppUrl()}/reset-password?token=${token}`;

  await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: "Reset your password — DevBox",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 0;">
        <h2 style="margin: 0 0 16px;">Reset your DevBox password</h2>
        <p style="color: #555; line-height: 1.5;">
          We received a request to reset the password on your DevBox account. Click the button below to choose a new password.
        </p>
        <a
          href="${resetUrl}"
          style="display: inline-block; margin: 24px 0; padding: 12px 24px; background: #3b82f6; color: #fff; text-decoration: none; border-radius: 6px; font-weight: 600;"
        >
          Reset password
        </a>
        <p style="color: #888; font-size: 14px; line-height: 1.5;">
          If the button doesn't work, copy and paste this link into your browser:<br/>
          <a href="${resetUrl}" style="color: #3b82f6;">${resetUrl}</a>
        </p>
        <p style="color: #888; font-size: 13px; margin-top: 32px;">
          This link expires in 1 hour. If you didn't request a password reset, you can safely ignore this email.
        </p>
      </div>
    `,
    text: `Reset your DevBox password\n\nReset your password by visiting this link:\n${resetUrl}\n\nThis link expires in 1 hour. If you didn't request a password reset, you can safely ignore this email.`,
  });
}

export async function sendVerificationEmail(email: string, token: string) {
  const verifyUrl = `${getAppUrl()}/api/auth/verify?token=${token}`;

  await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: "Verify your email — DevBox",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 0;">
        <h2 style="margin: 0 0 16px;">Welcome to DevBox</h2>
        <p style="color: #555; line-height: 1.5;">
          Click the button below to verify your email address and activate your account.
        </p>
        <a
          href="${verifyUrl}"
          style="display: inline-block; margin: 24px 0; padding: 12px 24px; background: #3b82f6; color: #fff; text-decoration: none; border-radius: 6px; font-weight: 600;"
        >
          Verify email
        </a>
        <p style="color: #888; font-size: 14px; line-height: 1.5;">
          If the button doesn't work, copy and paste this link into your browser:<br/>
          <a href="${verifyUrl}" style="color: #3b82f6;">${verifyUrl}</a>
        </p>
        <p style="color: #888; font-size: 13px; margin-top: 32px;">
          This link expires in 24 hours. If you didn't create a DevBox account, you can ignore this email.
        </p>
      </div>
    `,
    text: `Welcome to DevBox\n\nVerify your email by visiting this link:\n${verifyUrl}\n\nThis link expires in 24 hours. If you didn't create a DevBox account, you can ignore this email.`,
  });
}
