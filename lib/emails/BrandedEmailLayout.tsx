import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import type { ReactNode } from "react";

export const EMAIL_BRAND = {
  gold: "#F2A900",
  ink: "#1A1A1A",
  paper: "#FAFAF8",
  paperMuted: "#EFEDE6",
  border: "#DDD9CE",
} as const;

const FONT_STACK = "'Helvetica Neue', Helvetica, Arial, sans-serif";

export type FooterInfo = {
  companyName: string;
  phone: string;
  addressFull: string;
};

type BrandedEmailLayoutProps = {
  previewText: string;
  footer: FooterInfo;
  children: ReactNode;
};

export function BrandedEmailLayout({
  previewText,
  footer,
  children,
}: BrandedEmailLayoutProps) {
  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body
        style={{
          backgroundColor: EMAIL_BRAND.paperMuted,
          fontFamily: FONT_STACK,
          margin: 0,
          padding: "32px 0",
        }}
      >
        <Container
          style={{
            backgroundColor: EMAIL_BRAND.paper,
            maxWidth: "480px",
            margin: "0 auto",
            border: `1px solid ${EMAIL_BRAND.border}`,
          }}
        >
          <Section style={{ padding: "32px 32px 24px" }}>
            <Text
              style={{
                fontFamily: FONT_STACK,
                fontWeight: 800,
                fontSize: "20px",
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                color: EMAIL_BRAND.ink,
                margin: 0,
              }}
            >
              ANTIBROADCASTING
              <span style={{ color: EMAIL_BRAND.gold }}>.</span>
            </Text>
          </Section>
          <Hr style={{ borderColor: EMAIL_BRAND.border, margin: 0 }} />
          <Section style={{ padding: "24px 32px" }}>{children}</Section>
          <Hr style={{ borderColor: EMAIL_BRAND.border, margin: 0 }} />
          <Section style={{ padding: "20px 32px" }}>
            <Text
              style={{
                fontFamily: FONT_STACK,
                fontSize: "12px",
                color: EMAIL_BRAND.ink,
                margin: "0 0 4px",
              }}
            >
              {footer.companyName}
            </Text>
            <Text
              style={{
                fontFamily: FONT_STACK,
                fontSize: "12px",
                color: EMAIL_BRAND.ink,
                margin: 0,
              }}
            >
              {footer.phone} · {footer.addressFull}
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
