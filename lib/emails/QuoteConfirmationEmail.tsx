import { render, Heading, Text } from "@react-email/components";
import { BrandedEmailLayout, EMAIL_BRAND, type FooterInfo } from "./BrandedEmailLayout";

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
      <Heading as="h1" style={{ fontSize: "16px", fontWeight: 700, color: EMAIL_BRAND.ink, margin: "0 0 16px" }}>
        Request Received
      </Heading>
      <Text style={{ fontSize: "14px", color: EMAIL_BRAND.ink, margin: "0 0 12px" }}>
        Hi {name},
      </Text>
      <Text style={{ fontSize: "14px", color: EMAIL_BRAND.ink, margin: "0 0 12px" }}>
        Thanks for reaching out to {footer.companyName}. We&apos;ve got your quote
        request and will get back to you within {responseTime}.
      </Text>
      <Text style={{ fontSize: "14px", color: EMAIL_BRAND.ink }}>
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
