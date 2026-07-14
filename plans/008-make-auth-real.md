# Plan 008: Make the auth you're keeping actually work — and stop it lying to users

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm
> the expected result before moving to the next step. If anything in the "STOP conditions" section
> occurs, stop and report — do not improvise. When done, update the status row for this plan in
> `plans/README.md`.
>
> **Drift check (run first)**:
> `git diff --stat ee39414..HEAD -- packages/api/src packages/db/src "apps/web/src/app/(main)/(auth)/" apps/web/src/app/api/trpc/`
> On a mismatch with the "Current state" excerpts, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED (touches auth config; a mistake locks people out)
- **Depends on**: none
- **Category**: bug / security
- **Planned at**: commit `ee39414`, 2026-07-12

## Why this matters

**Maintainer decision: auth and tRPC are being KEPT for future use.** That turns these from "dead code,
delete it" into "shipped surface that must not be broken." Today it is broken four ways, one of which
actively lies to users:

1. **Password reset is fake.** better-auth is configured with `emailAndPassword: { enabled: true }` and
   **no `sendResetPassword` handler** — so no reset email is ever dispatched. Meanwhile the form renders
   a green _"Password reset email sent! Check your inbox"_ panel on **every** submit, including
   failures, because it gates on `isSubmitSuccessful` (true whenever the handler resolves) rather than
   on the auth call's result (errors route to `onError` and never throw). A locked-out user gets a
   confident confirmation and no email, forever.
2. **No `BETTER_AUTH_SECRET` assertion.** It is never passed explicitly and never checked. If it is ever
   absent from an environment (preview deploys are the classic miss), better-auth falls back to a
   default signing secret — meaning session cookies and reset tokens signed with a value that isn't yours.
3. **Wildcard CORS on a credentialed endpoint.** `/api/trpc` sets `Access-Control-Allow-Origin: *` and
   `Access-Control-Allow-Headers: *` on every response, including POSTs, on a handler that builds its
   context from the session cookie. Bounded today only because nothing is exposed yet — a landmine armed
   for the day you actually use tRPC.
4. **No rate limiting, no `trustedOrigins`** on sign-in / reset endpoints.

Since you plan to build on this, fixing it now is far cheaper than discovering it when a real feature
depends on it.

## Current state

`packages/api/src/auth/auth.ts`:

```ts
const baseUrl =
  process.env.VERCEL_ENV === "production"
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.VERCEL_ENV === "preview"
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000";

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "sqlite" }),
  baseURL: baseUrl,
  emailAndPassword: {
    enabled: true, // <-- no sendResetPassword, no rateLimit, no trustedOrigins
  },
});
```

`packages/db/src/drizzle-client.ts:7-10` — a missing credential degrades to an empty string:

```ts
const client = createClient({
  url: process.env.TURSO_DATABASE_URL ?? "", // <-- silent
  authToken: process.env.TURSO_AUTH_TOKEN,
});
```

`apps/web/src/app/(main)/(auth)/_components/auth-form.tsx:140-166` — the false success:

```tsx
  const handlePasswordReset = form.handleSubmit(async (data) => {
    await authClient.requestPasswordReset({
      email: data.email,
      fetchOptions: {
        onSuccess: () => { toast.success("Password reset email sent successfully!"); },
        onError: (ctx) => { toast.error(ctx.error.message); },   // <-- does not throw
      },
    });
  });

  if (isSubmitSuccessful) {                                       // <-- true even when onError fired
    return (
      <div className="space-y-4 text-center">
        <div className="rounded-md bg-green-50 p-4 dark:bg-green-900/20">
          <p className="...">Password reset email sent! Check your inbox…</p>
```

The same always-resolves pattern applies to `UpdatePasswordForm` (`auth-form.tsx:220-233`).

`apps/web/src/app/api/trpc/[trpc]/route.ts:11-16` (applied to **every** response, incl. POST):

```ts
const setCorsHeaders = (res: Response) => {
  res.headers.set("Access-Control-Allow-Origin", "*");
  res.headers.set("Access-Control-Request-Method", "*");
  res.headers.set("Access-Control-Allow-Methods", "OPTIONS, GET, POST");
  res.headers.set("Access-Control-Allow-Headers", "*");
};
```

