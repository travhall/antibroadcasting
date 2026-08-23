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
