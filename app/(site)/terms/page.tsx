import { Metadata } from "next";
import { PageBreadcrumb } from "@/components/ui/PageBreadcrumb";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms and conditions for using Antibroadcasting's services.",
};

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto py-10">
      <PageBreadcrumb page="Terms of Service" />
      <h1 className="text-4xl font-bold text-text-primary mb-8">
        Terms of Service
      </h1>

      <div className="prose prose-lg max-w-none text-text-secondary">
        <p className="text-text-muted mb-6">
          Last updated:{" "}
          {new Date().toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-text-primary mb-4">
            1. Acceptance of Terms
          </h2>
          <p className="mb-4">
            By accessing or using Antibroadcasting&apos;s website and services,
            you agree to be bound by these Terms of Service. If you do not agree
            to these terms, please do not use our services.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-text-primary mb-4">
            2. Services
          </h2>
          <p className="mb-4">
            Antibroadcasting provides custom screen printing services including
            but not limited to:
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>Custom apparel printing (t-shirts, hoodies, etc.)</li>
            <li>Promotional merchandise</li>
            <li>Event and band merchandise</li>
            <li>Design consultation services</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-text-primary mb-4">
            3. Orders and Payment
          </h2>
          <p className="mb-4">
            All orders require a minimum quantity as specified in our quotes.
            Payment terms are as follows:
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>A deposit may be required to begin production</li>
            <li>Full payment is due before order shipment or pickup</li>
            <li>Quotes are valid for 30 days unless otherwise specified</li>
            <li>Prices are subject to change based on material costs</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-text-primary mb-4">
            4. Turnaround Time
          </h2>
          <p className="mb-4">
            Standard turnaround time is 7-10 business days from approval of
            final artwork and receipt of deposit (if required). Rush orders may
            be available for an additional fee. We are not responsible for
            delays caused by:
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>Delayed artwork approval</li>
            <li>Stock availability issues</li>
            <li>Shipping carrier delays</li>
            <li>Force majeure events</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-text-primary mb-4">
            5. Artwork and Copyright
          </h2>
          <p className="mb-4">
            By providing artwork for printing, you represent and warrant that:
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>
              You own the rights to the artwork or have permission to use it
            </li>
            <li>The artwork does not infringe on any third-party rights</li>
            <li>
              You grant us a limited license to use the artwork solely for
              production
            </li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-text-primary mb-4">
            6. Cancellations and Returns
          </h2>
          <p className="mb-4">
            Orders may be cancelled before production begins. Once production
            has started, orders cannot be cancelled. Due to the custom nature of
            our products, all sales are final. We will address any quality
            issues on a case-by-case basis.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-text-primary mb-4">
            7. Limitation of Liability
          </h2>
          <p className="mb-4">
            Antibroadcasting&apos;s liability is limited to the value of the
            order in question. We are not liable for indirect, incidental, or
            consequential damages.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-text-primary mb-4">
            8. Contact Information
          </h2>
          <p>
            For questions about these Terms of Service, please contact us at{" "}
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