Env vars in play (**names only — never print or commit values**): `BETTER_AUTH_SECRET`,
`TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`. Declared in `.env.example` and `turbo.json`'s `globalEnv`.
`.env` / `.env*.local` are correctly gitignored; no secret is committed.

**Conventions**: `zod` is available (catalog dep). No `any`/`as`/`!`. Server-only code in `packages/api`.

## Commands you will need

| Purpose            | Command          | Expected on success   |
| ------------------ | ---------------- | --------------------- |
| Typecheck          | `pnpm typecheck` | exit 0                |
| Lint               | `pnpm lint`      | exit 0                |
| Build              | `pnpm build`     | exit 0                |
| Dev (needs `.env`) | `pnpm dev:web`   | http://localhost:3000 |

## Scope

**In scope**:

- `packages/api/src/auth/auth.ts`
- `packages/api/src/env.ts` (create)
- `packages/db/src/drizzle-client.ts`
- `apps/web/src/app/(main)/(auth)/_components/auth-form.tsx`
- `apps/web/src/app/api/trpc/[trpc]/route.ts`
- `.env.example` (document any new var **by name only**)

**Out of scope**:

- **Do not delete tRPC or auth.** The maintainer is keeping both. This plan makes them correct, not
  smaller.
- The auth UI's visual design — only the success/error _logic_ changes.
- `packages/db/src/drizzle-schema-auth.ts` — generated by `@better-auth/cli`; do not hand-edit.
- Adding new tRPC procedures or features.

## Git workflow

- Branch: `kyh/008-auth-hardening`
- One commit per numbered step (they are independently revertable).

## Steps

### Step 1: Fail fast on missing secrets

Create `packages/api/src/env.ts` exporting a zod-validated env object that **throws at import time** if
`BETTER_AUTH_SECRET`, `TURSO_DATABASE_URL`, or `TURSO_AUTH_TOKEN` is missing or empty.

Use it in `auth.ts` — pass `secret: env.BETTER_AUTH_SECRET` **explicitly** to `betterAuth()` — and in
`drizzle-client.ts`, replacing `?? ""`.

Never log the values. The error message names the **variable** only.

**Verify**: `pnpm build` → 0 with a valid `.env`. Then temporarily run with one var unset
(`BETTER_AUTH_SECRET= pnpm dev:web`) → the app **fails fast**, naming the variable, instead of starting.
Restore your `.env`.

### Step 2: Wire a real password-reset mailer

Configure `emailAndPassword.sendResetPassword` in `auth.ts` (and `emailVerification.sendVerificationEmail`
if you enable verification).

**Provider decision required.** There is no email provider in the repo (no Resend/Postmark/SES dep, no
SMTP config). Pick the smallest thing that works — Resend is the common pairing with Vercel +
better-auth — and:

- add the dependency to `packages/api`
- read its API key from a **new env var** (name it in `.env.example`, add it to `turbo.json`'s
  `globalEnv`; **never commit a value**)
- if the key is absent in **development**, log the reset URL to the server console instead of sending,
  so local flows are testable without a provider account

If you cannot make the provider decision without the maintainer, **STOP and report** — do not half-wire it.

**Verify**: request a password reset locally → the reset URL appears in the server console (dev
fallback) or a real email is dispatched. Following it reaches `/auth/password-update` with a valid token
and the password actually changes.

### Step 3: Make the forms tell the truth

Stop gating the success panel on `isSubmitSuccessful`. Drive it from the auth call's actual outcome —
better-auth's client returns `{ data, error }`; branch on that (or set local state from
`onSuccess`/`onError`).

Apply to **both** `RequestPasswordResetForm` (`:140-166`) and `UpdatePasswordForm` (`:220-233`).

Also confirm `UpdatePasswordForm` passes the reset **token** from the URL to `authClient.resetPassword(...)`.
If the token isn't plumbed through, reset cannot work even once step 2 lands — fix it here.

