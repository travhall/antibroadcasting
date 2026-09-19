import { TransitionLink } from "@/components/layout/TransitionLink";

interface PageBreadcrumbProps {
  /** The current page label shown as the last crumb. */
  page: string;
  /**
   * Optional plain-text crumb between Home and the current page — e.g.
   * "Updates" for /updates/[slug], where the page label is the post title
   * and would otherwise duplicate it against a bare Home/Title trail. Not a
   * link: there's no listing page behind it yet.
   */
  parent?: string;
  className?: string;
}

/**
 * Breadcrumb for interior pages. Replaces the static "Est. 2005 …" eyebrow,
 * which provides no navigational value on pages below the homepage.
 *
 * Semantics: <nav> + <ol> + aria-current="page" on the active crumb.
 */
export function PageBreadcrumb({
  page,
  parent,
  className,
}: PageBreadcrumbProps) {
  return (
    <div className={`flex items-center gap-4 mb-6 ${className ?? ""}`}>
      <nav aria-label="Breadcrumb">
        <ol className="flex items-center gap-2">
          <li>
            <TransitionLink
              href="/"
              className="tap-target font-mono text-xs uppercase tracking-widest text-text-tertiary hover:text-text-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Home
            </TransitionLink>
          </li>
          {parent && (
            <>
              <li
                aria-hidden="true"
                className="font-mono text-xs text-text-tertiary/40 select-none"
              >
                /
              </li>
              <li>
                <span className="font-mono text-xs uppercase tracking-widest text-text-tertiary">
                  {parent}
                </span>
              </li>
            </>
          )}
          <li
            aria-hidden="true"
            className="font-mono text-xs text-text-tertiary/40 select-none"
          >
            /
          </li>
          <li>
            <span
              className="font-mono text-xs uppercase tracking-widest text-text-tertiary"
              aria-current="page"
            >
              {page}
            </span>
          </li>
        </ol>
      </nav>
      <span aria-hidden="true" className="h-px w-16 bg-gold hidden sm:block" />
    </div>
  );
}
