# Antibroadcasting Email Infrastructure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give Antibroadcasting real, professional, branded mailboxes for its people (Jim, Chris, `info@`, `quotes@`, and room to grow) *and* a properly isolated, consistently-branded system for the automated emails the website already sends (and the ones it's missing — most notably, the site never confirms receipt to the customer who submitted a quote request).

**Architecture:** Two deliberately separate email systems sharing one domain, isolated by DNS subdomain so neither can break the other's deliverability:

1. **Human mailboxes** (`jim@`, `chris@`, `info@`, `quotes@antibroadcasting.com`) — real, two-way, human-monitored inboxes on the root domain, hosted by a third-party mailbox provider (not built in this repo).
2. **System/transactional email** — one-way, automated, sent by the Next.js app via Resend (already partially wired up) from a dedicated subdomain (`send.antibroadcasting.com`), rendered with a shared branded template so every automated email looks like it came from the same company as the human mail.

Splitting these onto root domain vs. subdomain isn't cosmetic — it's the current (2026) email-authentication best practice for exactly this situation (one small business, one domain, two unrelated senders touching it), confirmed via research below. It also sidesteps a real technical constraint: SPF allows only one TXT record per hostname and a hard 10-DNS-lookup budget, so stacking a mailbox provider's SPF `include` and Resend's SPF `include` on the *same* hostname is fragile and gets more fragile every time either provider changes infrastructure. Split hostnames, split SPF records, no shared budget, no fights.

**Tech Stack:** Next.js 16 (Turbopack) App Router, Resend (`resend@^6.14.0`) for transactional send, `react-email` + `@react-email/components` (new dependency, this plan) for the branded template layer, Zod v4 for request validation (existing), Vitest for tests (existing), Keystatic for editorial content (existing — `content/site-info.json` / `lib/get-site-info.ts`).

## Global Constraints

- Package manager is `pnpm` — use `pnpm add`, `pnpm exec`, `pnpm test`, `pnpm lint`, `pnpm build` for every command in this plan, never `npm`/`npx`/`yarn`.
- Verification commands for every code task: `pnpm exec tsc --noEmit`, `pnpm lint` (ESLint, zero warnings expected), `pnpm build`, `pnpm test` (Vitest — `pnpm test` runs `vitest run`).
- Editorial/business content (company name, contact info, business rules like `responseTime`) lives in `content/site-info.json` and is read through `lib/get-site-info.ts` (`getSiteInfo()`, React `cache()`-wrapped). Developer/infra-only config lives in `lib/site-config.ts`. Do not blur this line — new business copy goes in `content/site-info.json`, not hardcoded in a component.
- `zod@^4.4.3` is in use — this version's error-tree helper is `z.treeifyError(error)`, not the v3 `.format()`/`.flatten()` API. Match the existing usage in `app/api/send/route.ts:102`.
- Existing test convention (`app/api/send/route.test.ts`): `vi.mock("resend", () => ({ Resend: class { emails = { send: sendMock } } }))`, one module-level `sendMock = vi.fn()`, `afterEach(() => sendMock.mockReset())`, dynamic `const { POST } = await import("./route")` after the mock is registered. New tests in this plan must follow the same shape.
- Git workflow, matching this session's established convention: one branch per task group (`advisor/0NN-<slug>` naming is this repo's convention for the *code-tech-debt* plan series in `plans/`; for this email initiative use `email/0N-<slug>` to keep the two plan series visually distinct in `git branch`), commit per step, `git merge --no-ff <branch> -m "Merge <branch>"` into `main`, delete the branch after merge. Do not push or open a PR unless told to.
- `plans/` (lowercase, repo root) is **gitignored** — it's the `improve`-skill's own scratch/advisor-plan directory and never reaches `main`. This document intentionally lives in `docs/superpowers/plans/` instead, which **is** tracked, because it's a real roadmap deliverable, not scratch output.
- Brand tokens (from `app/globals.css`) for use in email HTML — email clients cannot reliably consume CSS custom properties or `oklch()`, so hardcode hex everywhere in email templates:
  - Brand gold accent: `#F2A900` (documented directly in `app/globals.css:31` as the hex equivalent of `--color-primary-400`).
  - Everything else in this plan's templates uses plain, high-contrast, email-safe values (near-black text on a white/cream background) rather than trying to reproduce the site's full dark-theme palette — see Task 9 for the exact values and why.
- The site's display font (`--font-display: var(--font-dominique)`) and body font (`--font-sans: var(--font-figtree-sans)`) are both custom, self-hosted web fonts. **Do not** attempt to load them in email templates — email clients (Outlook in particular) do not reliably support `@font-face`. Use a system-font fallback stack instead (specified in Task 9).
- This repo has no `vercel.json`/`vercel.ts` and this plan found no DNS/registrar reference anywhere in the codebase. **Which service currently manages `antibroadcasting.com`'s DNS (registrar's own DNS, Cloudflare, Vercel Domains, something else) is unknown and must be established as Task 1** before any DNS record can be added — do not assume.

---

## Roadmap Overview

| Phase | What | Type | Depends on |
|-------|------|------|------------|
| 0 | Prerequisites — find out who controls DNS | Ops | — |
| 1 | Human mailboxes: provider, accounts, DNS, signatures | Ops (client-facing decisions + DNS) | Phase 0 |
| 2 | System email: subdomain isolation, branded templates, the missing customer-confirmation email | Code | Phase 0 (DNS access) — **not** blocked on Phase 1 finishing, just on knowing who can add a DNS record |
| 3 | Verification & cutover | Ops + manual test | Phases 1 & 2 both merged |

