# Plan 018: Share one validation schema between QuoteForm and /api/send

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 240e4f8..HEAD -- components/ui/QuoteForm.tsx app/api/send/route.ts app/api/send/route.test.ts`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: none
- **Category**: tech-debt
- **Planned at**: commit `240e4f8`, 2026-08-07

## Why this matters

The quote-request form has two independently maintained sets of validation
rules for the same fields. `components/ui/QuoteForm.tsx` hand-rolls its own
`validate()` function (required-field checks + a hand-written email regex).
`app/api/send/route.ts` separately defines a fuller Zod schema (trimmed
length caps, `z.coerce.number().int().positive()` for quantity, a proper
`.email()` check). The two are not equivalent: the client accepts any
positive-looking quantity input and any string in `message`/`name` with no
length cap, while the server will 400 a request the client considered valid
(e.g. a `message` over 5000 characters, or a non-integer quantity) — the user
sees a generic "Something Went Wrong" with no indication which field was the
problem, because `handleSubmit`'s `catch` block doesn't parse the server's
`details` payload. This is the highest-traffic form on the site (the entire
quote-request flow depends on it), so drift between the two rule sets is a
direct source of confusing failed submissions. Extracting one shared Zod
schema for the form-field subset removes the duplication and closes the gap:
the client now enforces exactly what the server enforces, before the network
round-trip.

## Current state

- `app/api/send/route.ts:11-41` — the full server-side schema today:

```ts
const attachmentSchema = z.object({
  filename: z.string().trim().min(1).max(255),
  content: z.string().min(1),
  contentType: z.string().max(255).optional(),
});

const quoteRequestSchema = z
  .object({
    name: z.string().trim().min(1).max(200),
    email: z.string().trim().email().max(320),
    message: z.string().trim().min(1).max(5000),
    quantity: z.coerce.number().int().positive(),
    colors: z.string().trim().max(200).nullish(),
    garment: z.string().trim().max(200).nullish(),
    timeline: z.string().trim().max(200).nullish(),
    attachments: z.array(attachmentSchema).max(MAX_ATTACHMENTS).optional(),
    // Honeypot — must be empty; bots fill it, humans don't see it
    _hp: z.string().max(0, { message: "Bot detected" }).optional(),
    // Turnstile challenge token
    turnstileToken: z.string().optional(),
  })
  .refine(
    (data) => {
      const totalBytes = (data.attachments ?? []).reduce(
        (sum, a) => sum + a.content.length * 0.75,
        0,
      );
      return totalBytes <= MAX_ATTACHMENT_TOTAL_BYTES;
    },
    { message: "Combined attachment size is too large", path: ["attachments"] },
  );
