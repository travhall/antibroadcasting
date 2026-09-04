import { Metadata } from "next";
import { PageBreadcrumb } from "@/components/ui/PageBreadcrumb";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Learn how Antibroadcasting collects, uses, and protects your personal information.",
};

// Bump this manually whenever the policy text below actually changes.
const LAST_UPDATED = "April 27, 2026";

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto py-10">
      <PageBreadcrumb page="Privacy Policy" />
      <h1 className="text-4xl font-bold text-text-primary mb-8">
        Privacy Policy
      </h1>

      <div className="prose prose-lg max-w-none text-text-secondary">
        <p className="text-text-muted mb-6">Last updated: {LAST_UPDATED}</p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-text-primary mb-4">
            Information We Collect
          </h2>
          <p className="mb-4">
            We collect information you provide directly to us when you:
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>Request a quote through our contact form</li>
            <li>Email us with inquiries</li>
            <li>Call us by phone</li>
            <li>Visit our website (usage data via cookies)</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-text-primary mb-4">
            How We Use Your Information
          </h2>
          <p className="mb-4">We use the information we collect to:</p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>Respond to your inquiries and provide quotes</li>
            <li>Process and fulfill your screen printing orders</li>
            <li>Communicate with you about your project</li>
            <li>Improve our website and services</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-text-primary mb-4">
            Information Sharing
          </h2>
          <p className="mb-4">
            We do not sell, trade, or rent your personal information to third
            parties. We may share your information with:
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>Service providers who assist in operating our business</li>
            <li>Legal authorities when required by law</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-text-primary mb-4">
            Data Security
          </h2>
          <p className="mb-4">
            We implement appropriate technical and organizational measures to
            protect your personal information against unauthorized access,
            alteration, or destruction.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-text-primary mb-4">
            Your Rights
          </h2>
          <p className="mb-4">You have the right to:</p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>Access your personal information</li>
            <li>Request correction of inaccurate information</li>
            <li>Request deletion of your information</li>
            <li>Opt out of marketing communications</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-text-primary mb-4">
            Contact Us
          </h2>
          <p>
            If you have questions about this Privacy Policy, please contact us
            at{" "}
            <a
              href="mailto:info@antibroadcasting.com"
              className="font-medium text-text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              info@antibroadcasting.com
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
