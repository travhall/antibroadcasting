import { render, Heading, Text } from "@react-email/components";
import { BrandedEmailLayout, EMAIL_BRAND, EMAIL_FONT_STACK, type FooterInfo } from "./BrandedEmailLayout";

type QuoteNotificationEmailProps = {
  name: string;
  email: string;
  quantity?: number | null;
  colors?: number | string | null;
  garment?: string | null;
  timeline?: string | null;
  message: string;
  footer: FooterInfo;
};

const fieldStyle = { fontFamily: EMAIL_FONT_STACK, fontSize: "14px", color: EMAIL_BRAND.ink, margin: "0 0 4px" };
const labelStyle = { fontWeight: 700 };

export function QuoteNotificationEmail({
  name,
  email,
  quantity,
  colors,
  garment,
  timeline,
  message,
  footer,
}: QuoteNotificationEmailProps) {
  return (
    <BrandedEmailLayout
      previewText={`New quote request from ${name}`}
      footer={footer}
    >
      <Heading as="h1" style={{ fontFamily: EMAIL_FONT_STACK, fontSize: "16px", fontWeight: 700, color: EMAIL_BRAND.ink, margin: "0 0 16px" }}>
        New Quote Request
      </Heading>
      <Text style={fieldStyle}><span style={labelStyle}>Name:</span> {name}</Text>
      <Text style={fieldStyle}><span style={labelStyle}>Email:</span> {email}</Text>
      <Text style={fieldStyle}><span style={labelStyle}>Quantity:</span> {quantity ?? "Not specified"}</Text>
      <Text style={fieldStyle}><span style={labelStyle}>Colors:</span> {colors ?? "Not specified"}</Text>
      <Text style={fieldStyle}><span style={labelStyle}>Garment:</span> {garment ?? "Not specified"}</Text>
      <Text style={{ ...fieldStyle, margin: "0 0 16px" }}>
        <span style={labelStyle}>Timeline:</span> {timeline ?? "Not specified"}
      </Text>
      <Text style={{ fontFamily: EMAIL_FONT_STACK, fontSize: "14px", color: EMAIL_BRAND.ink, whiteSpace: "pre-wrap" }}>
        {message}
      </Text>
    </BrandedEmailLayout>
  );
}

export async function renderQuoteNotificationEmail(
  props: QuoteNotificationEmailProps,
): Promise<{ html: string; text: string }> {
  const element = <QuoteNotificationEmail {...props} />;
  const [html, text] = await Promise.all([
    render(element),
    render(element, { plainText: true }),
  ]);
  return { html, text };
}

export default function QuoteNotificationEmailPreview() {
  return (
    <QuoteNotificationEmail
      name="Jane Doe"
      email="jane@example.com"
      quantity={50}
      colors={2}
      garment="T-Shirt"
      timeline="Standard (7–10 business days)"
      message="Hi, please quote this job for our upcoming event."
      footer={{
        companyName: "Antibroadcasting Screen Printing",
        phone: "612.836.9488",
        addressFull: "3715 Oregon Ave S #5, Minneapolis, MN 55426",
      }}
    />
  );
}
