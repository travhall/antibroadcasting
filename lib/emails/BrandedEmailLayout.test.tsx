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
