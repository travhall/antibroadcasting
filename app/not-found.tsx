import { Metadata } from "next";
import { buttonVariants } from "@/components/ui/Button";
import { TransitionLink } from "@/components/layout/TransitionLink";
import { ScrollToTop } from "@/components/ui/ScrollToTop";

export const metadata: Metadata = {
  title: "404 - Page Not Found",
  description: "The page you are looking for does not exist.",
};

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
      <ScrollToTop />
      <h1 className="text-6xl md:text-8xl font-bold text-text-primary mb-4">
        404
      </h1>
      <h2 className="text-2xl md:text-3xl font-semibold text-text-primary mb-4">
        Page Not Found
      </h2>
      <p className="text-lg text-text-muted mb-8 max-w-md">
        The page you are looking for doesn&apos;t exist or has been moved.
      </p>
      <TransitionLink
        href="/"
        className={buttonVariants({ variant: "primary", size: "md" })}
      >
        Return Home
      </TransitionLink>
    </div>
  );
}