```

- `components/ui/QuoteForm.tsx:70-83` — the independent client-side
  validation it duplicates the intent of:

```ts
function validate(data: FormData) {
  const errs: Record<string, string> = {};
  if (!data.get("name")) errs.name = "Name is required.";
  if (!data.get("email")) {
    errs.email = "Email is required.";
  } else if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.get("email") as string)
  ) {
    errs.email = "Please enter a valid email address.";
  }
  if (!data.get("quantity")) errs.quantity = "Quantity is required.";
  if (!data.get("message")) errs.message = "Please describe your project.";
  return errs;
}
```

  It's called from `handleSubmit` at `components/ui/QuoteForm.tsx:89`
  (`const errs = validate(data);`) — that call site's signature (takes the
  submitted `FormData`, returns `Record<string, string>` keyed by field
  name) must not change, since the rest of `handleSubmit` and the JSX below
  it (`error={errors.name}`, `error={errors.email}`, etc., matching
  `components/ui/Input.tsx`'s `error?: string` prop) depend on that shape.

- `components/ui/Input.tsx:3-7` — the `error` prop convention every form
  field component in this repo follows (`InputProps` extends native props
  with `label?`, `error?: string`, `required?: boolean`); `Select` and
  `Textarea` follow the same pattern. The new client validation must keep
  producing a `Record<string, string>` compatible with this.

- `app/api/send/route.test.ts` — existing test conventions: Vitest, mocks
  `resend`, imports `POST` via dynamic `await import("./route")`, builds
  requests with a `makeRequest(body, ip)` helper. New tests for the shared
  schema should follow this file's style (see Test plan below) but live in
  their own file since they test a schema module, not the route handler.

- `zod` (`^4.4.3` per `package.json`) is currently only imported server-side
  (`app/api/send/route.ts`). This plan adds it to the client bundle via
  `components/ui/QuoteForm.tsx` — Zod v4's core validators are reasonably
  small and tree-shakeable; no bundle-size gate exists in this repo today; if
  the executor wants to sanity-check impact, `pnpm build` prints route
  bundle sizes.

## Commands you will need

| Purpose   | Command                | Expected on success |
|-----------|-------------------------|---------------------|
| Typecheck | `pnpm exec tsc --noEmit` | exit 0              |
| Lint      | `pnpm lint`              | exit 0              |
| Tests     | `pnpm test`              | all pass            |
| Build     | `pnpm build`             | exit 0              |

## Scope

**In scope**:
- `lib/quote-request-schema.ts` (new file — the shared field schema)
- `app/api/send/route.ts` (consume the shared schema instead of its own copy)
- `components/ui/QuoteForm.tsx` (consume the shared schema instead of the
  hand-rolled `validate()` body)
- `lib/quote-request-schema.test.ts` (new file — tests for the shared schema)

**Out of scope** (do NOT touch, even though they look related):
- The `attachmentSchema`, `MAX_ATTACHMENTS`, `MAX_ATTACHMENT_TOTAL_BYTES`,
  rate limiter, Turnstile verification, or honeypot logic in `route.ts` —
  all server-only concerns that must stay server-only. Only the plain
  form-field validators (`name`, `email`, `message`, `quantity`, `colors`,
  `garment`, `timeline`) move into the shared schema.
- `components/ui/QuoteForm.tsx`'s artwork-file-size check
  (`totalArtworkSize > MAX_ARTWORK_TOTAL_SIZE`, around line 102) — separate
  client-only pre-check ahead of upload, not part of the field schema.
- The Turnstile widget-render logic in the same file — unrelated to this
  plan (see plan 019 if that's also selected).
- `app/api/send/route.test.ts` — do not modify existing tests; only add the
  new schema test file.

## Git workflow

- Branch: `advisor/018-unify-quote-form-validation`
- Commit per step; conventional-commit style matching `git log` (e.g.
  `feat: validate quote request payload server-side`, commit `152b225`, is
  the closest precedent).
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Create the shared schema in `lib/quote-request-schema.ts`

```ts
import { z } from "zod";

export const quoteFormFieldsSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(200),
  email: z
    .string()
    .trim()
    .min(1, "Email is required.")
    .email("Please enter a valid email address.")
    .max(320),
  message: z
    .string()
    .trim()
    .min(1, "Please describe your project.")
    .max(5000),
  quantity: z.coerce.number().int().positive("Quantity is required."),
  colors: z.string().trim().max(200).nullish(),
  garment: z.string().trim().max(200).nullish(),
  timeline: z.string().trim().max(200).nullish(),
});
```

Notes for this step:
- The custom messages on `name`/`email`/`message`/`quantity` preserve the
  exact copy the client showed before this change.
- `quantity`'s empty-string case: an empty number input submits `""` via
  `FormData`; `z.coerce.number()` coerces `""` to `0` (not `NaN`), which then
  fails `.positive(...)`, surfacing "Quantity is required." — this
  reproduces the original "required" behavior via the positive check, it
  does not distinguish "empty" from "zero or negative" in the message. This
  is an accepted, intentional simplification — do not add a separate
  required-check to work around it.
- `colors`/`garment`/`timeline` keep the exact same shape as the current
  server schema (free-form trimmed strings, not coerced numbers) — this
  matches existing behavior (the `colors` field is a number `<input>` in the
  UI but was already validated as a string server-side); not a bug to fix
  here.

**Verify**: `pnpm exec tsc --noEmit` → exit 0.

### Step 2: Update `app/api/send/route.ts` to extend the shared schema

Replace the `name`/`email`/`message`/`quantity`/`colors`/`garment`/`timeline`
fields inside `quoteRequestSchema`'s `z.object({...})` with a `.extend()` on
the imported schema, keeping everything else (the `.refine()` call,
`attachmentSchema`, `_hp`, `turnstileToken`) exactly as-is:

```ts
import { quoteFormFieldsSchema } from "@/lib/quote-request-schema";

