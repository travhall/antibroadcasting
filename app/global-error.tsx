"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { Button, buttonVariants } from "@/components/ui/Button";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error("Global error:", error);
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-bg-base flex items-center justify-center px-6">
        <div className="text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-text-primary mb-4">
            Application Error
          </h1>
          <p className="text-lg text-text-muted mb-2 max-w-md mx-auto">
            A critical error has occurred. We apologize for the inconvenience.
          </p>
          {error.digest && (
            <p className="text-sm text-text-muted mb-8 font-mono">
              Error ID: {error.digest}
            </p>
          )}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="primary" size="md" onClick={reset}>
              Try again
            </Button>
            {/* Plain <a>, not next/link: this boundary replaces the root layout
                and can fire when the root layout's own provider tree (which
                Link's router context depends on) is what crashed. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a
              href="/"
              className={buttonVariants({ variant: "secondary", size: "md" })}
            >
              Return Home
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
