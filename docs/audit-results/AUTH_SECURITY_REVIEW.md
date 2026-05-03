# Auth Security Review

**Last audited:** 2026-04-30
**Scope:** NextAuth v5 setup, credentials + GitHub providers, email verification, password reset, profile/account endpoints

## Summary

Overall posture is solid. Token generation uses `crypto.randomBytes(32)` everywhere, bcrypt cost 12 is applied consistently, password reset tokens have a distinct identifier prefix, the forgot-password endpoint matches responses for known/unknown emails, and `/api/account/change-password` and the `deleteAccount` server action both bind to `session.user.id` (no IDOR). The headline finding is the complete absence of rate limiting on any auth endpoint, which is the main hardening gap. A handful of smaller issues — login enumeration via the register endpoint, a forgot-password timing channel, and stateless sessions surviving password changes — round out the recommendations.

## Findings

### 🔴 Critical

None found.

### 🟠 High

#### 1. No rate limiting on any auth endpoint

- **File:** [src/app/api/auth/register/route.ts](src/app/api/auth/register/route.ts), [src/app/api/auth/forgot-password/route.ts](src/app/api/auth/forgot-password/route.ts), [src/app/api/auth/resend-verification/route.ts](src/app/api/auth/resend-verification/route.ts), [src/app/api/auth/reset-password/route.ts](src/app/api/auth/reset-password/route.ts), [src/app/api/account/change-password/route.ts](src/app/api/account/change-password/route.ts), [src/auth.ts](src/auth.ts) (Credentials `authorize`)
- **Issue:** A repo-wide grep for `rateLimit`, `Ratelimit`, `ratelimit`, and `upstash` returns zero matches, and `package.json` contains no rate-limit dependency. None of the auth handlers implement IP- or email-keyed throttling. The only throttle present is the 60-second per-email cooldown enforced inside `createPasswordResetToken` ([src/lib/db/password-reset-token.ts:20-27](src/lib/db/password-reset-token.ts#L20-L27)), which is too narrow to mitigate broad abuse.
- **Impact:**
  - `forgot-password` and `resend-verification` can be used for unbounded email-bombing of arbitrary addresses (Resend bills against the project, and recipients see DevBox-branded spam).
  - The credentials `authorize()` callback runs `bcrypt.compare` for every attempt with no throttle — an attacker can spray credentials, and bcrypt cost 12 only slows them, it does not stop them.
  - `register` allows automated mass account creation, polluting the user table and wasting verification email budget.
  - `change-password` allows online brute-force of the current password if a session cookie is stolen (e.g., via XSS in a different surface).
- **Fix:** Add a rate-limit primitive (Upstash Ratelimit + Redis is the typical pick for serverless) and wrap each endpoint. Suggested limits:
  - `forgot-password`, `resend-verification`: 5 per email per hour AND 20 per IP per hour.
  - `register`: 5 per IP per hour.
  - Credentials `authorize`: 10 failures per IP per 15 min, 5 failures per email per 15 min.
  - `reset-password`, `change-password`: 10 per IP per hour.
  ```ts
  // src/lib/rate-limit.ts
  import { Ratelimit } from "@upstash/ratelimit";
  import { Redis } from "@upstash/redis";
  export const forgotPasswordLimiter = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(5, "1 h"),
    prefix: "rl:forgot",
  });
  ```
  Then in the handler: `const { success } = await forgotPasswordLimiter.limit(ip + ":" + email); if (!success) return new NextResponse(null, { status: 429 });`

#### 2. Register endpoint reveals whether an email is registered

- **File:** [src/app/api/auth/register/route.ts:40-46](src/app/api/auth/register/route.ts#L40-L46)
- **Issue:**
  ```ts
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "A user with that email already exists" },
      { status: 409 },
    );
  }
  ```
  Combined with the absence of rate limiting (#1), an attacker can iterate a list of emails against `/api/auth/register` and read off which ones are registered DevBox users from the 409 status code. The forgot-password endpoint correctly avoids this, but register undoes that protection.
- **Impact:** Account enumeration. An attacker can build a list of confirmed DevBox users to target with credential stuffing or phishing.
- **Fix:** Two reasonable options:
  1. Return `200` with `{ success: true, emailSent: true }` for both new and existing emails, and instead email the existing user a "someone tried to re-register your account, sign in here" notice. (Best UX.)
  2. Keep the 409 but gate the endpoint behind a strict per-IP rate limit (covered by #1) so enumeration is impractical, and accept the residual risk.

### 🟡 Medium

#### 3. Stateless sessions are not invalidated after password change or reset

- **File:** [src/app/api/auth/reset-password/route.ts:60-66](src/app/api/auth/reset-password/route.ts#L60-L66), [src/app/api/account/change-password/route.ts:66-72](src/app/api/account/change-password/route.ts#L66-L72)
- **Issue:** `session: { strategy: "jwt" }` ([src/auth.ts:22](src/auth.ts#L22)) plus a successful password update means previously-issued JWTs remain valid until their natural expiry. A user who resets their password because they suspect compromise does not actually log the attacker out — the attacker's existing session token keeps working until the JWT expires (default 30 days).
- **Impact:** Account-takeover recovery is incomplete. Anyone who has stolen a session token before the reset retains access until the JWT expires.
- **Fix:** Add a `passwordChangedAt: DateTime?` column to `User` and stamp it on every password change/reset. In the `jwt` callback, embed it in the token; in the `session` callback (or a server check), refuse the session if `token.passwordChangedAt < user.passwordChangedAt`.
  ```ts
  // src/auth.ts
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.pwdChangedAt = (user as any).passwordChangedAt?.getTime();
      return token;
    },
    async session({ session, token }) {
      const u = await prisma.user.findUnique({ where: { id: token.sub! }, select: { passwordChangedAt: true } });
      if (u?.passwordChangedAt && token.pwdChangedAt && u.passwordChangedAt.getTime() > token.pwdChangedAt) {
        return null as any; // force sign-out
      }
      session.user.id = token.sub!;
      return session;
    },
  }
  ```

#### 4. Password reset token consumption is not transactional with password update

- **File:** [src/app/api/auth/reset-password/route.ts:37-64](src/app/api/auth/reset-password/route.ts#L37-L64), [src/lib/db/password-reset-token.ts:60-64](src/lib/db/password-reset-token.ts#L60-L64)
- **Issue:** `consumePasswordResetToken` deletes the row, then the route does `prisma.user.update` outside any transaction. If the user lookup or update fails after the token is already consumed, the legitimate user must request a brand-new reset link — the old one is gone. More concerning: the order is "delete token → look up user → update password," and if the request is interrupted between consumption and the user update, the password is unchanged but the token cannot be reused. The same pattern is used in `consumeVerificationToken` + the user update at [src/app/api/auth/verify/route.ts:16-27](src/app/api/auth/verify/route.ts#L16-L27).
- **Impact:** No direct security exploit (token cannot be reused), but it's an availability/correctness footgun. There is a narrow window where if `prisma.user.update` fails, the user has burned a token without a password change.
- **Fix:** Wrap consumption + the user update in a `prisma.$transaction([...])`. Same for the verify endpoint.
  ```ts
  await prisma.$transaction([
    prisma.verificationToken.delete({ where: { token } }),
    prisma.user.update({ where: { id: user.id }, data: { password: passwordHash } }),
  ]);
  ```

### 🟢 Low / Recommendations

#### 5. Verification and password-reset tokens are stored in plaintext

- **File:** [src/lib/db/verification-token.ts:8-19](src/lib/db/verification-token.ts#L8-L19), [src/lib/db/password-reset-token.ts:29-38](src/lib/db/password-reset-token.ts#L29-L38)
- **Issue:** Both helpers store the raw 32-byte hex token directly in `VerificationToken.token`. Anyone with read access to the database (a leaked backup, a SQL-injection sink elsewhere, a misconfigured Neon role) can use the live tokens immediately.
- **Impact:** Low for verification (24h, idempotent verify), Medium-Low for password reset (1h, can take over the account). Mitigated by the short TTLs and single-use enforcement.
- **Fix:** Hash the token with SHA-256 before storage; send the raw token in the email; hash the incoming token before lookup.
  ```ts
  const raw = crypto.randomBytes(32).toString("hex");
  const hashed = crypto.createHash("sha256").update(raw).digest("hex");
  await prisma.verificationToken.create({ data: { identifier, token: hashed, expires } });
  return raw; // emailed to user
  // and on consume: where: { token: sha256(raw) }
  ```

#### 6. Forgot-password timing oracle

- **File:** [src/app/api/auth/forgot-password/route.ts:27-43](src/app/api/auth/forgot-password/route.ts#L27-L43)
- **Issue:** Response body and status are identical for registered vs. unregistered emails (good), but the registered path performs a DB write (`createPasswordResetToken`) and an outbound Resend call, which adds hundreds of milliseconds. An attacker measuring response time can still enumerate users.
- **Impact:** Account enumeration via timing side channel.
- **Fix:** Run the slow path off the response, e.g. fire-and-forget the email send (`void sendPasswordResetEmail(...)`), or always perform a comparable amount of work (a dummy `bcrypt.hash` against a constant string) before responding. Combined with the rate limit from #1, this is sufficient.

#### 7. `signInWithGithub` server action does not handle redirect rejection

- **File:** [src/actions/auth.ts:34-36](src/actions/auth.ts#L34-L36)
- **Issue:**
  ```ts
  export async function signInWithGithub(callbackUrl?: string) {
    await signIn("github", { redirectTo: callbackUrl ?? "/dashboard" });
  }
  ```
  `callbackUrl` flows in from the client (the sign-in form's `searchParams`) without any allowlist check. NextAuth treats the value as an internal redirect target; a malicious external URL would normally be rejected by NextAuth's built-in same-origin check, but if the redirect target is ever logged or surfaced in an error, it round-trips user-controlled input.
- **Impact:** Low. NextAuth blocks open-redirects to other origins by default, so this is defense-in-depth.
- **Fix:** Validate `callbackUrl` is a relative path (`callbackUrl.startsWith("/") && !callbackUrl.startsWith("//")`) before passing it to `signIn`.

#### 8. `proxy.ts` does not protect `/api/account/*` paths

- **File:** [src/proxy.ts:20-22](src/proxy.ts#L20-L22)
- **Issue:** The matcher excludes `api`, so `/api/account/change-password` is not gated by middleware. Currently the route handler does its own `auth()` check ([src/app/api/account/change-password/route.ts:20-24](src/app/api/account/change-password/route.ts#L20-L24)), which is correct, but any new route added under `/api/account/*` will be unprotected by default and rely on the developer remembering to call `auth()`.
- **Impact:** Future-proofing concern only — nothing currently exposed.
- **Fix:** Either widen the middleware matcher to include `/api/account/(.*)` and protect those routes centrally, or add a `requireSession()` helper used at the top of every account route to make the contract explicit.

#### 9. Verification token store has no `identifier` prefix isolation in `consumeVerificationToken`

- **File:** [src/lib/db/verification-token.ts:22-42](src/lib/db/verification-token.ts#L22-L42)
- **Issue:** `consumePasswordResetToken` correctly checks `record.identifier.startsWith("password-reset:")` ([src/lib/db/password-reset-token.ts:51](src/lib/db/password-reset-token.ts#L51)) and rejects mismatches. The reverse check is missing in `consumeVerificationToken` — it accepts any row, including one whose identifier starts with `password-reset:`. In practice this is unreachable because tokens are random, but if the password-reset flow ever stops prefixing, a reset token could verify an email.
- **Impact:** No exploit today; defensive belt-and-braces.
- **Fix:**
  ```ts
  if (record.identifier.startsWith("password-reset:")) return null;
  ```

#### 10. Fixed `from` address `onboarding@resend.dev` not driven by env

- **File:** [src/lib/email.ts:5](src/lib/email.ts#L5)
- **Issue:** `FROM_EMAIL` is hardcoded. Production requires a verified domain in Resend, and switching is a code change rather than env config.
- **Impact:** Operational, not security.
- **Fix:** `const FROM_EMAIL = process.env.EMAIL_FROM ?? "onboarding@resend.dev";` and document `EMAIL_FROM` in `.env.example`.

## Passed Checks

- **bcrypt cost 12 used consistently** for register ([src/app/api/auth/register/route.ts:48](src/app/api/auth/register/route.ts#L48)), reset ([src/app/api/auth/reset-password/route.ts:60](src/app/api/auth/reset-password/route.ts#L60)), and change-password ([src/app/api/account/change-password/route.ts:66](src/app/api/account/change-password/route.ts#L66)). Comparison uses `bcrypt.compare` everywhere — no string equality on hashes.
- **Tokens generated with CSPRNG**: `crypto.randomBytes(32).toString("hex")` (256 bits of entropy) for both verification ([src/lib/db/verification-token.ts:8](src/lib/db/verification-token.ts#L8)) and password reset ([src/lib/db/password-reset-token.ts:29](src/lib/db/password-reset-token.ts#L29)). No `Math.random`, no UUID-v1, no predictable sources.
- **Tokens are single-use**: both `consumeVerificationToken` and `consumePasswordResetToken` `prisma.verificationToken.delete({ where: { token } })` on use, including when expired ([src/lib/db/verification-token.ts:31-39](src/lib/db/verification-token.ts#L31-L39), [src/lib/db/password-reset-token.ts:54-62](src/lib/db/password-reset-token.ts#L54-L62)).
- **Token expirations match the spec**: 24h for verification, 1h for password reset.
- **Distinct identifier prefixes**: password-reset tokens use `password-reset:` prefix and `consumePasswordResetToken` rejects rows missing it ([src/lib/db/password-reset-token.ts:51](src/lib/db/password-reset-token.ts#L51)) — a verification token cannot be used as a reset token.
- **Forgot-password endpoint does not reveal account existence**: returns `{ success: true }` for both registered and unregistered emails ([src/app/api/auth/forgot-password/route.ts:32-43](src/app/api/auth/forgot-password/route.ts#L32-L43)), with errors swallowed in a try/catch so failures don't change the response shape.
- **Resend-verification endpoint does not leak**: same flat `{ success: true }` for any input, including unknown emails and already-verified accounts ([src/app/api/auth/resend-verification/route.ts:30-42](src/app/api/auth/resend-verification/route.ts#L30-L42)).
- **Generic credentials sign-in error** ("Invalid email or password") in [src/actions/auth.ts:26](src/actions/auth.ts#L26) — does not distinguish "user not found" from "wrong password".
- **`authorize()` blocks unverified credentials users** when `EMAIL_VERIFICATION_ENABLED` is on ([src/auth.ts:54-56](src/auth.ts#L54-L56)) by throwing `EmailNotVerifiedError`.
- **60-second resend cooldown enforced server-side**, not just client-side: `createPasswordResetToken` checks token age and returns `null` if a fresh token already exists ([src/lib/db/password-reset-token.ts:20-27](src/lib/db/password-reset-token.ts#L20-L27)).
- **No IDOR on profile/account**: `change-password` reads `session.user.id` and never trusts a body-provided ID ([src/app/api/account/change-password/route.ts:21-44](src/app/api/account/change-password/route.ts#L21-L44)); `deleteAccount` does the same ([src/actions/account.ts:11-37](src/actions/account.ts#L11-L37)); `getProfileUser`/`getProfileStats` resolve the user via the session ([src/lib/db/user.ts:67-95](src/lib/db/user.ts#L67-L95)).
- **Change-password verifies current password** via `bcrypt.compare` before accepting a new one ([src/app/api/account/change-password/route.ts:58-64](src/app/api/account/change-password/route.ts#L58-L64)).
- **Delete-account requires re-auth**: requires literal `"DELETE"` confirmation plus current password for credentials users, and uses `prisma.user.delete` so cascade deletes run ([src/actions/account.ts:15-37](src/actions/account.ts#L15-L37)). The Prisma schema confirms the cascades on `Account`, `Session`, `Item`, `Collection`, and user-owned `ItemType` ([prisma/schema.prisma:51, 63, 93, 117, 132](prisma/schema.prisma#L51)).
- **Verify endpoint is GET-safe**: idempotently rejects reused/expired tokens with a redirect, never echoes the token in the redirect URL ([src/app/api/auth/verify/route.ts:16-31](src/app/api/auth/verify/route.ts#L16-L31)).
- **Zod validation on every input boundary**: `register`, `forgot-password`, `reset-password`, `resend-verification`, `change-password`, and the credentials `authorize` callback all `safeParse` their inputs.
- **Password length enforced (min 8)** on register, reset, and change-password — meets the project baseline.
- **`proxy.ts` redirects unauthenticated users to `/sign-in`** for `/dashboard/*` and `/profile/*` with a `callbackUrl` ([src/proxy.ts:7-18](src/proxy.ts#L7-L18)).
- **No `any` in auth code paths** — all handlers, helpers, and callbacks are typed; the only loose cast is `(error as unknown as { code?: string }).code` in `signInWithCredentials`, which is a NextAuth-imposed shape, not a sloppy `any`.
- **Resend API key from env**, not hardcoded ([src/lib/email.ts:3](src/lib/email.ts#L3)).
- **No plaintext passwords in logs or responses**: only the bcrypt hash is persisted; `select` clauses on `User` queries are deliberate and never include `password` in API responses (the `getProfileUser` helper reads `password` to derive `hasPassword: boolean` and discards the hash before returning — [src/lib/db/user.ts:81-94](src/lib/db/user.ts#L81-L94)).

## Notes

- The audit assumes `AUTH_SECRET` / `NEXTAUTH_SECRET` is provisioned via env in production — `.env.example` does not list it explicitly, only `DATABASE_URL` and `ENABLE_EMAIL_VERIFICATION`. Worth adding `AUTH_SECRET=`, `AUTH_GITHUB_ID=`, `AUTH_GITHUB_SECRET=`, `RESEND_API_KEY=`, `NEXTAUTH_URL=` to `.env.example` so deployers know what to set.
- The 60-second resend cooldown in `createPasswordResetToken` is keyed on the email's existing token. If a developer ever changes the consume function to delete the token before the cooldown window, the cooldown silently breaks. Consider asserting it via a unit test.
- `FROM_EMAIL = "onboarding@resend.dev"` only works in Resend test mode — confirm the production deployment switches to a verified domain.
