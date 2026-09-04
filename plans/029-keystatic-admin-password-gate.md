# Plan 029: Password-gate the Keystatic admin UI before production launch

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in "STOP conditions" occurs, stop and report — do
> not improvise. When done, update the status row for this plan in
> `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 5806187..HEAD -- keystatic.config.ts middleware.ts app/keystatic .env.local`
> If any of these changed since this plan was written, compare "Current
> state" against the live files before proceeding; on a mismatch, treat it
> as a STOP condition.

## Status

- **Priority**: P1 (blocks production launch — user is about to put the site
  live at `https://antibroadcasting.vercel.app/` with `/keystatic` fully
  public)
- **Effort**: M
- **Risk**: MED (security-relevant, but scoped to two new routes; doesn't
  touch existing collections/singletons/readers)
- **Depends on**: none (independent of plan 026's GitHub-mode storage
  activation — see "Why this matters")
- **Category**: launch-blocker
- **Planned at**: commit `5806187`, 2026-08-13

## Why this matters

Confirmed by direct inspection — no `middleware.ts` exists anywhere in the
repo, no `vercel.json`/`vercel.ts`, and `app/api/keystatic/[...params]/route.ts`
+ `app/keystatic/[[...params]]/page.tsx` have zero auth checks. This was
flagged and explicitly accepted as a non-blocker in `plans/README.md`
("Accepted, not a launch blocker") back when there was no live production
domain. That's changing now — the user is about to make the site reachable
at `https://antibroadcasting.vercel.app/`, which makes `/keystatic` a public,
unauthenticated content-editing surface for anyone who finds the URL.

This is deliberately **separate** from plan 026's GitHub-mode storage spike
(already merged, still inert — see `docs/keystatic-github-mode-migration.md`).
That work controls who can *persist* a change (a GitHub account with repo
write access, once the owner sets three env vars). This plan controls who
can *reach the admin UI at all*. They're complementary, not redundant: even
after GitHub-mode is activated, the admin UI stays publicly browsable per
that doc's own tradeoffs section — only saves are gated. The user chose a
custom password gate over Vercel's native Deployment Protection (likely a
paid-plan feature, unconfirmed) and over relying on GitHub-mode alone (admin
UI would still be publicly reachable/browsable).

## Current state

`keystatic.config.ts:4-8` — GitHub-mode scaffold from plan 026, inert today
(no `KEYSTATIC_GITHUB_CLIENT_ID` set):

```ts
const githubStorage = process.env.KEYSTATIC_GITHUB_CLIENT_ID
  ? ({ kind: "github", repo: { owner: "travhall", name: "antibroadcasting" } } as const)
  : null;
```

`app/api/keystatic/[...params]/route.ts` (full file):

```ts
import { makeRouteHandler } from "@keystatic/next/route-handler";
import keystatic from "@/keystatic.config";

export const { POST, GET } = makeRouteHandler({ config: keystatic });
```

`app/keystatic/[[...params]]/page.tsx` (full file):

```tsx
"use client";
import { makePage } from "@keystatic/next/ui/app";
import keystatic from "@/keystatic.config";
export default makePage(keystatic);
```

`app/api/send/route.ts:71-74` — existing repo convention for an optional
secret that no-ops in local dev, worth mirroring exactly for consistency:

```ts
const secret = process.env.TURNSTILE_SECRET_KEY;
// No secret = local dev, skip verification
if (!secret) return true;
```

No `middleware.ts` exists at the repo root. No `crypto`/HMAC usage exists
anywhere in the codebase yet (`lib/alert-visibility.ts` has a *non-cryptographic*
hash for a client-side dismiss-cache-key, unrelated).

## Commands you will need

| Purpose   | Command                  | Expected on success |
|-----------|---------------------------|---------------------|
| Typecheck | `pnpm exec tsc --noEmit`  | exit 0              |
| Lint      | `pnpm lint`                | exit 0              |
| Tests     | `pnpm test`                | all pass            |
| Build     | `pnpm build`               | exit 0              |

## Scope

**In scope**:
- `lib/keystatic-gate.ts` (new) — password verification + signed-cookie
  helpers, Edge-runtime-safe (Web Crypto `crypto.subtle`, no Node-only APIs,
  since middleware defaults to the Edge runtime)
