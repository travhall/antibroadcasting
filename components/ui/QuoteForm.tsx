"use client";

import { useState, useRef, useCallback } from "react";
import Script from "next/script";
import { Button } from "@/components/ui/Button";
import { FileUpload } from "@/components/ui/FileUpload";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { quoteFormFieldsSchema } from "@/lib/quote-request-schema";

const MAX_ARTWORK_FILES = 5;
const MAX_ARTWORK_FILE_SIZE = 10 * 1024 * 1024; // 10MB per file
const MAX_ARTWORK_TOTAL_SIZE = 20 * 1024 * 1024; // combined cap, well under Resend's 40MB/email

async function filesToAttachments(files: File[]) {
  return Promise.all(
    files.map(async (file) => {
      const buffer = await file.arrayBuffer();
      const base64 = Buffer.from(buffer).toString("base64");
      return { filename: file.name, content: base64, contentType: file.type };
    }),
  );
}

type FormState = "idle" | "loading" | "success" | "error";

type QuoteFormProps = {
  garmentOptions: string[];
  timelineOptions: string[];
  minimumOrder: number;
  maxColors: number;
  responseTime: string;
  email: string;
  emailHref: string;
};

export function QuoteForm({
  garmentOptions,
  timelineOptions,
  minimumOrder,
  maxColors,
  responseTime,
  email,
  emailHref,
}: QuoteFormProps) {
  const [state, setState] = useState<FormState>("idle");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [artworkFiles, setArtworkFiles] = useState<File[]>([]);
  const [artworkKey, setArtworkKey] = useState(0);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const statusRef = useRef<HTMLSpanElement>(null);
  const turnstileRef = useRef<HTMLDivElement>(null);
  const turnstileWidgetId = useRef<string | null>(null);
  const [verifyMessage, setVerifyMessage] = useState<string | null>(null);

  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  const renderTurnstile = useCallback(() => {
    const w = window as typeof window & {
      turnstile?: { render: (el: HTMLElement, opts: object) => string };
    };
    if (!siteKey || !w.turnstile || !turnstileRef.current) return;
    if (turnstileWidgetId.current) return; // already rendered
    turnstileWidgetId.current = w.turnstile.render(turnstileRef.current, {
      sitekey: siteKey,
      callback: (token: string) => {
        setTurnstileToken(token);
        setVerifyMessage(null);
      },
      "expired-callback": () => setTurnstileToken(null),
      "error-callback": () => {
        setTurnstileToken(null);
        setVerifyMessage(
          `The spam check couldn't load. Refresh the page, or email us at ${email}.`,
        );
      },
      theme: "auto",
    });
  }, [siteKey, email]);

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

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const errs = validate(data);

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      // Move focus to the first invalid field so keyboard/AT users land there
      const firstKey = Object.keys(errs)[0];
      const firstInput = form.querySelector<HTMLElement>(
        `[name="${firstKey}"]`,
      );
      setTimeout(() => firstInput?.focus(), 0);
      return;
    }

    const totalArtworkSize = artworkFiles.reduce((sum, f) => sum + f.size, 0);
    if (totalArtworkSize > MAX_ARTWORK_TOTAL_SIZE) {
      setErrors({
        artwork: `Artwork files are too large (max ${MAX_ARTWORK_TOTAL_SIZE / 1024 / 1024}MB combined). Remove a file or compress your artwork.`,
      });
      return;
    }

    if (siteKey && !turnstileToken) {
      setVerifyMessage(
        "Finish the quick spam check above the button, then send again. Your details are saved.",
      );
      turnstileRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
      return;
    }

    setErrors({});
    setVerifyMessage(null);
    setState("loading");

    try {
      const res = await fetch("/api/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.get("name"),
          email: data.get("email"),
          quantity: data.get("quantity"),
          colors: data.get("colors"),
          garment: data.get("garment"),
          timeline: data.get("timeline"),
          message: data.get("message"),
          attachments: await filesToAttachments(artworkFiles),
          turnstileToken: turnstileToken ?? undefined,
          _hp: "",
        }),
      });

      if (!res.ok) throw new Error("Send failed");
      setState("success");
      form.reset();
      setArtworkFiles([]);
      setArtworkKey((k) => k + 1);
    } catch {
      setState("error");
      // Turnstile tokens are single-use — a retry needs a fresh one.
      const w = window as typeof window & {
        turnstile?: { reset: (id?: string) => void };
      };
      if (turnstileWidgetId.current) w.turnstile?.reset(turnstileWidgetId.current);
      setTurnstileToken(null);
    }
  }

  return (
    <>
      {/* Cloudflare Turnstile script — loaded once, async */}
      {siteKey && (
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js"
          strategy="lazyOnload"
          onLoad={renderTurnstile}
        />
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        {/* Honeypot — hidden from humans, invisible to CSS, but bots fill it */}
        <div
          aria-hidden="true"
          tabIndex={-1}
          style={{ position: "absolute", left: "-9999px", opacity: 0, pointerEvents: "none" }}
        >
          <label htmlFor="_hp">Leave this field empty</label>
          <input id="_hp" name="_hp" type="text" autoComplete="off" tabIndex={-1} />
        </div>
      {/* Polite live region — announces "Sending…" and result states to screen readers */}
      <span
        ref={statusRef}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {state === "loading" ? "Sending your request…" : ""}
      </span>

      <p className="font-mono text-3xs uppercase tracking-widest text-text-tertiary">
        Fields marked{" "}
        <span aria-hidden="true" className="text-text-accent">
          *
        </span>{" "}
        are required
      </p>
      {/* Name + Email */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Input
          name="name"
          label="Name"
          placeholder="Your name"
          autoComplete="name"
          required
          error={errors.name}
        />
        <Input
          name="email"
          type="email"
          label="Email"
          placeholder="your@email.com"
          autoComplete="email"
          required
          error={errors.email}
        />
      </div>

      {/* Quantity + Colors */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <Input
            name="quantity"
            type="number"
            label="Estimated Quantity"
            placeholder="e.g. 100"
            min={1}
            required
            error={errors.quantity}
          />
          <p className="mt-1.5 font-mono text-3xs uppercase tracking-widest text-text-tertiary">
            {minimumOrder} piece minimum
          </p>
        </div>
        <div>
          <Input
            name="colors"
            type="number"
            label="Number of Colors"
            placeholder="e.g. 2"
            min={1}
            max={maxColors}
          />
          <p className="mt-1.5 font-mono text-3xs uppercase tracking-widest text-text-tertiary">
            Up to {maxColors} colors
          </p>
        </div>
      </div>

      {/* Garment + Timeline */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Select
          name="garment"
          label="Garment Type"
          placeholder="Select a garment…"
          options={garmentOptions.map((opt) => ({ value: opt, label: opt }))}
        />
        <Select
          name="timeline"
          label="Timeline"
          placeholder="Select a timeline…"
          options={timelineOptions.map((opt) => ({ value: opt, label: opt }))}
        />
      </div>

      {/* Project description */}
      <Textarea
        name="message"
        label="Tell us about your project"
        placeholder="What are you printing? Any art ready? Anything else we should know?"
        rows={5}
        required
        error={errors.message}
      />

      {/* Artwork Files */}
      <div>
        <FileUpload
          key={artworkKey}
          label="Artwork Files"
          accept=".ai,.eps,.psd,.pdf,.png,.jpg,.jpeg"
          multiple
          maxFiles={MAX_ARTWORK_FILES}
          maxSize={MAX_ARTWORK_FILE_SIZE}
          onChange={setArtworkFiles}
          error={errors.artwork}
        />
        <p className="mt-1.5 text-sm text-text-secondary leading-relaxed">
          No art yet? No problem — you can submit without it. Check our{" "}
          <a
            href="/how-it-works#art-requirements"
            className="text-text-accent hover:text-text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            artwork requirements
          </a>{" "}
          before you send files.
        </p>
      </div>

      {/* Turnstile — sits above the submit so it is seen and solved first */}
      {siteKey && (
        <div>
          <div ref={turnstileRef} />
          {verifyMessage && (
            <p role="alert" className="mt-2 text-sm text-text-error">
              {verifyMessage}
            </p>
          )}
        </div>
      )}

      {/* Submit */}
      <div>
        <Button
          type="submit"
          variant="primary"
          disabled={state === "loading"}
          aria-busy={state === "loading"}
        >
          {state === "loading" ? "Sending…" : "Send Quote Request"}
        </Button>
      </div>

      {/* Feedback */}
      {state === "success" && (
        <div
          role="alert"
          className="border-l-4 border-gold px-5 py-4 bg-gold/5"
        >
          <p className="font-mono text-xs uppercase tracking-widest text-text-accent mb-1">
            Request Received
          </p>
          <p className="text-sm text-text-secondary leading-relaxed">
            We&apos;ll review your request and get back to you within{" "}
            {responseTime}.
          </p>
        </div>
      )}
      {state === "error" && (
        <div role="alert" className="border-l-4 border-text-error px-5 py-4">
          <p className="font-mono text-xs uppercase tracking-widest text-text-error mb-1">
            Something Went Wrong
          </p>
          <p className="text-sm text-text-secondary leading-relaxed">
            Your details are still in the form, so you can send it again. Or
            email us directly at{" "}
            <a
              href={emailHref}
              className="text-text-accent hover:text-text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              {email}
            </a>
            .
          </p>
        </div>
      )}
      </form>
    </>
  );
}