Phases 1 and 2 touch different hostnames (root domain vs. `send.` subdomain) and different systems (a mailbox provider vs. this repo's code), so they can run in either order or in parallel once Phase 0 is done. They're presented as one roadmap because they're one client conversation and one DNS zone, but nothing stops Phase 2 (code) from being built and merged before Phase 1 (procurement) is finalized.

---

## Phase 0: Prerequisites

### Task 1: Establish DNS control and record the answer

**Type:** Ops — blocks every DNS step in Phases 1–3.

- [ ] **Step 1: Find out where `antibroadcasting.com`'s DNS is managed today.**

  Run this from any machine with `dig` installed (macOS ships it):

  ```bash
  dig NS antibroadcasting.com +short
  ```

  The nameservers returned tell you the DNS host:
  - `*.registrar-servers.com`, `*.domaincontrol.com`, etc. → DNS is likely still at the registrar (Namecheap, GoDaddy, etc.) — whoever has the registrar login controls DNS.
  - `*.ns.cloudflare.com` → Cloudflare manages DNS — whoever has the Cloudflare account controls DNS (and gets Cloudflare Email Routing as a side benefit — see Task 2's rejected-options note).
  - `*.vercel-dns.com` → Vercel manages DNS for this domain — whoever has access to the Vercel project/team controls DNS.

- [ ] **Step 2: Confirm who has login access to that account** (you, Chris, or someone else). This determines who executes the DNS steps in Tasks 4, 5, 12, and 14 — either you do it directly, or you hand Chris/Jim an exact list of records to paste in (this plan gives you that exact list either way).

- [ ] **Step 3: Record the answer** at the top of this plan file's "Notes" section (add one at the bottom of this document once known) so Phases 1–3 don't re-ask this question.

**Done when:** you know the DNS host and who can log into it. No commit — this is a research/coordination step, not a code change.

---

## Phase 1: Human Mailboxes

Covers: `jim@antibroadcasting.com`, `chris@antibroadcasting.com`, `info@antibroadcasting.com`, `quotes@antibroadcasting.com` (a real, human-monitored inbox — distinct from the *automated sender identity* also called `quotes@` in the current code, which Phase 2 moves to an isolated subdomain so the two don't collide), plus room for "one or two more" without extra cost.

### Task 2: Decide on a mailbox provider

**Type:** Ops — client-facing decision. This is the pitch material for Chris.

Every option below was checked against current (2026) pricing and feature pages, not assumed. Sources at the end of this document.

| Provider | Cost for 4 mailboxes | Real two-way mailbox? | Native webmail/apps? | Custom domain? | Notes |
|---|---|---|---|---|---|
| **Zoho Mail Free** | **$0/year** | Yes | Yes (Zoho's own webmail + mobile apps) | Yes, 1 domain | 5-user cap, no IMAP/POP on free tier (must use Zoho's webmail/app, not Gmail/Outlook app), no per-user aliases — but **unlimited Groups** (up to 30), which is the answer for "one or two more" addresses without using a 5th/6th user slot. |
| **Cloudflare Email Routing** | $0/year | **No** — forward-only | No | Yes | Real addresses exist and forward to Jim/Chris's personal Gmail, but there's no shared inbox, no sent-mail history, no "send as" without extra SMTP setup, and replies come from a personal account unless you bolt on more infrastructure. Fine as a stopgap, not as the real answer. |
| **Migadu** | $19–90/year *flat, unlimited mailboxes* | Yes | Basic webmail (Roundcube-based), best with a real IMAP client (Apple Mail, Outlook, Thunderbird) | Yes, unlimited domains | Cheapest true multi-mailbox option if Jim/Chris are comfortable picking their own mail app. Daily send/receive volume caps scale with tier; irrelevant at this business's volume. |
| **Purelymail** | **$10/year flat**, unlimited mailboxes/domains | Yes | Minimal, IMAP-first | Yes | Even cheaper than Migadu, same trade-off (BYO mail client). |
| **Fastmail Standard** | ~$60–72/year *per mailbox on the paid seat(s)* | Yes | Polished, best-in-class webmail + apps | Yes (requires ≥1 Standard-tier seat) | Best UX of the paid options; still far cheaper than Google/Microsoft. |
| **Google Workspace Business Starter** | ~$84–101/year *per mailbox* | Yes | Gmail (most familiar to most people) + Drive/Calendar/Meet | Yes | Worth it only if Jim/Chris already live in Gmail personally and want Docs/Drive/Meet bundled in. |
| **Microsoft 365 Business Basic** | ~$72–84/year *per mailbox* | Yes | Outlook + Teams/OneDrive | Yes | Worth it only if they're already an Office/Outlook shop. |

**Recommendation to pitch Chris:** Start with **Zoho Mail Free** — $0/year, real two-way mailboxes for all four addresses today, native webmail and mobile apps so nothing feels janky, and Groups cover future addresses (e.g. `sales@`, `art@`) at no extra cost. The only real trade-off is no IMAP/POP on the free tier, meaning Jim and Chris check mail via Zoho's own app/webmail rather than adding the account to Gmail/Outlook's app — for two people running a small print shop, that's a minor UX cost for $0/year, not a dealbreaker. If that ever becomes a real problem, the upgrade path is Zoho **Mail Lite at $1/user/month** (adds IMAP/POP) — still far cheaper than every paid competitor above. If Zoho's product feels wrong for them after a trial, **Fastmail Standard** is the fallback recommendation (best UX-per-dollar of the paid tiers).

**Explicitly rejected as the *primary* solution (not as a stopgap):**
- *Cloudflare Email Routing alone* — no shared inbox, no real "send as" without extra work, doesn't read as a real business mailbox to anyone who hits "reply." Fine as a same-day $0 bridge while Zoho signup is pending, not a destination.
- *Using Resend for human correspondence* (e.g., wiring Jim's replies through the Resend account already in this repo) — Resend is a transactional/programmatic sending API, not a mailbox. It has no inbox, no reply-received capability, and mixing real two-way human correspondence into a transactional-sender's reputation is a deliverability risk for the *automated* mail this plan is also trying to protect (Phase 2). Keep these systems separate — that separation is this whole plan's architectural spine.

- [ ] **Step 1: Review the comparison table above with Chris. Confirm Zoho Mail Free (or the fallback) as the decision.**
- [ ] **Step 2: Record the decision** in this document's "Notes" section at the bottom.

**Done when:** a provider is chosen and written down. No commit.

### Task 3: Create the Zoho Mail account and start domain verification

**Type:** Ops.

- [ ] **Step 1:** Go to `zoho.com/mail` → sign up for the Free plan → enter `antibroadcasting.com` as the domain.
- [ ] **Step 2:** Zoho will present a **TXT domain-verification record** (a `zb...` code under `_zoho.antibroadcasting.com` or as a root TXT — Zoho's dashboard shows the exact hostname and value at signup time; copy it exactly as shown, do not retype it).
- [ ] **Step 3:** Using the DNS access established in Task 1, add that TXT record.
- [ ] **Step 4:** Back in Zoho's dashboard, click "Verify." Zoho polls DNS — this can take a few minutes to a few hours depending on the DNS host's propagation speed.
- [ ] **Step 5: Verify from the command line** once you've clicked verify in Zoho's dashboard:

  ```bash
  dig TXT antibroadcasting.com +short
  ```

  Confirm the Zoho verification string appears in the output (alongside any other TXT records already on the root — don't remove those).

**Done when:** Zoho's dashboard shows the domain as verified. No commit — this is entirely in Zoho's and the DNS host's dashboards.

### Task 4: Add Zoho's MX and SPF records, create the mailboxes

**Type:** Ops.

- [ ] **Step 1:** In Zoho's dashboard, under Mail → your domain → "Email Configuration," Zoho lists the exact MX records it needs (typically three, at different priorities, all pointing at `*.zoho.com` hosts — Zoho's dashboard shows the live, current values; copy them exactly, do not use values from a blog post or this plan, MX targets do change).
- [ ] **Step 2:** Add all MX records Zoho lists, at the **root** of `antibroadcasting.com` (not a subdomain — human mail must arrive at the bare domain since addresses are `name@antibroadcasting.com`).
- [ ] **Step 3:** Zoho also provides an SPF TXT record for the root domain, typically `v=spf1 include:zoho.com ~all` (Zoho's dashboard shows the exact current string — use that, not this example, since Zoho's SPF include target has changed in the past). If a root-domain SPF TXT record already exists (there shouldn't be one yet, since this domain has never had mailboxes), this is where it goes; if the domain somehow already has a root SPF record (e.g. from a past setup), it must be **merged** into one record — DNS only permits one SPF TXT record per hostname, two silently breaks authentication for everyone.
- [ ] **Step 4: Verify from the command line:**

  ```bash
  dig MX antibroadcasting.com +short
  dig TXT antibroadcasting.com +short
  ```

  Confirm all Zoho MX hosts appear, and exactly one SPF-format TXT record (starting `v=spf1`) exists.

- [ ] **Step 5:** In Zoho's admin console, create four users/mailboxes: `jim@antibroadcasting.com`, `chris@antibroadcasting.com`, `info@antibroadcasting.com`, `quotes@antibroadcasting.com`. This is the real, human-monitored `quotes@` inbox — separate from the automated sender identity Phase 2 configures on the `send.` subdomain.
- [ ] **Step 6:** Send a real test email from an outside account (e.g. your personal Gmail) to `info@antibroadcasting.com` and confirm it arrives in Zoho's webmail within a couple minutes.

**Done when:** all four mailboxes exist and receive mail. No commit.

### Task 5: Publish a DMARC record

**Type:** Ops. DMARC tells receiving mail servers (Gmail, Yahoo, Outlook.com) what to do with mail that fails SPF/DKIM alignment, and — separately — where to send you authentication reports so you can see what's sending mail as your domain.

- [ ] **Step 1:** Add a TXT record at `_dmarc.antibroadcasting.com` with this value to start in **monitor-only mode** (does not affect delivery of legitimate mail, just starts collecting reports):

  ```
  v=DMARC1; p=none; rua=mailto:info@antibroadcasting.com; adkim=r; aspf=r
  ```

  - `p=none` — monitor only, take no enforcement action yet. This is the correct starting point; jumping straight to `p=reject` before you've confirmed every legitimate sender (Zoho *and* the Resend subdomain from Phase 2) authenticates cleanly risks legitimate mail bouncing.
  - `rua=mailto:info@antibroadcasting.com` — aggregate reports land in the `info@` mailbox Task 4 just created.
  - `adkim=r; aspf=r` — **relaxed** alignment. This matters specifically because of this plan's subdomain-isolation design: relaxed alignment lets a DMARC record published once, at the root (`_dmarc.antibroadcasting.com`), also cover mail authenticated from `send.antibroadcasting.com` (Phase 2), since relaxed mode treats the organizational domain as matching regardless of exact subdomain. One DMARC record now protects both mail systems this plan sets up.

- [ ] **Step 2: Verify:**

  ```bash
  dig TXT _dmarc.antibroadcasting.com +short
  ```

- [ ] **Step 3:** After Phase 2 and Phase 3's verification are both complete and you've confirmed a week or two of clean DMARC aggregate reports (no unexpected failures from either Zoho or Resend), tighten `p=none` to `p=quarantine`, then eventually `p=reject`. This is a follow-up, not part of this plan's initial rollout — record it as a dated to-do at the bottom of this document once Phase 3 is done.

**Done when:** the DMARC TXT record resolves. No commit.

### Task 6: Branded email signatures for Jim and Chris

**Type:** Ops — no third-party signature tool needed at this scale; Zoho Mail has built-in per-user signature configuration (Settings → Signatures), which is enough for two people.

- [ ] **Step 1:** Draft the signature copy and layout with Chris. Recommended structure, using only the business info already canonical in `content/site-info.json` (don't invent new copy — pull exact values from that file so the signature never drifts from the site):

  ```
  [Name]
  [Title — e.g. "Owner" / "Co-Owner"], Antibroadcasting Screen Printing

  [phone from content/site-info.json → "phone"]
  [email — jim@ or chris@antibroadcasting.com]
  antibroadcasting.com

  [addressStreet], [addressCity], [addressState] [addressZip]
  ```

- [ ] **Step 2:** Style it with the brand gold accent (`#F2A900`) on the name line only — matches the "consistently branded" ask without trying to cram the site's full visual system into a signature block, which most mail clients will mangle anyway. Bold, plain sans-serif (Arial/Helvetica) for the name; regular weight for everything else. No logo image in the signature — same reasoning as Task 9's template design: images add fragility (blocked-by-default in most clients) for very little payoff in a text signature block.
- [ ] **Step 3:** In Zoho Mail, each user goes to Settings → Signatures, pastes their own version in the HTML signature editor, sets it as default for new mail and replies.
- [ ] **Step 4:** Send a test email from each account to an outside address and confirm the signature renders correctly (check both a webmail client and a phone mail app if possible — signature HTML can render differently across clients).

**Done when:** both Jim and Chris have their signature configured and confirmed. No commit — this content lives in Zoho's account settings, not this repo.

---

## Phase 2: System / Transactional Email

Covers: isolating the app's automated sender onto its own subdomain, building one shared branded template, rebuilding the existing internal quote-notification email on that template, and adding the customer-facing confirmation email that **does not exist today** (`app/api/send/route.ts` currently sends exactly one email — to the business inbox, with `replyTo` set to the customer — the customer never receives anything back from the system itself).

### Task 7: Verify the `send.antibroadcasting.com` sending subdomain in Resend

**Type:** Ops, but gates every code task below — the code changes in Tasks 10–12 reference this subdomain by name.

- [ ] **Step 1:** In the Resend dashboard (resend.com/domains), click "Add Domain," enter `send.antibroadcasting.com` (the subdomain itself, not the root — this is what keeps Resend's SPF/DKIM off the root domain Zoho now owns).
- [ ] **Step 2:** Resend's dashboard will show the exact DNS records it needs — typically an MX record, an SPF-format TXT record, and a DKIM TXT record, all scoped to `send.antibroadcasting.com` (Resend's current DKIM selector convention is `resend._domainkey.send.antibroadcasting.com` per Resend's own setup docs — but always use the exact values Resend's dashboard shows for this specific domain/account, not a generic example, since selectors can be account-specific).
- [ ] **Step 3:** Add all records Resend lists, using the DNS access from Task 1. Since `send.antibroadcasting.com` has no other purpose (no human mailbox lives there, nothing else sends from it), there's no merge-conflict risk with any existing record the way there would be on the root domain.
- [ ] **Step 4: Verify:**

  ```bash
  dig MX send.antibroadcasting.com +short
  dig TXT send.antibroadcasting.com +short
  dig TXT resend._domainkey.send.antibroadcasting.com +short
  ```

  Confirm Resend's MX, SPF, and DKIM records all resolve.

- [ ] **Step 5:** Click "Verify" in Resend's dashboard and confirm it shows the domain as verified (green/active), not pending.

**Done when:** Resend shows `send.antibroadcasting.com` as a verified sending domain. No commit.

### Task 8: Add `react-email` and set up the email preview dev script

**Files:**
- Modify: `package.json`

**Interfaces:**
- Produces: an `email:dev` script other tasks' authors can run to visually check a template while building it (react-email's dev server hot-reloads template files and renders them in a browser — much faster feedback than sending real test emails while iterating).

- [ ] **Step 1: Install the dependencies.**

  ```bash
  pnpm add react-email @react-email/components
  ```

  Let `pnpm` resolve the current version (don't pin a specific version by hand in this plan — check whatever `pnpm add` resolves against `resend`'s own peer expectations if `pnpm install` reports a peer-dependency warning, and note the resolved version in this document's "Notes" section once installed).

- [ ] **Step 2: Add the preview script** to `package.json`'s `"scripts"` block:

  ```json
  "email:dev": "email dev --dir lib/emails"
  ```

- [ ] **Step 3: Verify the install and script work** — this will fail right now since `lib/emails/` doesn't exist yet (Task 9 creates it), which is expected:

  ```bash
  pnpm exec tsc --noEmit
  ```

  Expected: exit 0 (installing a dependency and adding an unrelated npm script doesn't touch any typed code yet).

- [ ] **Step 4: Confirm the `render()` API surface against current docs before Task 9 depends on it.** Every pricing/DNS/best-practice claim elsewhere in this plan was checked against a live source during authorship (see "Sources") — the one exception is `render(element, { plainText: true })`'s exact signature in Tasks 9–11, which was written from memory, not verified. Before writing Task 9's test, check the installed `react-email`/`@react-email/components` version's own docs (or `node_modules/@react-email/components/dist/*.d.ts` types) for `render()`'s current signature and confirm the `plainText` option name and behavior still match. If it's changed, update Tasks 9–11's code blocks to match before implementing them, and note the correction in this document's "Notes" section.

- [ ] **Step 5: Commit.**

  ```bash
  git add package.json pnpm-lock.yaml
  git commit -m "chore: add react-email for branded transactional templates"
  ```

### Task 9: Build the shared branded email layout

**Files:**
- Create: `lib/emails/BrandedEmailLayout.tsx`
- Test: `lib/emails/BrandedEmailLayout.test.tsx`

**Interfaces:**
- Produces: `BrandedEmailLayout` — a React component, `{ children: React.ReactNode; previewText: string }` props, rendering the shared header (text-based wordmark, no image — see rationale below), a content area for `children`, and a footer (company name, phone, address, pulled from a `SiteInfoFooterProps` shape passed in by the caller, not fetched internally — keeps this a pure presentational component with no data-fetching side effects, so any future email template can reuse it without also depending on `getSiteInfo()`).
- Produces: `EMAIL_BRAND` — exported `const` object: `{ gold: "#F2A900", ink: "#1A1A1A", paper: "#FAFAF8", paperMuted: "#EFEDE6", border: "#DDD9CE" }`. Every other email template in this plan imports colors from here, not by re-typing hex values, so a future rebrand touches one file.
- Produces: `FooterInfo` — **exported** type, `{ companyName: string; phone: string; addressFull: string }`. Tasks 10 and 11 both import this rather than re-declaring the same shape inline — one source of truth for the footer contract, so a future field addition (e.g. a website URL) can't silently drift out of sync between templates.
- Consumes: nothing from earlier tasks (first template file created).

Design rationale to follow exactly (don't improvise a different visual approach):
- **No logo image.** The site's actual logo is three layered SVGs (`public/images/logo-mark-*.svg`) composited with CSS — none of that renders in email. Rather than exporting/hosting a new PNG just for this, replicate the *wordmark* as styled text: `ANTIBROADCASTING.` in a bold, uppercase, letter-spaced system sans-serif, with the trailing period colored gold — this is the same idiom `Footer.tsx` already uses on the live site (`text-gold` period), just implemented in email-safe inline styles instead of Tailwind classes. This also matches the "avoid unnecessary images" deliverability guidance found during this plan's research — images are blocked by default in most clients (Outlook, Gmail) until the user clicks "show images," so a text-based header renders correctly for 100% of recipients immediately, an image-based one doesn't. This wordmark stays a styled `Text`, not a `Heading` — it's a decorative logotype, not document content, the same call this repo already made for the live site's footer wordmark.
- **Font stack:** `'Helvetica Neue', Helvetica, Arial, sans-serif` everywhere — no custom `@font-face`, for the reason in Global Constraints.
- **Layout primitives:** use `@react-email/components`'s `Html`, `Head`, `Preview`, `Body`, `Container`, `Section`, `Row`, `Column`, `Text`, `Hr` — not raw `<div>`/flexbox/grid. These render to table-based HTML under the hood, which is what actually survives Outlook's rendering engine; flexbox/grid CSS silently fails there. **Use `Heading`, not styled `Text`, for any actual section title** (Tasks 10 and 11 both have one — "New Quote Request" / "Request Received") — a screen reader navigating an email by heading structure gets nothing from a `<p>` styled to look like a heading. `BrandedEmailLayout` itself doesn't render one (its only text is the decorative wordmark and footer) — Tasks 10 and 11 import `Heading` directly in their own files where it's actually used.

- [ ] **Step 1: Write the failing test.**

  ```tsx
  // lib/emails/BrandedEmailLayout.test.tsx
  import { describe, expect, it } from "vitest";
  import { render } from "@react-email/components";
  import { BrandedEmailLayout, EMAIL_BRAND } from "./BrandedEmailLayout";

  describe("BrandedEmailLayout", () => {
    it("renders the wordmark, preview text, and footer contact info", async () => {
      const html = await render(
        <BrandedEmailLayout
          previewText="Test preview text"
          footer={{
            companyName: "Antibroadcasting Screen Printing",
            phone: "612.836.9488",
            addressFull: "3715 Oregon Ave S #5, Minneapolis, MN 55426",
          }}
        >
          <p>Body content</p>
        </BrandedEmailLayout>,
      );

      expect(html).toContain("ANTIBROADCASTING");
      expect(html).toContain("Test preview text");
      expect(html).toContain("Antibroadcasting Screen Printing");
      expect(html).toContain("612.836.9488");
      expect(html).toContain(EMAIL_BRAND.gold);
    });
  });
  ```

- [ ] **Step 2: Run it to confirm it fails** (the module doesn't exist yet):

  ```bash
  pnpm test -- lib/emails/BrandedEmailLayout.test.tsx
  ```

  Expected: FAIL — `Cannot find module './BrandedEmailLayout'`.

- [ ] **Step 3: Write the implementation.**

  ```tsx
  // lib/emails/BrandedEmailLayout.tsx
  import {
    Body,
    Container,
    Head,
    Hr,
    Html,
    Preview,
    Section,
    Text,
  } from "@react-email/components";
  import type { ReactNode } from "react";

  export const EMAIL_BRAND = {
    gold: "#F2A900",
    ink: "#1A1A1A",
    paper: "#FAFAF8",
    paperMuted: "#EFEDE6",
    border: "#DDD9CE",
  } as const;

  const FONT_STACK = "'Helvetica Neue', Helvetica, Arial, sans-serif";

  export type FooterInfo = {
    companyName: string;
    phone: string;
    addressFull: string;
  };

  type BrandedEmailLayoutProps = {
    previewText: string;
    footer: FooterInfo;
    children: ReactNode;
  };

  export function BrandedEmailLayout({
    previewText,
    footer,
    children,
  }: BrandedEmailLayoutProps) {
    return (
      <Html>
        <Head />
        <Preview>{previewText}</Preview>
        <Body
          style={{
            backgroundColor: EMAIL_BRAND.paperMuted,
            fontFamily: FONT_STACK,
            margin: 0,
            padding: "32px 0",
          }}
        >
          <Container
            style={{
              backgroundColor: EMAIL_BRAND.paper,
              maxWidth: "480px",
              margin: "0 auto",
              border: `1px solid ${EMAIL_BRAND.border}`,
            }}
          >
            <Section style={{ padding: "32px 32px 24px" }}>
              <Text
                style={{
                  fontFamily: FONT_STACK,
                  fontWeight: 800,
                  fontSize: "20px",
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  color: EMAIL_BRAND.ink,
                  margin: 0,
                }}
              >
                ANTIBROADCASTING
                <span style={{ color: EMAIL_BRAND.gold }}>.</span>
              </Text>
            </Section>
            <Hr style={{ borderColor: EMAIL_BRAND.border, margin: 0 }} />
            <Section style={{ padding: "24px 32px" }}>{children}</Section>
            <Hr style={{ borderColor: EMAIL_BRAND.border, margin: 0 }} />
            <Section style={{ padding: "20px 32px" }}>
              <Text
                style={{
                  fontFamily: FONT_STACK,
                  fontSize: "12px",
                  color: EMAIL_BRAND.ink,
                  margin: "0 0 4px",
                }}
              >
                {footer.companyName}
              </Text>
              <Text
                style={{
                  fontFamily: FONT_STACK,
                  fontSize: "12px",
                  color: EMAIL_BRAND.ink,
                  margin: 0,
                }}
              >
                {footer.phone} · {footer.addressFull}
              </Text>
            </Section>
          </Container>
        </Body>
      </Html>
    );
  }
  ```

- [ ] **Step 4: Run the test again to confirm it passes:**

  ```bash
  pnpm test -- lib/emails/BrandedEmailLayout.test.tsx
  ```

  Expected: PASS.

- [ ] **Step 5: Visually sanity-check it** (optional but recommended before moving on, since a passing string-match test doesn't prove the layout *looks* right):

  ```bash
  pnpm email:dev
  ```

  Open the local preview URL it prints and confirm the header/footer render as expected. This step needs a `.tsx` file that uses the layout to actually preview something — Task 10 provides the first one, so this visual check is easiest to do retroactively once Task 10 is done, not blocking here.

- [ ] **Step 6: Full verification pass.**

  ```bash
  pnpm exec tsc --noEmit && pnpm lint && pnpm test
  ```

  Expected: all exit 0.

- [ ] **Step 7: Commit.**

  ```bash
  git add lib/emails/BrandedEmailLayout.tsx lib/emails/BrandedEmailLayout.test.tsx
  git commit -m "feat: add shared branded email layout for transactional templates"
  ```

### Task 10: Rebuild the internal quote-notification email on the shared layout

**Files:**
- Create: `lib/emails/QuoteNotificationEmail.tsx`
- Test: `lib/emails/QuoteNotificationEmail.test.tsx`
- Modify: `app/api/send/route.ts:123-145` (the `resend.emails.send({...})` call — replace the inline `text:` template string with the rendered component)
- Modify: `app/api/send/route.test.ts` (existing assertions reference the old plain-text shape indirectly; add coverage for the new HTML body)

**Interfaces:**
- Consumes: `BrandedEmailLayout`, `EMAIL_BRAND` from `lib/emails/BrandedEmailLayout.tsx` (Task 9).
- Produces: `QuoteNotificationEmail` — React component, props `{ name: string; email: string; quantity?: number | null; colors?: number | null; garment?: string | null; timeline?: string | null; message: string; footer: FooterInfo }` (`FooterInfo` imported from Task 9's `BrandedEmailLayout.tsx`, not re-declared — see that task's Interfaces note).
- Produces: `renderQuoteNotificationEmail(props)` — async helper, returns `{ html: string; text: string }` using `@react-email/components`'s `render()` twice (once `{ plainText: false }`, once `{ plainText: true }`) — `route.ts` passes both to Resend's `html`/`text` fields (sending both is standard practice: `text` is the fallback for clients that don't render HTML, and improves spam-filter scoring versus HTML-only mail).

- [ ] **Step 1: Write the failing test for the template.**

  ```tsx
  // lib/emails/QuoteNotificationEmail.test.tsx
  import { describe, expect, it } from "vitest";
  import { renderQuoteNotificationEmail } from "./QuoteNotificationEmail";

  const baseProps = {
    name: "Test User",
    email: "test@example.com",
    quantity: 50,
    colors: 2,
    garment: "T-Shirt",
    timeline: "Standard (7–10 business days)",
    message: "Hi, please quote this job.",
    footer: {
      companyName: "Antibroadcasting Screen Printing",
      phone: "612.836.9488",
      addressFull: "3715 Oregon Ave S #5, Minneapolis, MN 55426",
    },
  };

  describe("renderQuoteNotificationEmail", () => {
    it("includes the customer's details in both the html and text output", async () => {
      const { html, text } = await renderQuoteNotificationEmail(baseProps);

      for (const output of [html, text]) {
        expect(output).toContain("Test User");
        expect(output).toContain("test@example.com");
        expect(output).toContain("50");
        expect(output).toContain("T-Shirt");
        expect(output).toContain("Hi, please quote this job.");
      }
    });

    it("falls back to 'Not specified' for missing optional fields", async () => {
      const { text } = await renderQuoteNotificationEmail({
        ...baseProps,
        quantity: null,
        colors: null,
        garment: null,
        timeline: null,
      });

      expect(text).toContain("Not specified");
    });
  });
  ```

- [ ] **Step 2: Run it to confirm it fails:**

  ```bash
  pnpm test -- lib/emails/QuoteNotificationEmail.test.tsx
  ```

  Expected: FAIL — module doesn't exist.

- [ ] **Step 3: Write the implementation.**

  ```tsx
  // lib/emails/QuoteNotificationEmail.tsx
  import { render, Heading, Text } from "@react-email/components";
  import { BrandedEmailLayout, EMAIL_BRAND, type FooterInfo } from "./BrandedEmailLayout";

  type QuoteNotificationEmailProps = {
    name: string;
    email: string;
    quantity?: number | null;
    colors?: number | null;
    garment?: string | null;
    timeline?: string | null;
    message: string;
    footer: FooterInfo;
  };

  const fieldStyle = { fontSize: "14px", color: EMAIL_BRAND.ink, margin: "0 0 4px" };
  const labelStyle = { fontWeight: 700 };

  export function QuoteNotificationEmail({
    name,
    email,
    quantity,
    colors,
    garment,
    timeline,
    message,
    footer,
  }: QuoteNotificationEmailProps) {
    return (
      <BrandedEmailLayout
        previewText={`New quote request from ${name}`}
        footer={footer}
      >
        <Heading as="h1" style={{ fontSize: "16px", fontWeight: 700, color: EMAIL_BRAND.ink, margin: "0 0 16px" }}>
          New Quote Request
        </Heading>
        <Text style={fieldStyle}><span style={labelStyle}>Name:</span> {name}</Text>
        <Text style={fieldStyle}><span style={labelStyle}>Email:</span> {email}</Text>
        <Text style={fieldStyle}><span style={labelStyle}>Quantity:</span> {quantity ?? "Not specified"}</Text>
        <Text style={fieldStyle}><span style={labelStyle}>Colors:</span> {colors ?? "Not specified"}</Text>
        <Text style={fieldStyle}><span style={labelStyle}>Garment:</span> {garment ?? "Not specified"}</Text>
        <Text style={{ ...fieldStyle, margin: "0 0 16px" }}>
          <span style={labelStyle}>Timeline:</span> {timeline ?? "Not specified"}
        </Text>
        <Text style={{ fontSize: "14px", color: EMAIL_BRAND.ink, whiteSpace: "pre-wrap" }}>
          {message}
        </Text>
      </BrandedEmailLayout>
    );
  }

  export async function renderQuoteNotificationEmail(
    props: QuoteNotificationEmailProps,
  ): Promise<{ html: string; text: string }> {
    const element = <QuoteNotificationEmail {...props} />;
    const [html, text] = await Promise.all([
      render(element),
      render(element, { plainText: true }),
    ]);
    return { html, text };
  }
  ```

- [ ] **Step 4: Run the test again to confirm it passes:**

  ```bash
  pnpm test -- lib/emails/QuoteNotificationEmail.test.tsx
  ```

  Expected: PASS.

- [ ] **Step 5: Wire it into `route.ts`.** Replace the current inline-text send (`app/api/send/route.ts:123-145`):

  ```ts
  const siteInfo = await getSiteInfo();
  const resend = new Resend(process.env.RESEND_API_KEY);
  const { data, error } = await resend.emails.send({
    from: siteInfo.forms.quote.emailFrom,
    to: siteInfo.forms.quote.emailTo
      .split(",")
      .map((e) => e.trim())
      .filter(Boolean),
    replyTo: email,
    subject: `New Quote Request from ${name}`,
    text: `
  Name: ${name}
  Email: ${email}
  Quantity: ${quantity ?? "Not specified"}
  Colors: ${colors ?? "Not specified"}
  Garment: ${garment ?? "Not specified"}
  Timeline: ${timeline ?? "Not specified"}

  Message:
  ${message}
        `.trim(),
    attachments,
  });
  ```

  with:

  ```ts
  const siteInfo = await getSiteInfo();
  const resend = new Resend(process.env.RESEND_API_KEY);
  const footer = {
    companyName: siteInfo.company.name,
    phone: siteInfo.contact.phone,
    addressFull: siteInfo.contact.address.full,
  };
  const notification = await renderQuoteNotificationEmail({
    name,
    email,
    quantity,
    colors,
    garment,
    timeline,
    message,
    footer,
  });
  const { data, error } = await resend.emails.send({
    from: siteInfo.forms.quote.emailFrom,
    to: siteInfo.forms.quote.emailTo
      .split(",")
      .map((e) => e.trim())
      .filter(Boolean),
    replyTo: email,
    subject: `New Quote Request from ${name}`,
    html: notification.html,
    text: notification.text,
    attachments,
  });
  ```

  Add the import at the top of `route.ts`:

  ```ts
  import { renderQuoteNotificationEmail } from "@/lib/emails/QuoteNotificationEmail";
  ```

- [ ] **Step 6: Update the existing route test** — `app/api/send/route.test.ts`'s first test currently only checks `res.status` and that `sendMock` was called once; it doesn't assert on body shape, so it keeps passing unchanged. Add one new assertion confirming the html/text swap actually happened:

  ```ts
  it("sends a branded HTML notification with a plain-text fallback", async () => {
    sendMock.mockResolvedValueOnce({ data: { id: "abc" }, error: null });

    await POST(makeRequest(validPayload, "8.8.8.8"));

    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({
        html: expect.stringContaining("Test User"),
        text: expect.stringContaining("Test User"),
      }),
    );
  });
  ```

  Add this as a new `it(...)` block inside the existing `describe("POST /api/send", ...)` in `app/api/send/route.test.ts`, after the first test.

- [ ] **Step 7: Run the full test suite:**

  ```bash
  pnpm test
  ```

  Expected: all tests pass, including the new one and every pre-existing one in `route.test.ts`.

- [ ] **Step 8: Full verification pass.**

  ```bash
  pnpm exec tsc --noEmit && pnpm lint && pnpm build && pnpm test
  ```

  Expected: all exit 0.

- [ ] **Step 9: Commit.**

  ```bash
  git add lib/emails/QuoteNotificationEmail.tsx lib/emails/QuoteNotificationEmail.test.tsx app/api/send/route.ts app/api/send/route.test.ts
  git commit -m "feat: render the internal quote notification with the branded template"
  ```

### Task 11: Add the customer-facing quote confirmation email (the missing piece)

This is the concrete gap: today, submitting the quote form sends exactly one email, to the business, with the customer's address only in `replyTo`. The customer gets a success message in the browser and then silence in their inbox until a human replies. This task adds the second half.

**Files:**
- Create: `lib/emails/QuoteConfirmationEmail.tsx`
- Test: `lib/emails/QuoteConfirmationEmail.test.tsx`
- Modify: `app/api/send/route.ts` (add a second, independent `resend.emails.send()` call)
- Modify: `app/api/send/route.test.ts`

**Interfaces:**
- Consumes: `BrandedEmailLayout`, `EMAIL_BRAND` (Task 9).
- Produces: `QuoteConfirmationEmail` — component, props `{ name: string; responseTime: string; footer: FooterInfo }` (`FooterInfo` imported from Task 9, same as Task 10 — not re-declared).
- Produces: `renderQuoteConfirmationEmail(props)` — same `{ html, text }` shape as Task 10's helper.

Design decisions (state these in the commit body, not just this plan):
- **The confirmation send must never fail the customer's form submission.** The business notification (Task 10) is the critical path — that's what actually gets the lead to Jim/Chris. The confirmation email is a UX nicety on top. If Resend is having a bad moment and the confirmation send throws or returns an error, log it server-side and continue — do not change the HTTP response the customer already sees.
- **The confirmation is only attempted after the business notification succeeds — this is deliberate, not incidental serialization.** If the business notification fails, the shop never actually saw the lead; sending the customer a "we got your request" confirmation in that case would tell them help is coming when it isn't — a worse outcome than sending nothing. Don't parallelize the two sends (e.g. with `Promise.allSettled`) to shave latency — that would reintroduce this false-confirmation case. The added latency is one extra sequential Resend round-trip on the happy path, which is an acceptable, deliberate trade for correctness here.
- **Two sequential single sends, not Resend's batch API.** Batch sending doesn't support attachments and the business notification needs them, so unifying both sends into one batch call isn't an option; two independent calls is simpler than working around that.

- [ ] **Step 1: Write the failing test for the template.**

  ```tsx
  // lib/emails/QuoteConfirmationEmail.test.tsx
  import { describe, expect, it } from "vitest";
  import { renderQuoteConfirmationEmail } from "./QuoteConfirmationEmail";

  describe("renderQuoteConfirmationEmail", () => {
    it("greets the customer by name and states the response time", async () => {
      const { html, text } = await renderQuoteConfirmationEmail({
        name: "Test User",
        responseTime: "1–2 business days",
        footer: {
          companyName: "Antibroadcasting Screen Printing",
          phone: "612.836.9488",
          addressFull: "3715 Oregon Ave S #5, Minneapolis, MN 55426",
        },
      });

      for (const output of [html, text]) {
        expect(output).toContain("Test User");
        expect(output).toContain("1–2 business days");
      }
    });
  });
  ```

- [ ] **Step 2: Run it to confirm it fails:**

  ```bash
  pnpm test -- lib/emails/QuoteConfirmationEmail.test.tsx
  ```

  Expected: FAIL — module doesn't exist.

- [ ] **Step 3: Write the implementation.**

  ```tsx
  // lib/emails/QuoteConfirmationEmail.tsx
  import { render, Heading, Text } from "@react-email/components";
  import { BrandedEmailLayout, EMAIL_BRAND, type FooterInfo } from "./BrandedEmailLayout";

  type QuoteConfirmationEmailProps = {
    name: string;
    responseTime: string;
    footer: FooterInfo;
  };

  export function QuoteConfirmationEmail({
    name,
    responseTime,
    footer,
  }: QuoteConfirmationEmailProps) {
    return (
      <BrandedEmailLayout
        previewText={`We received your quote request, ${name}`}
        footer={footer}
      >
        <Heading as="h1" style={{ fontSize: "16px", fontWeight: 700, color: EMAIL_BRAND.ink, margin: "0 0 16px" }}>
          Request Received
        </Heading>
        <Text style={{ fontSize: "14px", color: EMAIL_BRAND.ink, margin: "0 0 12px" }}>
          Hi {name},
        </Text>
        <Text style={{ fontSize: "14px", color: EMAIL_BRAND.ink, margin: "0 0 12px" }}>
          Thanks for reaching out to {footer.companyName}. We've got your quote
          request and will get back to you within {responseTime}.
        </Text>
        <Text style={{ fontSize: "14px", color: EMAIL_BRAND.ink }}>
          If anything about your project changes in the meantime, just reply to
          this email.
        </Text>
      </BrandedEmailLayout>
    );
  }

  export async function renderQuoteConfirmationEmail(
    props: QuoteConfirmationEmailProps,
  ): Promise<{ html: string; text: string }> {
    const element = <QuoteConfirmationEmail {...props} />;
    const [html, text] = await Promise.all([
      render(element),
      render(element, { plainText: true }),
    ]);
    return { html, text };
  }
  ```

- [ ] **Step 4: Run the test again to confirm it passes:**

  ```bash
  pnpm test -- lib/emails/QuoteConfirmationEmail.test.tsx
  ```

  Expected: PASS.

- [ ] **Step 5: Write the failing route-level test first**, before wiring the second send into `route.ts` — add to `app/api/send/route.test.ts`:

  ```ts
  it("also sends a confirmation email to the customer", async () => {
    sendMock.mockResolvedValue({ data: { id: "abc" }, error: null });

    await POST(makeRequest(validPayload, "9.9.9.9"));

    expect(sendMock).toHaveBeenCalledTimes(2);
    const confirmationCall = sendMock.mock.calls.find(
      (call) => call[0].to === validPayload.email,
    );
    expect(confirmationCall).toBeDefined();
    expect(confirmationCall![0]).toMatchObject({
      to: validPayload.email,
      html: expect.stringContaining("Test User"),
    });
  });

  it("still returns 200 to the customer even if the confirmation email fails to send", async () => {
    sendMock
      .mockResolvedValueOnce({ data: { id: "abc" }, error: null }) // business notification
      .mockResolvedValueOnce({ data: null, error: { message: "boom" } }); // confirmation

    const res = await POST(makeRequest(validPayload, "10.10.10.10"));

    expect(res.status).toBe(200);
    expect(sendMock).toHaveBeenCalledTimes(2);
  });

  it("does not attempt the confirmation email if the business notification fails", async () => {
    sendMock.mockResolvedValueOnce({ data: null, error: { message: "boom" } });

    const res = await POST(makeRequest(validPayload, "11.11.11.11"));

    expect(res.status).toBe(500);
    expect(sendMock).toHaveBeenCalledTimes(1);
  });
  ```

  This third test is the one that actually proves the gate from this task's "Design decisions" holds — without it, nothing stops a future edit from parallelizing the two sends (e.g. with `Promise.allSettled`) and silently reintroducing the false-confirmation case, since the other two tests would still pass either way.

- [ ] **Step 6: Run the route tests to confirm the new ones fail** (the second send doesn't exist yet):

  ```bash
  pnpm test -- app/api/send/route.test.ts
  ```

  Expected: the three new tests FAIL (the first two because `sendMock` is only ever called once right now; the third because there's no 500-vs-200 distinction to check against yet — confirm it fails for the right reason, not a typo), all pre-existing tests still PASS.

- [ ] **Step 7: Wire the second send into `route.ts`.** After the existing business-notification send-and-error-check block (the one Task 10 modified), add:

  ```ts
  // Best-effort customer confirmation — never fails the customer's submission.
  try {
    const confirmation = await renderQuoteConfirmationEmail({
      name,
      responseTime: siteInfo.forms.quote.responseTime,
      footer,
    });
    const { error: confirmationError } = await resend.emails.send({
      from: siteInfo.forms.quote.emailFrom,
      to: email,
      subject: "We received your quote request",
      html: confirmation.html,
      text: confirmation.text,
    });
    if (confirmationError) {
      console.error("Quote confirmation send failed:", confirmationError);
    }
  } catch (confirmationSendError) {
    console.error("Quote confirmation send threw:", confirmationSendError);
  }
  ```

  Placed after the existing `if (error) { ... return ...500 }` block for the business notification, so a business-notification failure still returns the existing 500 (unchanged behavior) and only a *successful* business send proceeds to attempt the confirmation. Add the import:

  ```ts
  import { renderQuoteConfirmationEmail } from "@/lib/emails/QuoteConfirmationEmail";
  ```

- [ ] **Step 8: Run the route tests again to confirm they pass:**

  ```bash
  pnpm test -- app/api/send/route.test.ts
  ```

  Expected: all PASS, including the two new ones.

- [ ] **Step 9: Full verification pass.**

  ```bash
  pnpm exec tsc --noEmit && pnpm lint && pnpm build && pnpm test
  ```

  Expected: all exit 0.

- [ ] **Step 10: Commit.**

  ```bash
  git add lib/emails/QuoteConfirmationEmail.tsx lib/emails/QuoteConfirmationEmail.test.tsx app/api/send/route.ts app/api/send/route.test.ts
  git commit -m "feat: send a branded confirmation email to the customer on quote submission"
  ```

### Task 12: Move the automated sender identity onto the isolated subdomain

**Files:**
- Modify: `content/site-info.json`

**Interfaces:**
- Consumes: nothing code-level — this is a content-only change (Global Constraints: editorial content lives in `content/site-info.json`, not hardcoded).
- No new interface produced — `lib/get-site-info.ts:66` already reads this field as `raw.emailFrom`; no code change needed there.

**Depends on:** Task 7 (the subdomain must be verified in Resend before mail sent from it will actually deliver — do this task last in Phase 2, right before Phase 3's cutover, so there's no window where the app is configured to send from an address that doesn't authenticate yet).

- [ ] **Step 1:** Open `content/site-info.json` and change:

  ```json
  "emailFrom": "Quote Request <quotes@antibroadcasting.com>",
  ```

  to:

  ```json
  "emailFrom": "Antibroadcasting Quotes <quotes@send.antibroadcasting.com>",
  ```

  The display name (`Antibroadcasting Quotes`) is what most recipients actually read in their inbox — the domain change to `send.antibroadcasting.com` is invisible to a casual glance but is what makes the DNS isolation in Task 7 real. Note this also changes the display name from "Quote Request" to "Antibroadcasting Quotes" for consistency with the business's actual name, since the old value predates this plan and wasn't deliberately chosen — confirm this wording with Chris before merging if he has a preference.

- [ ] **Step 2: Verify no other code references the old literal value** (should be none — `get-site-info.ts` reads the field name, not the value):

  ```bash
  grep -rn "quotes@antibroadcasting.com" --include="*.ts" --include="*.tsx" --include="*.json" . | grep -v node_modules | grep -v .next
  ```

  Expected: no output (or only this same line in `content/site-info.json`, now updated).

- [ ] **Step 3: Full verification pass.**

  ```bash
  pnpm exec tsc --noEmit && pnpm lint && pnpm build && pnpm test
  ```

  Expected: all exit 0 (this is a JSON content change — nothing here should be able to fail typecheck, but `pnpm build` does exercise Keystatic's read of this file, which is the real check that the JSON is still well-formed).

- [ ] **Step 4: Commit.**

  ```bash
  git add content/site-info.json
  git commit -m "feat: move the transactional sender identity to the isolated send subdomain"
  ```

---

## Phase 3: Verification & Cutover

### Task 13: Full deliverability check before going live

**Type:** Ops + manual verification. Do this after Phase 1 and Phase 2 are both merged, before setting real `RESEND_API_KEY` in production.

- [ ] **Step 1: Re-verify every DNS record end-to-end**, now that both Zoho (root) and Resend (subdomain) are configured:

  ```bash
  echo "--- root domain (Zoho) ---"
  dig MX antibroadcasting.com +short
  dig TXT antibroadcasting.com +short
  echo "--- send subdomain (Resend) ---"
  dig MX send.antibroadcasting.com +short
  dig TXT send.antibroadcasting.com +short
  dig TXT resend._domainkey.send.antibroadcasting.com +short
  echo "--- DMARC ---"
  dig TXT _dmarc.antibroadcasting.com +short
  ```

  Confirm every record from Tasks 4, 5, and 7 is present and correct.

- [ ] **Step 2:** Set real `RESEND_API_KEY` in Vercel's project environment variables (Production **and** Preview, so PR previews can also send real test mail if needed) — `.env.local` never ships, this must be set in Vercel directly per the existing launch checklist in `plans/README.md`.

- [ ] **Step 3: Send a real test submission** through the live `/contact` form (or a preview deployment) with a real email address you control as the "customer." Confirm:
  - The business notification arrives at `info@antibroadcasting.com` (Zoho), rendered with the branded layout, correct fields.
  - The confirmation email arrives at the test customer address, rendered with the branded layout, correct name and response time.
  - Both emails' "From" shows `Antibroadcasting Quotes <quotes@send.antibroadcasting.com>`.

- [ ] **Step 4: Run a spam/deliverability score check.** Send the same test submission's resulting confirmation email to a mail-tester.com address (generate one at mail-tester.com, use that as the "customer" email for one test submission) and check the score. Investigate and fix anything below a 9/10 before calling this done — mail-tester flags missing/misaligned SPF, DKIM, DMARC, and common spam-trigger content issues directly.

- [ ] **Step 5: Sign up for Google Postmaster Tools** (postmaster.google.com) for `antibroadcasting.com` — free, gives ongoing visibility into how Gmail (a huge share of both the business's own mail and its customers' mail) sees this domain's reputation over time. Ops step, no DNS change beyond a verification TXT record Google's dashboard will provide (add it the same way as Tasks 3 and 7).

**Done when:** all DNS resolves correctly, a real end-to-end test submission produces both correctly-branded emails, and the mail-tester score is 9+/10.

### Task 14: Tighten DMARC enforcement

**Type:** Ops. Do this 1–2 weeks after Task 13, once DMARC aggregate reports (arriving at `info@antibroadcasting.com` per Task 5) show clean alignment from both Zoho and Resend with no unexpected failures.

- [ ] **Step 1:** Review the aggregate reports (they arrive as XML attachments — a free tool like dmarcian's report viewer or similar can parse them, or eyeball the raw XML for `<policy_evaluated>` blocks showing `pass` for both `spf` and `dkim` on all legitimate sending sources).
- [ ] **Step 2:** Update the `_dmarc.antibroadcasting.com` TXT record from `p=none` to `p=quarantine`.
- [ ] **Step 3:** Monitor another 1–2 weeks, then move to `p=reject` if reports stay clean.

**Done when:** DMARC is at `p=reject` with clean reports. No commit — DNS-only change.

---

## Appendix: What this plan does not build (and why)

Keeping scope to what's actually needed now, not speculative future features:

- **No CRM/ticketing system for `info@`/`quotes@` correspondence.** Jim and Chris reading and replying to real human email in Zoho's webmail is the entire "system" for two-way correspondence at this business's current size. A shared-inbox tool (Front, Help Scout, etc.) is real money and real complexity for a two-person team — revisit only if reply volume becomes a coordination problem.
- **No additional transactional email types beyond the confirmation added in Task 11** (e.g., "art proof ready," "order shipped," payment reminders). The user's brief named the quote-confirmation gap specifically as the concrete missing piece; the codebase has exactly one form and one business process (quote requests) today. Building notification types for processes that don't exist yet in the code (there's no order-status system, no proofing workflow) would be speculative — the `BrandedEmailLayout` component built in Task 9 is exactly the reusable foundation a future template would need, so adding the next one later is cheap once there's a real trigger for it.
- **No third-party signature management tool** (Exclaimer, WiseStamp, etc.) — two people, manually configured signatures in Zoho's native settings, is proportionate. Revisit only if headcount grows enough that manually updating N signatures by hand becomes real overhead.
- **No move away from Resend for transactional send.** Resend is already integrated, already has working DKIM/domain-verification support exactly matching this plan's subdomain-isolation design, and nothing in this research surfaced a reason to switch.

## Notes

*(Fill in as each ops task completes — this section intentionally starts empty; it's the running record of decisions made while executing this plan, not something to pre-fill with assumptions.)*

- DNS host for `antibroadcasting.com` (Task 1): **Hostinger** (nameservers `ns1/ns2.dns-parking.com`, SOA `dns.hostinger.com` — confirmed via `dig NS` 2026-08-23). Root MX also currently points to Hostinger mail (`mx1/mx2.hostinger.com`) — this is the *legacy* site/mail setup being phased out, not a deliberate mailbox choice; site owner confirmed no mailboxes exist yet anywhere. DNS panel access is confirmed available (Hostinger admin).
- Mailbox provider decision (Task 2): _pending — Zoho Mail Free still recommended; Hostinger's own mail is being decommissioned, not a candidate_.
- `react-email` / `@react-email/components` resolved versions (Task 8): `react-email@6.9.2`, `@react-email/components@1.0.12`.
- Task 7 (Resend `send.antibroadcasting.com` subdomain): **confirmed live** via `dig` 2026-08-23 — MX/SPF resolve to Resend's `forge.rmta.net` infra, Resend dashboard shows domain verified + sending enabled. DKIM ended up published at the *root* domain (`resend._domainkey.antibroadcasting.com`), not under the subdomain as this plan guessed — that's fine (DKIM has no SPF-style one-record-per-hostname limit) and matches this task's own caveat to trust Resend's actual dashboard values over a guessed hostname.
- Root DMARC already exists (`v=DMARC1; p=none`) but without the `rua=` reporting address this plan's Task 5 recommends — worth adding once Phase 1 mailboxes exist to receive reports.
- Phase 2 (Tasks 8-12): merged to `main` and pushed 2026-08-23.

## Sources

Pricing and best-practice claims in this plan were checked against current (August 2026) sources, not assumed from training data:

- [Google Workspace Business Starter USA Price 2026](https://leadsmonky.com/google-workspace-business-starter-usa-price-2026/)
- [Compare Flexible Pricing Plan Options | Google Workspace](https://workspace.google.com/pricing)
- [Microsoft 365 Price Increase 2026](https://www.stmicro.net/blog/microsoft-365-price-increase-2026/)
- [Is Zoho Email Still Free in 2026?](https://codroiditlabs.com/is-zoho-email-still-free-guide/)
- [Zoho Mail Pricing 2026 | Capterra](https://www.capterra.com/p/174694/Zoho-Mail/pricing/)
- [Zoho Mail Rates, Limits, and Policies](https://www.zoho.com/mail/help/adminconsole/rates-and-limits.html)
- [Zoho Mail Free Plan Limitations (2026)](https://mail.mailbux.com/blog/email-comparisons/zoho-mail-free-plan-limitations-alternative)
- [Migadu vs Greatmail](https://www.greatmail.com/blog/email-hosting/deciding-on-the-perfect-email-hosting-provider-migadu-vs-greatmail/)
- [Migadu Webmail: Pricing, Plans, Set-up & Alternatives](https://www.neo.space/blog/migadu-webmail)
- [Purelymail Pricing](https://purelymail.com/pricing)
- [Cloudflare Email Service Limits](https://developers.cloudflare.com/email-service/platform/limits/)
- [Cloudflare Email Service Pricing](https://developers.cloudflare.com/email-service/platform/pricing/)
- [Fastmail Pricing (US)](https://www.fastmail.com/pricing/us/)
- [Custom domains with Fastmail](https://www.fastmail.help/hc/en-us/articles/360058753394-Custom-domains-with-Fastmail)
- [SPF, DKIM, DMARC for Multiple Sending Services: The Architecture Guide](https://mailflowauthority.com/email-authentication/spf-dkim-dmarc-multiple-senders?utm=pendiumai)
- [Should I use separate subdomains for marketing and transactional emails? — Suped](https://www.suped.com/learn/email-deliverability/should-i-use-separate-subdomains-for-marketing-and-transactional-emails)
- [How do I set up a custom sending domain in Resend (SPF, DKIM, DMARC)?](https://codeables.dev/article/how-do-i-set-up-a-custom-sending-domain-in-resend-spf-dkim-dmarc-step)
- [SPF, DKIM, DMARC Configuration for Resend | DmarcDkim.com](https://dmarcdkim.com/setup/how-to-setup-resend-spf-dkim-and-dmarc-records)
- [Send Batch Emails — Resend API Reference](https://resend.com/docs/api-reference/emails/send-batch-emails)
- [Introducing the Batch Emails API — Resend](https://resend.com/blog/introducing-the-batch-emails-api)
- [React Email Templates 2026: Production Guide](https://ecosire.com/blog/react-email-templates-guide)
- [Send React Email with Resend in Next.js (Complete 2026 Guide)](https://reactemailtemplates.com/blog/send-react-email-with-resend)
- [2026 Bulk Email Sender Requirements Checklist](https://redsift.com/guides/bulk-email-sender-requirements)
- [Bulk Email Sender Rules For Google, Yahoo, Microsoft & Apple (2026)](https://powerdmarc.com/bulk-email-sender-requirements/)
