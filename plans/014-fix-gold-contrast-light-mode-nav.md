# Plan 014: Fix light-mode gold contrast failures in header/nav active states

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat a940780..HEAD -- components/layout/Header.tsx app/component-tokens.css`
> If either in-scope file changed since this plan was written, compare the
> "Current state" excerpts below against the live code before proceeding; on
> a mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: bug
- **Planned at**: commit `a940780`, 2026-07-24

## Why this matters

Three spots in the header/nav use the site's literal decorative gold
(`text-gold`, `border-b-gold`, and the `--nav-overlay-accent` token, all
ultimately `--color-primary-400`/`-300`/`-500`) to indicate active/hover
navigation state. That literal gold is defined as theme-invariant — it
never darkens for light mode — so it reads fine on the dark/ink background
(8–11.5:1) but drops to 2.26–3.31:1 against the light/paper background,
failing WCAG 2.2 AA (needs 3:1 for large text/UI boundaries, 4.5:1 for
small text). This site already solved the identical problem for every
other accent use (buttons, footer links, `ThemeToggle`) with
`--color-text-accent`, which swaps to a darker, AA-safe gold
(`--color-primary-700`, ≈7:1 on paper) specifically in light mode — these
three spots just weren't wired to use it. The fix is a token/class swap
with no logic changes, and every replacement value was verified to be
either contrast-neutral or contrast-improving in dark mode (see per-step
math below), so there's no dark-mode regression risk.

Contrast figures below were computed via the real OKLCH→sRGB WCAG relative
luminance formula (not the lightness-percent shortcut this codebase's own
comments warn is inaccurate), and cross-checked against this codebase's own
documented figure for a different token (`--color-muted-text`, both
methods independently landed on 4.00:1) to confirm the math is trustworthy.

## Current state

- `components/layout/Header.tsx` — desktop `NavLink` active-state underline
  (line 47) and mobile drawer nav-item label (lines 374–382).
- `app/component-tokens.css` — the `.light` override block for the mobile
  nav overlay token family (around line 295).

### 1. Desktop active-link underline — `components/layout/Header.tsx:40-53`

```tsx
function NavLink({
  href,
  pathname,
  children,
  onClick,
  className,
}: {
  href: string;
  pathname: string;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  const active = pathname === href;
  return (
    <TransitionLink
      href={href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`relative border-b-3 border-transparent transition-colors self-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
        active ? "pointer-events-none lg:border-b-gold" : "text-text-secondary"
      } ${className || ""}`}
    >
      {children}
    </TransitionLink>
  );
}
```

`border-b-gold` resolves to `--color-gold` → `--color-primary-400`, which
is constant across themes (`oklch(72% 0.16 75)`). Against the dark header
background (`neutral-950`, L12%) that's 8.0:1 — fine. Against the light
header background (`neutral-100`, L96%) it's **2.26:1** — fails the 3:1
minimum for a UI state boundary (SC 1.4.11).

### 2. Mobile drawer nav-item label — `components/layout/Header.tsx:352-395`

The relevant span (currently lines 374–382):

```tsx
                  <span
                    className={`font-display font-black uppercase leading-none transition-colors duration-200 text-[clamp(1.875rem,8vw,3rem)] ${
                      isActive
                        ? "text-gold"
                        : "text-text-menu group-hover:text-gold"
                    }`}
                  >
                    {item.label}
                  </span>
```

Same `--color-primary-400` value. Against the dark drawer background
(`--nav-overlay-bg` = `neutral-950`) it's 8.0:1. Against the light drawer
background (`--nav-overlay-bg` = `neutral-100` in `.light`) it's
**2.26:1** — fails even the relaxed 3:1 large-text threshold (this label
renders at 30–48px, font-black).

Do **not** touch the "→" arrow span a few lines below this one (around
line 383–388 in the current file):

```tsx
                  <span
                    aria-hidden="true"
                    className="ml-auto font-mono text-xs text-text-menu-subtle group-hover:text-gold transition-colors duration-200"
                  >
                    →
                  </span>
```

It also contains the substring `group-hover:text-gold`, but it's
`aria-hidden="true"` (purely decorative), so it's WCAG-exempt and out of
scope — leave it exactly as-is. This is why "find every `text-gold` in the
file and replace it" is the wrong approach here; you must edit the two
specific lines identified above by their surrounding context, not by a
blind text search.

Also do **not** touch line 246 (`before:bg-gold` on the desktop nav
hover-fill) — different property (`bg-`, not `text-`/`border-`), and it's
a decorative fill that always pairs with high-contrast ink text on top of
it, in both themes. Not part of this bug.

### 3. Mobile drawer index numbers — `app/component-tokens.css:177-196` and the `.light` override

Dark-mode default (`:root`, unaffected by this plan, shown for context):

```css
:root {
  --nav-overlay-bg: var(--color-neutral-950); /* overlay surface   */
  --nav-overlay-text: var(--color-neutral-100); /* primary nav labels */
  --nav-overlay-text-dim: var(--color-neutral-200); /* phone, location   */
  --nav-overlay-text-subtle: var(--color-neutral-300); /* eyebrow, arrows   */
  --nav-overlay-accent: var(--color-primary-300); /* index numbers     */
  --nav-overlay-border: var(--color-neutral-300); /* divider lines     */
}
```

Light-mode override (this is the block to edit — currently around line
289–297 in `app/component-tokens.css`):

```css
  /* ── Mobile nav overlay ──────────────────────────────────────────────────
   * Mirrors :root defaults — adjust these independently for light mode.    */
  --nav-overlay-bg: var(--color-neutral-100); /* overlay surface   */
  --nav-overlay-text: var(--color-neutral-900); /* primary nav labels */
  --nav-overlay-text-dim: var(--color-neutral-400); /* phone, location   */
  --nav-overlay-text-subtle: var(--color-neutral-600); /* eyebrow, arrows   */
  --nav-overlay-accent: var(--color-primary-500); /* index numbers     */
  --nav-overlay-border: var(--color-neutral-800); /* divider lines     */
```

This token drives `text-text-menu-accent`, used only by the "01", "02"…
index-number spans in the mobile drawer (`components/layout/Header.tsx`
around line 371, `text-text-menu-accent` class — not otherwise touched by
this plan). `--color-primary-500` against the light drawer background is
**3.31:1** — fails the 4.5:1 minimum for this small (`text-3xs`, 10px)
text (SC 1.4.3). `--color-primary-700` (the same accessible step used
elsewhere in this file for the identical purpose) computes to 7.05:1
there — comfortably clears AA with margin.

### Repo convention this fix follows

`--color-text-accent` (`app/globals.css:226`, resolving to
`--color-accent-text`) is this codebase's established "accessible gold"
token: `--color-primary-400` in dark mode, `--color-primary-700` in light
mode — already used correctly for the same "accent/active" role in:

- `components/ui/ThemeToggle.tsx:36` — active theme label
- `components/ui/CopyEmailButton.tsx:32` — hover state
- `components/layout/Footer.tsx` (`RegistrationMark` icon color)
- `app/(site)/style-guide/page.tsx` — every real accent use; that file
  also confirms the one legitimate exception: `text-gold` reserved
  specifically for the decorative "." after a logotype/heading
  (`style-guide/page.tsx:61,99`, `Footer.tsx:43`) — brand-mark text is
  WCAG-exempt (SC 1.4.3 note) and is correctly left alone by this plan.

`--color-accent-text` in dark mode is *exactly* `--color-primary-400` —
the same value `text-gold`/`border-b-gold` already resolve to — so
switching items 1 and 2 above to `text-text-accent`/`border-b-text-accent`
produces **zero dark-mode visual change** and fixes light mode to 7.05:1.

## Commands you will need

| Purpose    | Command                    | Expected on success            |
|------------|-----------------------------|--------------------------------|
| Typecheck  | `pnpm exec tsc --noEmit`   | exit 0, no errors               |
| Lint       | `pnpm lint`                | exit 0                          |
| Build      | `pnpm build`               | exit 0 (also validates that every Tailwind utility class used actually resolves) |
| Tests      | `pnpm test`                | all pass (no existing tests target these components; this just confirms no regression) |

## Scope

**In scope** (the only files you should modify):
- `components/layout/Header.tsx`
- `app/component-tokens.css`

**Out of scope** (do NOT touch, even though they look related):
- `components/layout/Header.tsx:246` (`before:bg-gold`) — decorative hover
  fill, always paired with high-contrast ink text on top, not part of this
  bug.
- `components/layout/Header.tsx:385` (arrow span `group-hover:text-gold`)
  — `aria-hidden="true"`, WCAG-exempt, contains the same substring as the
  label you're fixing but is a different element. Do not blind-replace.
- `components/layout/Footer.tsx:43` (`text-gold` on the "." after the
  wordmark) — decorative logotype text, WCAG-exempt (SC 1.4.3 note).
- `app/(site)/style-guide/page.tsx` — same exempt logotype pattern, not in
  the header/nav/footer scope of this audit.
- `--nav-overlay-accent` in the `:root` (dark-mode default) block of
  `app/component-tokens.css` — already passes (11.5:1), do not change it.
- Any other design token in `globals.css` or `component-tokens.css` — this
  audit checked the rest of the header/footer token usage and found it
  compliant; don't "improve" tokens outside this specific fix.

## Git workflow

- Branch: `advisor/014-fix-gold-contrast-light-mode-nav`
- Commit message style: conventional commits, matching repo history (e.g.
  `fix: override postcss to patch XSS advisory GHSA-qx2v-qp2m-jg93`). Use
  something like: `fix: use accessible accent token for nav active states in light mode`
- One commit for all three changes is fine — they're a single logical fix.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Fix the mobile-drawer accent token's light-mode value

In `app/component-tokens.css`, in the `.light { ... }` block, find:

```css
  --nav-overlay-accent: var(--color-primary-500); /* index numbers     */
```

Change it to:

```css
  --nav-overlay-accent: var(
    --color-primary-700
  ); /* corrected from primary-500 (3.31:1, failed AA) — verified 7.05:1 via real sRGB-luminance contrast math */
```

(Match the existing comment style in this file — see the `--color-muted-text`
correction comment in `app/globals.css:82` for the pattern being followed.)

**Verify**: `grep -n "nav-overlay-accent" app/component-tokens.css` → two
matches, one showing `--color-primary-300` (unchanged `:root` block) and
one showing `--color-primary-700` (the `.light` block you just edited).

### Step 2: Fix the desktop active-link underline

In `components/layout/Header.tsx`, inside the `NavLink` function, change:

```tsx
        active ? "pointer-events-none lg:border-b-gold" : "text-text-secondary"
```

to:

```tsx
        active ? "pointer-events-none lg:border-b-text-accent" : "text-text-secondary"
```

**Verify**: `grep -n "border-b-gold" components/layout/Header.tsx` → no
matches. `grep -n "border-b-text-accent" components/layout/Header.tsx` →
one match.

### Step 3: Fix the mobile drawer nav-item label

In `components/layout/Header.tsx`, inside the mobile nav items map (the
`<span className={\`font-display font-black uppercase ...\`}>` block —
NOT the arrow span a few lines after it), change:

```tsx
                      isActive
                        ? "text-gold"
                        : "text-text-menu group-hover:text-gold"
```

to:

```tsx
                      isActive
                        ? "text-text-accent"
                        : "text-text-menu group-hover:text-text-accent"
```

**Verify**: `grep -c "text-gold" components/layout/Header.tsx` → `1` (down
from `3`; the one remaining match is the exempt arrow span at the line
identified in "Current state" above — confirm with
`grep -n "text-gold" components/layout/Header.tsx` that the single
remaining hit is on the `aria-hidden="true"` arrow span, not the label).

### Step 4: Full verification pass

Run, in order:

```
pnpm exec tsc --noEmit
pnpm lint
pnpm build
pnpm test
```

All four must exit 0 / pass, per the table above.

### Step 5 (recommended, not a hard gate): Independent contrast re-check

If a shell with `python3` is available, run this self-contained script to
confirm the fixed light-mode values clear AA (it needs no dependencies and
doesn't touch the repo):

```bash
python3 << 'EOF'
import math

def oklch_to_srgb(L, C, H):
    h = math.radians(H)
    a, b = C * math.cos(h), C * math.sin(h)
    l_ = L + 0.3963377774*a + 0.2158037573*b
    m_ = L - 0.1055613458*a - 0.0638541728*b
    s_ = L - 0.0894841775*a - 1.2914855480*b
    l, m, s = l_**3, m_**3, s_**3
    r = 4.0767416621*l - 3.3077115913*m + 0.2309699292*s
    g = -1.2684380046*l + 2.6097574011*m - 0.3413193965*s
    bl = -0.0041960863*l - 0.7034186147*m + 1.7076147010*s
    def to_srgb(c):
        c = max(0.0, min(1.0, c))
        return 12.92*c if c <= 0.0031308 else 1.055*(c**(1/2.4)) - 0.055
    return to_srgb(r), to_srgb(g), to_srgb(bl)

def contrast(o1, o2):
    def lin(c): return c/12.92 if c <= 0.04045 else ((c+0.055)/1.055)**2.4
    def lum(rgb): return 0.2126*lin(rgb[0]) + 0.7152*lin(rgb[1]) + 0.0722*lin(rgb[2])
    l1, l2 = lum(oklch_to_srgb(*o1)), lum(oklch_to_srgb(*o2))
    hi, lo = max(l1,l2), min(l1,l2)
    return (hi+0.05)/(lo+0.05)

paper = (0.96, 0.012, 75)      # --color-neutral-100
primary_700 = (0.44, 0.16, 75) # --color-primary-700

c = contrast(primary_700, paper)
print(f"primary-700 vs paper: {c:.2f}:1")
assert c >= 4.5, "expected this to clear even the strict 4.5:1 text threshold"
print("PASS")
EOF
```

Expected output: `primary-700 vs paper: 7.05:1` then `PASS`.

## Test plan

There is no existing unit-test coverage for `Header.tsx`'s visual/token
usage (this repo's test suite covers logic, not rendered color values —
confirmed via `pnpm test` file list), and this fix is a pure
class-name/CSS-variable swap with no behavioral change, so no new
automated tests are required. Verification is: the build/lint/typecheck
gates above (catch invalid class names or syntax errors), the grep checks
per step (catch scope creep or missed edits), and the contrast script in
Step 5 (catches a wrong OKLCH value).

If you have access to a browser preview tool, a manual spot-check is
worthwhile but not required to consider this done: start the dev server,
toggle to light mode, open the mobile nav drawer, and visually confirm the
active/hover label and the "01/02/03" index numbers render in a visibly
darker gold than before (they should look closer to the footer's "Get in
Touch" hover-accent color than to the bright brand-gold swatch), and that
the desktop active nav-link's underline is similarly darker in light mode.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `pnpm exec tsc --noEmit` exits 0
- [ ] `pnpm lint` exits 0
- [ ] `pnpm build` exits 0
- [ ] `pnpm test` exits 0
- [ ] `grep -n "nav-overlay-accent" app/component-tokens.css` shows
      `--color-primary-300` in the `:root` block and `--color-primary-700`
      in the `.light` block
- [ ] `grep -c "border-b-gold" components/layout/Header.tsx` → `0`
- [ ] `grep -c "text-gold" components/layout/Header.tsx` → `1` (only the
      exempt aria-hidden arrow span remains)
- [ ] `git status` shows only `components/layout/Header.tsx` and
      `app/component-tokens.css` modified (plus whatever was already
      uncommitted before you started — don't touch those)
- [ ] `plans/README.md` status row for Plan 014 updated

## STOP conditions

Stop and report back (do not improvise) if:

- The code at the cited line numbers doesn't match the excerpts in
  "Current state" (the file has drifted since this plan was written — see
  the drift check at the top).
- `border-b-text-accent` does not produce a visible border-color change
  when built (i.e., Tailwind doesn't generate the utility as expected).
  Fallback: use the arbitrary-value syntax `border-b-(--color-text-accent)`
  instead — this repo already uses that pattern elsewhere (see
  `focus-visible:ring-offset-(--background)` in
  `components/ui/Button.tsx`). If neither works, stop and report rather
  than inventing a new token.
- Any of the four verification commands in Step 4 fails twice after a
  reasonable fix attempt.
- You find a fourth location using literal `text-gold`/`border-*-gold` for
  non-decorative content that this plan didn't account for — report it
  rather than fixing it silently (it needs the same review this plan's
  three locations got, not a copy-paste fix).

## Maintenance notes

- If a fourth "menu-family" token (`text-menu-*`) is ever added, apply the
  same check this plan did: does its `.light` override use the accessible
  palette step (`-700` for text-weight content, matching
  `--color-accent-text`'s pattern), or the raw decorative step? The
  `:root`/`.light` split in `component-tokens.css` makes it easy for a new
  token to copy the wrong sibling's value.
- This plan does not add a lint rule or test to catch a future regression
  of this kind (e.g., someone reintroducing `text-gold` on real content).
  If that's wanted, it would be a separate follow-up: a small ESLint rule
  or a contrast-testing script — out of scope here since it wasn't part of
  the original finding.
- A reviewer should scrutinize: that the arrow span (line ~385) and the
  hover-fill (line ~246) were correctly left untouched, and that the
  visual gold shade change in light mode (brighter/failing → darker/AA)
  reads as intentional rather than as a bug in review.
