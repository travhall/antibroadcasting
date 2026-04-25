"use client";

import { useState } from "react";
import { siteConfig } from "@/lib/site-config";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { FileUpload } from "@/components/ui/FileUpload";

type FormState = "idle" | "loading" | "success" | "error";

const GARMENT_OPTIONS = siteConfig.forms.quote.garmentOptions;

const TIMELINE_OPTIONS = siteConfig.forms.quote.timelineOptions;

export function QuoteForm() {
  const [state, setState] = useState<FormState>("idle");
  const [errors, setErrors] = useState<Record<string, string>>({});

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

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const errs = validate(data);

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setErrors({});
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
        }),
      });

      if (!res.ok) throw new Error("Send failed");
      setState("success");
      form.reset();
    } catch {
      setState("error");
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
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
          <p className="mt-1 text-xs text-text-tertiary">
            {siteConfig.business.minimumOrder} piece minimum for custom orders.
          </p>
        </div>
        <div>
          <Input
            name="colors"
            type="number"
            label="Number of Colors"
            placeholder="e.g. 2"
            min={1}
            max={8}
          />
          <p className="mt-1 text-xs text-text-tertiary">
            Up to {siteConfig.business.maxColors} colors supported.
          </p>
        </div>
      </div>

      {/* Garment + Timeline */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Select
          name="garment"
          label="Garment Type"
          placeholder="Select a garment…"
          options={GARMENT_OPTIONS.map((opt) => ({ value: opt, label: opt }))}
        />
        <Select
          name="timeline"
          label="Timeline"
          placeholder="Select a timeline…"
          options={TIMELINE_OPTIONS.map((opt) => ({ value: opt, label: opt }))}
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

      {/* File Upload */}
      <FileUpload
        label="Artwork Files (Optional)"
        accept=".ai,.psd,.pdf,.png,.jpg,.jpeg,.svg"
        maxSize={20 * 1024 * 1024} // 20MB
        multiple
        maxFiles={5}
      />

      {/* Submit */}
      <div>
        <Button type="submit" variant="primary" disabled={state === "loading"}>
          {state === "loading" ? "Sending…" : "Send Quote Request"}
        </Button>
      </div>

      {/* Feedback */}
      {state === "success" && (
        <div
          role="alert"
          className="rounded-input bg-bg-success text-text-success px-4 py-3 text-sm border border-border-success"
        >
          Got it — we'll review your request and get back to you within{" "}
          {siteConfig.forms.quote.responseTime || "1–2 business days"}.
        </div>
      )}
      {state === "error" && (
        <div
          role="alert"
          className="rounded-input bg-bg-error text-text-error px-4 py-3 text-sm border border-border-error"
        >
          Something went wrong. Try emailing us directly at{" "}
          <a
            href={siteConfig.contact.emailHref}
            className="underline rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring-error focus-visible:ring-offset-1 focus-visible:ring-offset-background"
          >
            {siteConfig.contact.email}
          </a>
          .
        </div>
      )}
    </form>
  );
}
