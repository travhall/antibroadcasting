import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { z } from "zod";
import { getSiteInfo } from "@/lib/get-site-info";
import { quoteFormFieldsSchema } from "@/lib/quote-request-schema";
import { renderQuoteNotificationEmail } from "@/lib/emails/QuoteNotificationEmail";
import { renderQuoteConfirmationEmail } from "@/lib/emails/QuoteConfirmationEmail";

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
    // Honeypot — must be empty; bots fill it, humans don’t see it
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

// ─── Rate limiter ─────────────────────────────────────────────────────────────
// In-memory per-IP limiter. Fluid Compute reuses instances across concurrent
// requests so this is effective in practice. Max 5 requests per 10 minutes.

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 5;
const WINDOW_MS = 10 * 60 * 1000;

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }

  if (entry.count >= RATE_LIMIT) return false;

  entry.count++;
  return true;
}

// ─── Turnstile ───────────────────────────────────────────────────────────────

async function verifyTurnstile(token: string, ip: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  // No secret = local dev, skip verification
  if (!secret) return true;

  const res = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret, response: token, remoteip: ip }),
    },
  );
  const data = (await res.json()) as { success: boolean };
  return data.success === true;
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 },
    );
  }

  try {
    const parsed = quoteRequestSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: z.treeifyError(parsed.error) },
        { status: 400 },
      );
    }
    const { name, email, message, quantity, colors, garment, timeline, attachments, _hp, turnstileToken } =
      parsed.data;

    // Honeypot check
    if (_hp) {
      // Return 200 to not tip off bots
      return NextResponse.json({ data: null });
    }

    // Turnstile verification
    if (!(await verifyTurnstile(turnstileToken ?? "", ip))) {
      return NextResponse.json(
        { error: "Challenge failed. Please try again." },
        { status: 403 },
      );
    }

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

    if (error) {
      console.error("Resend send failed:", error);
      return NextResponse.json(
        { error: "Failed to send email" },
        { status: 500 },
      );
    }

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
        replyTo: siteInfo.forms.quote.emailTo,
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

    return NextResponse.json({ data });
  } catch {
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 },
    );
  }
}
