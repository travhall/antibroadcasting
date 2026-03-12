export default function StyleGuide() {
  const colors = {
    primary: {
      100: "oklch(96% 0.02 12)",
      200: "oklch(90% 0.05 12)",
      300: "oklch(80% 0.1 12)",
      400: "oklch(60% 0.15 12)",
      500: "oklch(42% 0.2 12)",
      600: "oklch(35% 0.18 12)",
      700: "oklch(28% 0.15 12)",
      800: "oklch(22% 0.12 12)",
      900: "oklch(18% 0.1 12)",
      950: "oklch(12% 0.08 12)",
    },
    secondary: {
      100: "oklch(96% 0.01 195)",
      200: "oklch(90% 0.03 195)",
      300: "oklch(80% 0.05 195)",
      400: "oklch(70% 0.08 195)",
      500: "oklch(60% 0.1 195)",
      600: "oklch(52% 0.09 195)",
      700: "oklch(44% 0.08 195)",
      800: "oklch(36% 0.07 195)",
      900: "oklch(28% 0.06 195)",
      950: "oklch(20% 0.05 195)",
    },
    neutral: {
      100: "oklch(98% 0.002 12)",
      200: "oklch(92% 0.004 12)",
      300: "oklch(85% 0.006 12)",
      400: "oklch(70% 0.008 12)",
      500: "oklch(55% 0.01 12)",
      600: "oklch(40% 0.009 12)",
      700: "oklch(30% 0.008 12)",
      800: "oklch(25% 0.006 12)",
      900: "oklch(20% 0.005 12)",
      950: "oklch(15% 0.004 12)",
    },
    accent: "oklch(60% 0.25 12)",
    muted: "oklch(80% 0.03 60)",
  };

  const renderColorRow = (name: string, shades: Record<string, string>) => (
    <div className="mb-8">
      <h3 className="text-sm font-medium text-text-muted mb-3 uppercase tracking-wider">
        {name}
      </h3>
      <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
        {Object.entries(shades).map(([shade, color]) => (
          <div key={shade} className="group">
            <div className="h-16 rounded-lg shadow-sm border border-border-subtle relative overflow-hidden">
              {/* Checkerboard background for transparency/visibility */}
              <div
                className="absolute inset-0 opacity-30"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='8' height='8' viewBox='0 0 8 8' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%239C92AC' fill-opacity='0.2' fill-rule='evenodd'%3E%3Cpath d='M0 0h4v4H0V0zm4 4h4v4H4V4z'/%3E%3C/g%3E%3C/svg%3E")`,
                }}
              />
              <div
                className="absolute inset-0"
                style={{ backgroundColor: color }}
              />
            </div>
            <p className="text-xs text-text-secondary mt-1 text-center">
              {shade}
            </p>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <main className="min-h-screen bg-bg-base pt-32 pb-24 px-6">
      <div className="max-w-6xl mx-auto">
        <header className="mb-16 pb-8 border-b border-border-default">
          <p className="text-sm font-medium text-text-muted uppercase tracking-wider mb-2">
            Antibroadcasting Inc.
          </p>
          <h1
            className="text-5xl font-display text-text-primary mb-4"
            style={{ fontWeight: 700 }}
          >
            Style Guide
          </h1>
          <p className="text-lg text-text-secondary">
            Typography, colors, and components reference
          </p>
        </header>

        {/* Typography Section */}
        <section className="mb-20">
          <h2
            className="text-3xl font-display text-text-primary mb-8 pb-2 border-b border-border-default"
            style={{ fontWeight: 600 }}
          >
            Typography
          </h2>

          {/* Background Variance Demo */}
          <div className="mb-12">
            <h3
              className="text-xl font-display text-text-primary mb-3"
              style={{ fontWeight: 500 }}
            >
              Background Variance Tokens
            </h3>
            <div className="grid sm:grid-cols-3 lg:grid-cols-5 gap-4">
              <div className="bg-bg-base rounded-card p-4 border border-border-subtle">
                <p className="text-sm text-text-primary font-medium">bg-base</p>
                <p className="text-xs text-text-tertiary">Page background</p>
              </div>
              <div className="bg-bg-subtle rounded-card p-4 border border-border-subtle">
                <p className="text-sm text-text-primary font-medium">
                  bg-subtle
                </p>
                <p className="text-xs text-text-tertiary">Subtle sections</p>
              </div>
              <div className="bg-bg-elevated rounded-card p-4 border border-border-subtle">
                <p className="text-sm text-text-primary font-medium">
                  bg-elevated
                </p>
                <p className="text-xs text-text-tertiary">Cards, popovers</p>
              </div>
              <div className="bg-bg-inset rounded-card p-4 border border-border-subtle">
                <p className="text-sm text-text-primary font-medium">
                  bg-inset
                </p>
                <p className="text-xs text-text-tertiary">Inset areas</p>
              </div>
              <div className="bg-bg-inverse rounded-card p-4 border border-border-inverse">
                <p className="text-sm text-text-inverse font-medium">
                  bg-inverse
                </p>
                <p className="text-xs text-text-inverse opacity-70">
                  Banners, footers
                </p>
              </div>
            </div>
          </div>

          {/* Figtree Sans */}
          <div className="mb-12">
            <h3
              className="text-xl font-display text-text-primary mb-4"
              style={{ fontWeight: 500 }}
            >
              Figtree Sans — Primary UI Font (var(--font-sans))
            </h3>
            <div className="space-y-4">
              <div className="flex items-baseline gap-4">
                <span className="text-sm text-text-tertiary w-16">H1</span>
                <h1
                  className="text-5xl font-sans text-text-primary"
                  style={{ fontWeight: 700 }}
                >
                  Heading One
                </h1>
              </div>
              <div className="flex items-baseline gap-4">
                <span className="text-sm text-text-tertiary w-16">H2</span>
                <h2
                  className="text-4xl font-sans text-text-primary"
                  style={{ fontWeight: 600 }}
                >
                  Heading Two
                </h2>
              </div>
              <div className="flex items-baseline gap-4">
                <span className="text-sm text-text-tertiary w-16">H3</span>
                <h3
                  className="text-3xl font-sans text-text-primary"
                  style={{ fontWeight: 500 }}
                >
                  Heading Three
                </h3>
              </div>
              <div className="flex items-baseline gap-4">
                <span className="text-sm text-text-tertiary w-16">Body</span>
                <p className="text-base text-text-secondary leading-relaxed">
                  The quick brown fox jumps over the lazy dog. Pack my box with
                  five dozen liquor jugs.
                </p>
              </div>
              <div className="flex items-baseline gap-4">
                <span className="text-sm text-text-tertiary w-16">Small</span>
                <p className="text-sm text-text-tertiary">
                  Secondary text, captions, and metadata information.
                </p>
              </div>
            </div>
          </div>

          {/* Dominique Variable Font */}
          <div className="mb-12">
            <h3
              className="text-xl font-display text-text-primary mb-4"
              style={{ fontWeight: 500 }}
            >
              Dominique — Display Font (var(--font-display))
            </h3>
            <div className="space-y-4 font-display">
              <div className="flex items-baseline gap-4">
                <span className="text-sm text-text-muted w-16 font-sans">
                  900
                </span>
                <p
                  className="text-4xl text-text-primary"
                  style={{ fontWeight: 900 }}
                >
                  Heavy Weight Display
                </p>
              </div>
              <div className="flex items-baseline gap-4">
                <span className="text-sm text-text-muted w-16 font-sans">
                  700
                </span>
                <p
                  className="text-3xl text-text-primary"
                  style={{ fontWeight: 700 }}
                >
                  Bold Display Text
                </p>
              </div>
              <div className="flex items-baseline gap-4">
                <span className="text-sm text-text-muted w-16 font-sans">
                  500
                </span>
                <p
                  className="text-2xl text-text-primary"
                  style={{ fontWeight: 500 }}
                >
                  Medium Weight Display
                </p>
              </div>
              <div className="flex items-baseline gap-4">
                <span className="text-sm text-text-muted w-16 font-sans">
                  400
                </span>
                <p
                  className="text-xl text-text-primary"
                  style={{ fontWeight: 400 }}
                >
                  Regular Display Text
                </p>
              </div>
            </div>
            <p className="text-sm text-text-muted mt-4 font-sans">
              Variable font — supports weights 100-900 (or full range depending
              on font capabilities)
            </p>
          </div>

          {/* Geist Mono */}
          <div className="mb-12">
            <h3
              className="text-xl font-display text-text-primary mb-4"
              style={{ fontWeight: 500 }}
            >
              Geist Mono — Monospace Font (var(--font-mono))
            </h3>
            <div className="space-y-4 font-mono">
              <div className="flex items-baseline gap-4">
                <span className="text-sm text-text-muted">Code Block</span>
                <code className="px-3 py-2 bg-bg-subtle rounded text-sm text-text-primary border border-border-subtle">
                  const fontWeight = 400;
                </code>
              </div>
              <p className="text-sm text-text-secondary leading-relaxed">
                Monospace font for code, technical content, and data display.
                Excellent readability at small sizes.
              </p>
            </div>
          </div>

          {/* Font Pairings */}
          <div className="mb-12">
            <h3
              className="text-xl font-display text-text-primary mb-4"
              style={{ fontWeight: 500 }}
            >
              Font Pairings — Reusable Typographic Styles
            </h3>

            {/* Hero Heading Style */}
            <div className="mb-8 p-6 bg-bg-elevated rounded-card border border-border-subtle">
              <h4 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-3">
                Hero Heading
              </h4>
              <h2
                className="text-4xl md:text-5xl font-display text-text-primary mb-4"
                style={{ fontWeight: 700 }}
              >
                Make a Statement with Dominique
              </h2>
              <p className="text-lg text-text-secondary leading-relaxed font-sans">
                Pair bold display typography with clean, readable body text for
                maximum impact and clarity.
              </p>
            </div>

            {/* Section Heading Style */}
            <div className="mb-8 p-6 bg-bg-elevated rounded-card border border-border-subtle">
              <h4 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-3">
                Section Heading
              </h4>
              <h3
                className="text-2xl md:text-3xl font-display text-text-primary mb-3"
                style={{ fontWeight: 600 }}
              >
                Section Title with Purpose
              </h3>
              <p className="text-base text-text-secondary leading-relaxed font-sans">
                Clear hierarchy helps users navigate content. Use medium weight
                display fonts for section breaks and content organization.
              </p>
            </div>

            {/* Card Heading Style */}
            <div className="mb-8 p-6 bg-bg-elevated rounded-card border border-border-subtle">
              <h4 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-3">
                Card Heading
              </h4>
              <h3
                className="text-xl font-display text-text-primary mb-3"
                style={{ fontWeight: 500 }}
              >
                Card Component Title
              </h3>
              <p className="text-sm text-text-secondary leading-relaxed font-sans">
                Compact headings work well in constrained spaces. Use lighter
                weights for cards, sidebars, and nested content.
              </p>
            </div>

            {/* Body Text Variations */}
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="p-6 bg-bg-elevated rounded-card border border-border-subtle">
                <h4 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-3">
                  Primary Body Text
                </h4>
                <p className="text-base text-text-primary leading-relaxed font-sans">
                  This is the main body text style. It's designed for optimal
                  readability with comfortable line height and clear contrast.
                  Perfect for articles, descriptions, and primary content.
                </p>
              </div>

              <div className="p-6 bg-bg-elevated rounded-card border border-border-subtle">
                <h4 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-3">
                  Secondary Body Text
                </h4>
                <p className="text-sm text-text-secondary leading-relaxed font-sans">
                  Secondary text uses a smaller size and muted color. Ideal for
                  captions, metadata, supporting information, and content that
                  should be present but not prominent.
                </p>
              </div>
            </div>

            {/* Usage Guidelines */}
            <div className="mt-8 p-4 bg-bg-subtle rounded-lg border border-border-subtle">
              <h4 className="text-sm font-medium text-text-primary mb-2">
                Usage Guidelines
              </h4>
              <ul className="text-sm text-text-secondary space-y-1 font-sans">
                <li>
                  • Use{" "}
                  <span className="font-display font-medium">Dominique</span>{" "}
                  for headings and display text
                </li>
                <li>
                  • Use <span className="font-sans font-medium">Figtree</span>{" "}
                  for body text and UI elements
                </li>
                <li>
                  • Reserve heavier weights (700-900) for hero sections and
                  major headings
                </li>
                <li>
                  • Use medium weights (500-600) for section headings and card
                  titles
                </li>
                <li>
                  • Apply lighter weights (400-500) for secondary headings and
                  accents
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Colors Section */}
        <section className="mb-20">
          <h2
            className="text-3xl font-display text-text-primary mb-8 pb-2 border-b border-border-default"
            style={{ fontWeight: 600 }}
          >
            Colors
          </h2>

          {renderColorRow("Primary (Red/Brown)", colors.primary)}
          {renderColorRow("Secondary (Blue/Green)", colors.secondary)}
          {renderColorRow("Neutral (Grays)", colors.neutral)}

          {/* Semantic Colors */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8">
            <div>
              <div
                className="h-20 rounded-lg shadow-sm border border-border-subtle"
                style={{ backgroundColor: colors.accent }}
              />
              <p className="text-sm text-text-secondary mt-2">Accent</p>
              <p className="text-xs text-text-muted">{colors.accent}</p>
            </div>
            <div>
              <div
                className="h-20 rounded-lg shadow-sm border border-border-subtle"
                style={{ backgroundColor: colors.muted }}
              />
              <p className="text-sm text-text-secondary mt-2">Muted</p>
              <p className="text-xs text-text-muted">{colors.muted}</p>
            </div>
          </div>
        </section>

        {/* Components Section */}
        <section className="mb-20">
          <h2
            className="text-3xl font-display text-text-primary mb-8 pb-2 border-b border-border-default"
            style={{ fontWeight: 600 }}
          >
            Components
          </h2>

          {/* Buttons */}
          <div className="mb-12">
            <h3
              className="text-xl font-display text-text-primary mb-4"
              style={{ fontWeight: 500 }}
            >
              Buttons (Token-Based)
            </h3>
            <div className="flex flex-wrap gap-4">
              <button className="px-6 py-3 bg-button-primary-surface text-button-primary-text rounded-button font-medium hover:bg-button-primary-surface-hover transition-colors">
                Primary Button
              </button>
              <button className="px-6 py-3 bg-button-secondary-surface text-button-secondary-text rounded-button font-medium hover:bg-button-secondary-surface-hover transition-colors">
                Secondary Button
              </button>
              <button className="px-6 py-3 bg-button-neutral-surface text-button-neutral-text rounded-button font-medium hover:bg-button-neutral-surface-hover transition-colors">
                Neutral Button
              </button>
              <button className="px-6 py-3 bg-button-outline-surface border-2 border-button-outline-border text-button-outline-text rounded-button font-medium hover:bg-button-outline-surface-hover hover:text-button-outline-text-hover transition-colors">
                Outline Button
              </button>
            </div>
          </div>

          {/* Form Elements */}
          <div className="mb-12">
            <h3
              className="text-xl font-display text-text-primary mb-4"
              style={{ fontWeight: 500 }}
            >
              Form Elements (Token-Based)
            </h3>
            <div className="max-w-md space-y-4">
              <div>
                <label className="block text-sm font-medium text-label-text mb-1">
                  Text Input
                </label>
                <input
                  type="text"
                  placeholder="Enter text..."
                  className="w-full px-4 py-3 bg-input-surface border border-input-border rounded-input text-input-text placeholder:text-input-text-placeholder focus:outline-none focus:ring-2 focus:ring-input-border-focus focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-label-text mb-1">
                  Textarea
                </label>
                <textarea
                  rows={3}
                  placeholder="Enter longer text..."
                  className="w-full px-4 py-3 bg-input-surface border border-input-border rounded-input text-input-text placeholder:text-input-text-placeholder focus:outline-none focus:ring-2 focus:ring-input-border-focus focus:border-transparent resize-y"
                />
              </div>
            </div>
          </div>

          {/* Cards */}
          <div className="mb-12">
            <h3
              className="text-xl font-display text-text-primary mb-4"
              style={{ fontWeight: 500 }}
            >
              Cards (Token-Based)
            </h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-card-surface rounded-card p-6 shadow-sm border border-card-border">
                <h4
                  className="text-lg font-display text-card-text mb-2"
                  style={{ fontWeight: 500 }}
                >
                  Standard Card
                </h4>
                <p className="text-card-text text-sm leading-relaxed opacity-70">
                  Uses card-surface, card-border, and card-text tokens for a
                  clean appearance.
                </p>
              </div>
              <div className="bg-card-surface-inverse rounded-card p-6">
                <h4
                  className="text-lg font-display text-card-text-inverse mb-2"
                  style={{ fontWeight: 500 }}
                >
                  Inverse Card
                </h4>
                <p className="text-card-text-inverse-muted text-sm leading-relaxed">
                  Uses card-surface-inverse and card-text-inverse tokens for
                  contrast.
                </p>
              </div>
              <div className="bg-card-surface-tonal rounded-card p-6 border border-card-border-tonal">
                <h4
                  className="text-lg font-display text-card-text-tonal mb-2"
                  style={{ fontWeight: 500 }}
                >
                  Tonal Card
                </h4>
                <p className="text-card-text-tonal-muted text-sm leading-relaxed">
                  Uses card-surface-tonal and card-border-tonal for secondary
                  emphasis.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Design Tokens Reference */}
        <section className="mb-20">
          <h2
            className="text-3xl font-display text-text-primary mb-8 pb-2 border-b border-border-default"
            style={{ fontWeight: 600 }}
          >
            Design Tokens Reference
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 text-sm">
            <div>
              <h3
                className="text-lg font-display text-text-primary mb-3"
                style={{ fontWeight: 500 }}
              >
                Button Tokens
              </h3>
              <ul className="space-y-1 text-text-secondary font-mono text-xs">
                <li>--button-primary-surface</li>
                <li>--button-primary-surface-hover</li>
                <li>--button-primary-text</li>
                <li>--button-secondary-surface</li>
                <li>--button-neutral-surface</li>
                <li>--button-outline-border</li>
                <li>--button-outline-text-hover</li>
              </ul>
            </div>
            <div>
              <h3
                className="text-lg font-display text-text-primary mb-3"
                style={{ fontWeight: 500 }}
              >
                Form Tokens
              </h3>
              <ul className="space-y-1 text-text-secondary font-mono text-xs">
                <li>--input-surface</li>
                <li>--input-border</li>
                <li>--input-border-focus</li>
                <li>--input-text</li>
                <li>--input-text-placeholder</li>
                <li>--label-text</li>
              </ul>
            </div>
            <div>
              <h3
                className="text-lg font-display text-text-primary mb-3"
                style={{ fontWeight: 500 }}
              >
                Card Tokens
              </h3>
              <ul className="space-y-1 text-text-secondary font-mono text-xs">
                <li>--card-surface</li>
                <li>--card-surface-inverse</li>
                <li>--card-surface-tonal</li>
                <li>--card-border</li>
                <li>--card-text</li>
                <li>--card-text-inverse</li>
                <li>--card-text-tonal</li>
              </ul>
            </div>
            <div>
              <h3
                className="text-lg font-display text-text-primary mb-3"
                style={{ fontWeight: 500 }}
              >
                Border Tokens
              </h3>
              <ul className="space-y-1 text-text-secondary font-mono text-xs">
                <li>--border-default</li>
                <li>--border-subtle</li>
                <li>--border-strong</li>
                <li>--border-inverse</li>
                <li>--border-focus</li>
              </ul>
            </div>
            <div>
              <h3
                className="text-lg font-display text-text-primary mb-3"
                style={{ fontWeight: 500 }}
              >
                Text Color Tokens
              </h3>
              <ul className="space-y-1 text-text-secondary font-mono text-xs">
                <li>--text-primary</li>
                <li>--text-secondary</li>
                <li>--text-tertiary</li>
                <li>--text-muted</li>
                <li>--text-inverse</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Usage Notes */}
        <section>
          <h2
            className="text-3xl font-display text-text-primary mb-8 pb-2 border-b border-border-default"
            style={{ fontWeight: 600 }}
          >
            Usage Notes
          </h2>
          <div className="prose prose-neutral dark:prose-invert max-w-none">
            <ul className="space-y-2 text-text-secondary">
              <li>
                <strong className="text-text-primary">Fonts:</strong> Use{" "}
                <code>font-sans</code> (Figtree) for UI text,{" "}
                <code>font-display</code> for headlines/accents,{" "}
                <code>font-mono</code> for code
              </li>
              <li>
                <strong className="text-text-primary">Colors:</strong> Use
                primary for brand elements, secondary for accents, neutral for
                structure
              </li>
              <li>
                <strong className="text-text-primary">Spacing:</strong> Default
                Tailwind spacing scale applies
              </li>
              <li>
                <strong className="text-text-primary">Border Radius:</strong>{" "}
                Use <code>rounded-lg</code> for buttons, <code>rounded-xl</code>{" "}
                for cards
              </li>
              <li>
                <strong className="text-text-primary">Accessibility:</strong>{" "}
                All text meets WCAG 2.2 AA contrast (4.5:1)
              </li>
            </ul>
          </div>
        </section>
      </div>
    </main>
  );
}
