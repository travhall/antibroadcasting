"use client";

import { useState } from "react";

type FormState = "idle" | "loading" | "success" | "error";

const GARMENT_OPTIONS = [
  "T-Shirt",
  "Long Sleeve",
  "Hoodie / Sweatshirt",
  "Tank Top",
  "Tote Bag",
  "Other / Not Sure",
];

const TIMELINE_OPTIONS = [
  "Standard (7–10 business days)",
  "2–3 weeks",
  "1 month+",
  "Rush — I need it ASAP",
];

export function QuoteForm() {
  const [state, setState] = useState<FormState>("idle");
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate(data: FormData) {
    const errs: Record<string, string> = {};
    if (!data.get("name")) errs.name = "Name is required.";
    if (!data.get("email")) {
      errs.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.get("email") as string)) {
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
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-1.5">
            Name <span className="text-red-500">*</span>
          </label>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            className={`w-full rounded-md border px-3.5 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-zinc-900 ${
              errors.name ? "border-red-400" : "border-zinc-300"
            }`}
          />
          {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1.5">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            className={`w-full rounded-md border px-3.5 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-zinc-900 ${
              errors.email ? "border-red-400" : "border-zinc-300"
            }`}
          />
          {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
        </div>
      </div>

      {/* Quantity + Colors */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="quantity" className="block text-sm font-medium mb-1.5">
            Estimated Quantity <span className="text-red-500">*</span>
          </label>
          <input
            id="quantity"
            name="quantity"
            type="number"
            min={1}
            placeholder="e.g. 100"
            className={`w-full rounded-md border px-3.5 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-zinc-900 ${
              errors.quantity ? "border-red-400" : "border-zinc-300"
            }`}
          />
          {errors.quantity && <p className="mt-1 text-xs text-red-500">{errors.quantity}</p>}
          <p className="mt-1 text-xs text-zinc-400">50 piece minimum for custom orders.</p>
        </div>
        <div>
          <label htmlFor="colors" className="block text-sm font-medium mb-1.5">
            Number of Colors
          </label>
          <input
            id="colors"
            name="colors"
            type="number"
            min={1}
            max={8}
            placeholder="e.g. 2"
            className="w-full rounded-md border border-zinc-300 px-3.5 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-zinc-900"
          />
          <p className="mt-1 text-xs text-zinc-400">Up to 8 colors supported.</p>
        </div>
      </div>

      {/* Garment + Timeline */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="garment" className="block text-sm font-medium mb-1.5">
            Garment Type
          </label>
          <select
            id="garment"
            name="garment"
            defaultValue=""
            className="w-full rounded-md border border-zinc-300 px-3.5 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-zinc-900 bg-white"
          >
            <option value="" disabled>Select a garment…</option>
            {GARMENT_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="timeline" className="block text-sm font-medium mb-1.5">
            Timeline
          </label>
          <select
            id="timeline"
            name="timeline"
            defaultValue=""
            className="w-full rounded-md border border-zinc-300 px-3.5 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-zinc-900 bg-white"
          >
            <option value="" disabled>Select a timeline…</option>
            {TIMELINE_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Project description */}
      <div>
        <label htmlFor="message" className="block text-sm font-medium mb-1.5">
          Tell us about your project <span className="text-red-500">*</span>
        </label>
        <textarea
          id="message"
          name="message"
          rows={5}
          placeholder="What are you printing? Any art ready? Anything else we should know?"
          className={`w-full rounded-md border px-3.5 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-zinc-900 resize-none ${
            errors.message ? "border-red-400" : "border-zinc-300"
          }`}
        />
        {errors.message && <p className="mt-1 text-xs text-red-500">{errors.message}</p>}
      </div>

      {/* Submit */}
      <div>
        <button
          type="submit"
          disabled={state === "loading"}
          className="w-full sm:w-auto rounded-md bg-zinc-900 px-8 py-3 text-sm font-semibold text-white transition hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {state === "loading" ? "Sending…" : "Send Quote Request"}
        </button>
      </div>

      {/* Feedback */}
      {state === "success" && (
        <div className="rounded-md bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800">
          Got it — we'll review your request and get back to you within 1–2 business days.
        </div>
      )}
      {state === "error" && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800">
          Something went wrong. Try emailing us directly at{" "}
          <a href="mailto:info@antibroadcasting.com" className="underline">
            info@antibroadcasting.com
          </a>
          .
        </div>
      )}
    </form>
  );
}