// ─── Validation ───────────────────────────────────────────────────────────────

const MAX_ATTACHMENTS = 5;
const MAX_ATTACHMENT_TOTAL_BYTES = 20 * 1024 * 1024; // combined, well under Resend's 40MB/email

const attachmentSchema = z.object({
  filename: z.string().trim().min(1).max(255),
  content: z.string().min(1),
  contentType: z.string().max(255).optional(),
});

const quoteRequestSchema = quoteFormFieldsSchema
  .extend({
    attachments: z.array(attachmentSchema).max(MAX_ATTACHMENTS).optional(),
    // Honeypot — must be empty; bots fill it, humans don't see it
    _hp: z.string().max(0, { message: "Bot detected" }).optional(),
    // Turnstile challenge token
    turnstileToken: z.string().optional(),
  })
  .refine(
    (data) => {
      const totalBytes = (data.attachments ?? []).reduce(
        (sum, a) => sum + a.content.length * 0.75,
        0,
      );
      return totalBytes <= MAX_ATTACHMENT_TOTAL_BYTES;
    },
    { message: "Combined attachment size is too large", path: ["attachments"] },
  );
```

The rest of `route.ts` (the handler, rate limiter, Turnstile verification)
is unchanged — `quoteRequestSchema.safeParse(...)` at line 105 still works
identically since the merged schema's shape is unchanged (same field names,
same effective validation, only the custom messages on 4 fields changed to
the strings from Step 1, and `.max(200)` now applies to `name` explicitly —
it was already there before).

**Verify**: `pnpm exec tsc --noEmit` → exit 0. Then `pnpm test -- route.test`
→ all existing tests in `app/api/send/route.test.ts` still pass unmodified
(they assert on status codes and the generic error-shape, not on exact
validation messages, so this should be a no-op for them — if any fail,
compare the failure against "STOP conditions" before changing test
expectations).

### Step 3: Replace `QuoteForm.tsx`'s hand-rolled `validate()` with the shared schema

Replace the function at `components/ui/QuoteForm.tsx:70-83` with:

```ts
import { quoteFormFieldsSchema } from "@/lib/quote-request-schema";

function validate(data: FormData) {
  const result = quoteFormFieldsSchema.safeParse({
    name: data.get("name"),
    email: data.get("email"),
    message: data.get("message"),
    quantity: data.get("quantity"),
    colors: data.get("colors"),
    garment: data.get("garment"),
    timeline: data.get("timeline"),
  });
  if (result.success) return {};

  const errs: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = String(issue.path[0]);
    if (!(key in errs)) errs[key] = issue.message;
  }
  return errs;
}
```

Do not change the call site at `components/ui/QuoteForm.tsx:89`
(`const errs = validate(data);`) or anything after it — the function's
signature (`(data: FormData) => Record<string, string>`) is identical to
before, so `handleSubmit`'s error-handling, focus-management, and the JSX
`error={errors.name}` etc. all keep working unchanged.

Remove the now-unused inline email regex — it no longer exists after this
replacement (confirm with `grep -n "test(data.get" components/ui/QuoteForm.tsx`
returning no matches).

**Verify**: `pnpm exec tsc --noEmit` → exit 0.

### Step 4: Add schema tests in `lib/quote-request-schema.test.ts`

Model this file's structure after `app/api/send/route.test.ts`'s `describe`/
`it` layout (already read during recon), but it needs no mocking — it's a
pure schema test:

```ts
import { describe, expect, it } from "vitest";
import { quoteFormFieldsSchema } from "./quote-request-schema";

const validFields = {
  name: "Test User",
  email: "test@example.com",
  message: "Hi, please quote this job.",
  quantity: "50",
  colors: "",
  garment: "",
  timeline: "",
};

