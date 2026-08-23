import { render, Heading, Text } from "@react-email/components";
import { BrandedEmailLayout, EMAIL_BRAND, EMAIL_FONT_STACK, type FooterInfo } from "./BrandedEmailLayout";

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
      <Heading as="h1" style={{ fontFamily: EMAIL_FONT_STACK, fontSize: "16px", fontWeight: 700, color: EMAIL_BRAND.ink, margin: "0 0 16px" }}>
        Request Received
      </Heading>
      <Text style={{ fontFamily: EMAIL_FONT_STACK, fontSize: "14px", color: EMAIL_BRAND.ink, margin: "0 0 12px" }}>
        Hi {name},
      </Text>
      <Text style={{ fontFamily: EMAIL_FONT_STACK, fontSize: "14px", color: EMAIL_BRAND.ink, margin: "0 0 12px" }}>
        Thanks for reaching out to {footer.companyName}. We&apos;ve got your quote
        request and will get back to you within {responseTime}.
      </Text>
      <Text style={{ fontFamily: EMAIL_FONT_STACK, fontSize: "14px", color: EMAIL_BRAND.ink }}>
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

export default function QuoteConfirmationEmailPreview() {
  return (
    <QuoteConfirmationEmail
      name="Jane Doe"
      responseTime="1–2 business days"
      footer={{
        companyName: "Antibroadcasting Screen Printing",
        phone: "612.836.9488",
        addressFull: "3715 Oregon Ave S #5, Minneapolis, MN 55426",
      }}
    />
  );
}
