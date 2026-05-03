/**
 * Feature flags derived from environment variables.
 */

/** When false, new users are auto-verified and can sign in immediately. */
export const EMAIL_VERIFICATION_ENABLED =
  process.env.ENABLE_EMAIL_VERIFICATION === "true";