describe("quoteFormFieldsSchema", () => {
  it("accepts a fully valid submission", () => {
    const result = quoteFormFieldsSchema.safeParse(validFields);
    expect(result.success).toBe(true);
  });

  it("rejects a missing name with the expected message", () => {
    const result = quoteFormFieldsSchema.safeParse({ ...validFields, name: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Name is required.");
    }
  });

  it("rejects an invalid email format", () => {
    const result = quoteFormFieldsSchema.safeParse({ ...validFields, email: "not-an-email" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Please enter a valid email address.");
    }
  });

  it("rejects a zero/empty quantity", () => {
    const result = quoteFormFieldsSchema.safeParse({ ...validFields, quantity: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Quantity is required.");
    }
  });

  it("rejects a message over the 5000-character cap", () => {
    const result = quoteFormFieldsSchema.safeParse({
      ...validFields,
      message: "a".repeat(5001),
    });
    expect(result.success).toBe(false);
  });

  it("allows colors/garment/timeline to be omitted", () => {
    const { colors, garment, timeline, ...rest } = validFields;
    const result = quoteFormFieldsSchema.safeParse(rest);
    expect(result.success).toBe(true);
  });
});
```

**Verify**: `pnpm test -- quote-request-schema` → all new tests pass.

### Step 5: Full verification pass

```bash
pnpm exec tsc --noEmit && pnpm lint && pnpm test && pnpm build
```

**Verify**: all four exit 0; `pnpm test` output shows the existing
`route.test.ts` suite plus the new `quote-request-schema.test.ts` suite, all
passing.

## Test plan

- New file `lib/quote-request-schema.test.ts` (Step 4) — covers: valid
  submission, missing name, invalid email, empty quantity, over-length
  message, optional fields omitted. This is the primary new coverage.
- Existing `app/api/send/route.test.ts` must continue passing unmodified —
  it's the regression check that the server behavior didn't change.
- Manual browser check (since this touches user-facing form UX): run
  `pnpm dev`, open `/contact`, submit the form with an empty Name field —
  confirm the same "Name is required." message appears in the same place as
  before; submit with an invalid email — confirm "Please enter a valid email
  address."; submit with quantity empty — confirm "Quantity is required."

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `pnpm exec tsc --noEmit` exits 0
- [ ] `pnpm lint` exits 0
- [ ] `pnpm test` exits 0, including the new `lib/quote-request-schema.test.ts` suite (6 new tests) and the unmodified `app/api/send/route.test.ts` suite
- [ ] `pnpm build` exits 0
- [ ] `grep -n "z\\.string().trim().email\\|^\/.*@.*\\\\." components/ui/QuoteForm.tsx` (the old hand-written regex) returns no matches
- [ ] `grep -rln "quoteFormFieldsSchema" lib/quote-request-schema.ts app/api/send/route.ts components/ui/QuoteForm.tsx` returns all three files
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The code in `route.ts` or `QuoteForm.tsx` no longer matches the "Current
  state" excerpts (schema fields, messages, or the `validate()` call site
  signature have changed since this plan was written).
- Any existing test in `app/api/send/route.test.ts` fails after Step 2 — the
  merged schema must be behaviorally identical to the original for that file
  to keep passing untouched; a failure means the `.extend()` didn't
  reproduce the original schema exactly.
- Zod v4's `.extend()` API doesn't accept a plain object the way this plan
  assumes (verify with the Step 1/2 typecheck) — if the installed Zod
  version's API differs, report the actual error instead of guessing at a
  workaround.

## Maintenance notes

- Any future change to a quote-form field's validation rule (new max
  length, new required field) now belongs in `lib/quote-request-schema.ts`
  — editing only `route.ts` or only `QuoteForm.tsx` for such a change is
  exactly the drift this plan removes; don't reintroduce it.
- If a future field needs server-only validation (e.g. a check against a
  database), add it to `route.ts`'s `.extend()` block, not to the shared
  schema — keep the shared schema limited to rules that are legitimately
  identical on both sides.
- A reviewer should scrutinize: that the 6 new schema tests actually
  reproduce the previous client-side UX copy (message text), and that
  `route.test.ts`'s existing assertions on `res.status` for the "missing
  required field" case (already in that file, per recon) still pass
  unmodified — that's the strongest signal the merge preserved server
  behavior exactly.
