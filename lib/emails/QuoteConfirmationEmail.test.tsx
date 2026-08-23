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