**Verify**: submit the reset form in a way that errors (e.g. stop the DB) → you see the **error** state,
not a green "check your inbox". Submit a valid one → success state, and an email/console URL appears.

### Step 4: Remove the wildcard CORS

Delete `setCorsHeaders` and the `OPTIONS` export from `apps/web/src/app/api/trpc/[trpc]/route.ts`. The
app is same-origin (`apps/web/src/trpc/react.tsx` builds its URL from the same origin / `VERCEL_URL`), so
it needs neither. Note in a comment that a future cross-origin consumer needs an explicit origin
allowlist with enumerated headers — never `*`.

**Verify**: `curl -si localhost:3000/api/trpc/user.me | grep -i access-control` → no CORS headers. Sign
in through the UI → still works.

### Step 5: Add rate limiting and explicit trusted origins

Add better-auth's `rateLimit` block (throttling sign-in and reset-request) and an explicit
`trustedOrigins` list derived from the same `baseUrl` logic already in the file (production domain,
preview URL, localhost).

**Verify**: `pnpm build` → 0; sign-in works; repeated rapid failed sign-ins are throttled.

## Test plan

No auth test harness exists. The right coverage is **one end-to-end happy path** — the risk in this
layer is configuration, not logic (better-auth and Drizzle are tested upstream).

Manually verify and record in the PR description:

1. Register → succeeds, session established
2. Sign out → session cleared
3. Sign in → succeeds
4. **Request password reset → an email/console URL is actually produced** (the bug this plan exists to fix)
5. Follow the reset link → set a new password → sign in with it
6. Trigger a reset failure → the UI shows an **error**, not a success panel

A single Playwright spec covering 1–6 would be welcome but is not required.

## Done criteria

ALL must hold:

- [ ] `grep -rn "sendResetPassword" packages/api/src` → matches (a real handler exists)
- [ ] `grep -rn 'Access-Control-Allow-Origin", "\*"' apps/web/src` → no match
- [ ] `grep -n '?? ""' packages/db/src/drizzle-client.ts` → no match
- [ ] `betterAuth({...})` is passed an explicit `secret`
- [ ] Starting with a missing `BETTER_AUTH_SECRET` **fails fast**, naming the var
- [ ] A password reset produces a real email (or, in dev without a provider key, a console reset URL)
- [ ] A failed reset request renders the **error** state, not the green success panel
- [ ] `pnpm typecheck`, `pnpm lint`, `pnpm build` all exit 0
- [ ] **No secret values** appear in any committed file, log, or comment
- [ ] `.env.example` documents any new var by name, with no value
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- **You cannot choose an email provider without the maintainer.** Do not half-wire step 2 — a
  partially-configured mailer is exactly the state this plan is fixing.
- better-auth's installed version doesn't expose `sendResetPassword` / `rateLimit` / `trustedOrigins`
  under these names (check the version's types before assuming).
- Removing the CORS headers breaks an in-repo caller (grep for cross-origin tRPC usage first).
- **You discover `BETTER_AUTH_SECRET` was not set in a deployed environment.** That is a rotation event:
  report it immediately. Sessions and reset tokens issued by that deployment must be treated as
  compromised and the secret rotated — do not simply set the variable and move on.
- The reset token isn't plumbed from the URL to `resetPassword`, and fixing that requires changing
  routes outside the in-scope list.

## Maintenance notes

- Auth has exactly **one** consumer today: `user.me`, called from nowhere. This plan deliberately does
  not delete it — the maintainer wants it for a future feature (favorites/collections is the natural
  fit; `drizzle-schema.ts` literally reserves space for "application tables beyond auth"). Until that
  feature exists, this surface is untested by real usage, so keep the E2E checklist above in the PR
  template for anyone touching auth.
- `db-sync.yml` pushes schema to production Turso on every `main` commit (Plan 010 adds guardrails), so
  any auth-schema change here reaches prod immediately and unreviewed. **Land Plan 010 before making
  schema changes.**
- Reviewer should scrutinize: that no secret value leaked into a log line, and that success/error
  branching in `auth-form.tsx` is driven by the auth response, not by form state.