- `proxy.ts` (new, repo root — planned as `middleware.ts`, renamed during
  execution; Next.js 16.2.9 deprecates that filename, see "Maintenance
  notes") — gates `/keystatic/:path*` and
  `/api/keystatic/:path*`
- `app/keystatic-login/page.tsx` (new) — password form + server action that
  sets the gate cookie
- `.env.local` — add `KEYSTATIC_ADMIN_PASSWORD` as an empty/commented
  placeholder, following the exact pattern already used for
  `TURNSTILE_SECRET_KEY` etc.
- `README.md` — document the new env var
- `plans/README.md` — new batch row + update the "Accepted, not a launch
  blocker" note (it's being resolved, not staying accepted)

**Out of scope**:
- Any change to `app/api/keystatic/[...params]/route.ts` or
  `app/keystatic/[[...params]]/page.tsx` — both stay exactly as-is; the gate
  sits entirely in `proxy.ts`, in front of them.
- Activating GitHub-mode storage (plan 026's territory) — operator-only,
  unchanged by this plan.
- Setting any real env var value anywhere (locally or in Vercel) — that's
  the user's manual step after this plan lands.
- A logout affordance — out of scope for this pass; cookie simply expires
  (30 days). Note in "Maintenance notes" as a future nice-to-have.
- Rate-limiting login attempts — out of scope; flagged as a future
  hardening step if this ever proves to be brute-forced (unlikely for an
  internal admin gate on an obscure path, but worth naming so it isn't
  silently forgotten).

## Steps

### Step 1: `lib/keystatic-gate.ts`

Create with:

```ts
const COOKIE_NAME = "keystatic_gate";
const SIGNING_MESSAGE = "keystatic-gate-v1";

function isGateEnabled(): boolean {
  return !!process.env.KEYSTATIC_ADMIN_PASSWORD;
}

async function hmac(key: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(key),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, enc.encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function signGateCookie(): Promise<string> {
  const password = process.env.KEYSTATIC_ADMIN_PASSWORD ?? "";
  return hmac(password, SIGNING_MESSAGE);
}

async function verifyGateCookie(value: string | undefined): Promise<boolean> {
  if (!isGateEnabled() || !value) return false;
  const expected = await signGateCookie();
  return timingSafeEqual(value, expected);
}

async function verifyPassword(input: string): Promise<boolean> {
  const password = process.env.KEYSTATIC_ADMIN_PASSWORD;
  if (!password) return false;
  return timingSafeEqual(await hmac(input, SIGNING_MESSAGE), await hmac(password, SIGNING_MESSAGE));
}

export { COOKIE_NAME, isGateEnabled, signGateCookie, verifyGateCookie, verifyPassword };
```

Manually encoding hex from `Uint8Array` (rather than `Buffer.from(...).toString("hex")`)
keeps this Edge-runtime-safe without depending on `Buffer`, which is
Node-only and not guaranteed in whatever runtime Next.js middleware executes
under on this Next.js version — confirm current behavior rather than
assuming, but don't introduce the dependency if the manual encode works
fine either way.

**Verify**: `pnpm exec tsc --noEmit` → exit 0.

### Step 2: `proxy.ts` (repo root)

> Executed as `proxy.ts` with an exported `proxy()` function — see
> "Maintenance notes" for why this differs from the filename below.

```ts
import { NextRequest, NextResponse } from "next/server";
import { COOKIE_NAME, isGateEnabled, verifyGateCookie } from "@/lib/keystatic-gate";

export const config = {
  matcher: ["/keystatic", "/keystatic/:path*", "/api/keystatic/:path*"],
};

export async function middleware(req: NextRequest) {
  // Executed as `export async function proxy(...)` in `proxy.ts` — see Maintenance notes.
  if (!isGateEnabled()) return NextResponse.next();

  const cookie = req.cookies.get(COOKIE_NAME)?.value;
  if (await verifyGateCookie(cookie)) return NextResponse.next();

  const loginUrl = new URL("/keystatic-login", req.url);
  loginUrl.searchParams.set("from", req.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}
```

Confirm the matcher does not also catch `/keystatic-login` or
`/api/keystatic-login` (it shouldn't — those are separate path prefixes) —
grep the file for `keystatic-login` after writing it and confirm zero
matches inside the `matcher` array.

**Verify**: `pnpm exec tsc --noEmit` → exit 0.

### Step 3: `app/keystatic-login/page.tsx`

Server component with an inline server action. Must:
- Read `from`/`error` from `searchParams` (Next 16: `searchParams` is a
  `Promise`, await it — follow the pattern already used elsewhere in this
  codebase, e.g. check `app/(site)/updates/[slug]/page.tsx` for the current
  `params`/`searchParams` awaiting convention before writing this).
- If `!isGateEnabled()`, redirect straight to `from ?? "/keystatic"` — no
  point showing a login form when the gate is off (local dev default).
- On submit: verify the password via `verifyPassword`; on failure, redirect
  back to `/keystatic-login?error=1&from=...`; on success, sign the cookie
  via `signGateCookie`, set it with `(await cookies()).set(...)` —
  `httpOnly: true`, `secure: process.env.NODE_ENV === "production"`,
  `sameSite: "lax"`, `path: "/"`, `maxAge: 60 * 60 * 24 * 30` — then
  `redirect(target)`.
- Keep the page visually minimal (plain form, no site chrome — this route
  sits outside the `(site)` route group like `app/keystatic` already does,
  so no header/footer/alert-banner wraps it automatically; don't add any).
  Match this codebase's existing Tailwind conventions for a bare form (spot-
  check `components/ui/QuoteForm.tsx` for input/label/button class patterns
  already in use, don't invent a new visual style).
- Show a visible error message when `error=1` is present.

**Verify**: `pnpm exec tsc --noEmit` → exit 0. `pnpm lint` → exit 0.

### Step 4: Env var + docs

- `.env.local`: add, in the same commented-placeholder style as the existing
  Keystatic GitHub block:

  ```
  # Keystatic admin gate — shared password protecting /keystatic and
  # /api/keystatic from the public. Leave empty in local dev to skip the
  # gate entirely (matches this repo's existing no-op-when-unset pattern).
  # KEYSTATIC_ADMIN_PASSWORD=
  ```

- `README.md`: add `KEYSTATIC_ADMIN_PASSWORD` to the "Environment Variables"
  list, same format as the other entries, noting it gates `/keystatic` +
  `/api/keystatic` and no-ops when unset.

**Verify**: `grep -n "KEYSTATIC_ADMIN_PASSWORD" .env.local README.md` → at
least one match in each file.

### Step 5: Manual local verification

1. With `KEYSTATIC_ADMIN_PASSWORD` unset: `pnpm dev`, visit
   `http://localhost:3000/keystatic` — should load with **no** redirect
   (gate off, matches today's behavior exactly).
2. Set `KEYSTATIC_ADMIN_PASSWORD=test-only-local-value` in `.env.local`
   temporarily, restart `pnpm dev`. Visit `/keystatic` — should redirect to
   `/keystatic-login?from=%2Fkeystatic`. Submit the wrong password — should
   redirect back with `error=1` visible. Submit the right password — should
   land back on `/keystatic` and stay there on refresh (cookie persists).
3. Revert `.env.local` back to the empty placeholder before finishing (never
   leave a real-looking password value committed or left in the working
   tree past this manual check).

**Verify**: all three behaviors above observed exactly as described.

### Step 6: Full verification pass

```bash
pnpm exec tsc --noEmit && pnpm lint && pnpm test && pnpm build
```

**Verify**: all four exit 0. `pnpm build`'s route list should show
`/keystatic-login` as a new route alongside the existing `/keystatic` and
`/api/keystatic/[...params]`.

## Test plan

No new automated tests — this is a middleware/auth gate whose behavior
depends on request cookies and env vars, which existing test infra
(`vitest`, no request-mocking setup currently in this repo) isn't set up to
exercise. Step 5's manual walkthrough is the verification. If this repo
later adds an integration-test harness capable of mocking `NextRequest`/
cookies, add a case then — not blocking this plan.

## Done criteria

Machine-checkable. ALL must hold:

- [x] `lib/keystatic-gate.ts`, `proxy.ts`, `app/keystatic-login/page.tsx`
  all exist
- [ ] `pnpm exec tsc --noEmit` exits 0
- [ ] `pnpm lint` exits 0
- [ ] `pnpm test` exits 0
- [ ] `pnpm build` exits 0, route list includes `/keystatic-login`
- [ ] `grep -n "KEYSTATIC_ADMIN_PASSWORD" .env.local README.md` — match in
  both
- [ ] `.env.local`'s `KEYSTATIC_ADMIN_PASSWORD` line is empty/commented, not
  a real value (`git diff .env.local` — though this file is gitignored, so
  also visually confirm the working file directly)
- [ ] Step 5's three manual behaviors all confirmed
- [ ] No files outside the in-scope list modified (`git status`)
- [ ] `plans/README.md` status row added and "Accepted, not a launch
  blocker" note updated

## STOP conditions

- `proxy.ts` matcher accidentally also catches `/keystatic-login` or
  `/api/keystatic-login` — would create a redirect loop. Verify the grep in
  Step 2 before moving on.
- `crypto.subtle` is unavailable in whatever runtime the deployed middleware
  actually executes under — this would be a genuine surprise (it's a
  standard Web API present in both the Edge runtime and modern Node.js);
  stop and report rather than swapping to a Node-only `crypto` module
  without confirming the runtime first.
- Any step tempts you toward setting a real `KEYSTATIC_ADMIN_PASSWORD`
  anywhere persistent (committed file, Vercel dashboard) — that's the user's
  manual step after this plan lands, not something to do here.

## Maintenance notes

- **Filename/export correction (2026-08-13)**: this plan was written against
  `middleware.ts` / `export async function middleware(...)`. During Step 6's
  build, Next.js 16.2.9 printed: "The 'middleware' file convention is
  deprecated. Please use 'proxy' instead." Confirmed against
  `node_modules/next/dist/build/analysis/get-page-static-info.js` that the
  required filename is `proxy.ts` and the required export name is `proxy`
  (or default export) — executed as `proxy.ts` / `export async function
  proxy(...)` instead, with identical logic. All other steps unaffected.

- Once GitHub-mode storage (plan 026) is eventually activated, this gate
  still matters — GitHub OAuth only gates *saves*, this gate controls who
  can *reach* the admin UI at all. Keep both.
- No logout route exists yet. If ever needed: a route that clears the
  `keystatic_gate` cookie (`Set-Cookie` with `maxAge: 0`) and redirects to
  `/`.
- No login-attempt rate limiting exists yet. `app/api/send/route.ts` already
  has an in-memory per-IP rate limiter pattern (`rateLimitMap`) that could be
  copied here if brute-forcing ever becomes a real concern.
- If the password is ever rotated, every previously-issued cookie
  invalidates automatically (the cookie is a signature *over* the password,
  not the password itself) — no separate cookie-invalidation step needed.
