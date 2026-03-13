import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { FileUpload } from "@/components/ui/FileUpload";

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
    accent: {
      base: "oklch(60% 0.35 12)",
      text: "oklch(50% 0.28 12)",
      surface: "oklch(95% 0.06 12)",
      border: "oklch(55% 0.32 12)",
    },
    muted: {
      base: "oklch(80% 0.03 60)",
      text: "oklch(32% 0.04 60)",
      surface: "oklch(94% 0.02 60)",
      border: "oklch(70% 0.04 60)",
    },
    success: {
      base: "oklch(45% 0.2 145)",
      text: "oklch(40% 0.18 145)",
      surface: "oklch(95% 0.05 145)",
      border: "oklch(45% 0.2 145)",
    },
    error: {
      base: "oklch(50% 0.22 12)",
      text: "oklch(55% 0.2 12)",
      surface: "oklch(95% 0.03 12)",
      border: "oklch(50% 0.22 12)",
    },
    warning: {
      base: "oklch(60% 0.15 60)",
      text: "oklch(55% 0.15 60)",
      surface: "oklch(95% 0.04 60)",
      border: "oklch(60% 0.15 60)",
    },
    destructive: {
      base: "oklch(45% 0.25 12)",
      text: "oklch(50% 0.2 12)",
      surface: "oklch(92% 0.04 12)",
      border: "oklch(40% 0.28 12)",
    },
    // Dark mode variations for demonstration
    darkMode: {
      accent: {
        base: "oklch(75% 0.22 12)",
        text: "oklch(90% 0.18 12)",
        surface: "oklch(22% 0.06 12)",
        border: "oklch(75% 0.22 12)",
      },
      muted: {
        base: "oklch(70% 0.015 60)",
        text: "oklch(80% 0.025 60)",
        surface: "oklch(22% 0.015 60)",
        border: "oklch(70% 0.015 60)",
      },
      success: {
        base: "oklch(75% 0.15 145)",
        text: "oklch(90% 0.12 145)",
        surface: "oklch(22% 0.06 145)",
        border: "oklch(75% 0.15 145)",
      },
      error: {
        base: "oklch(75% 0.18 12)",
        text: "oklch(90% 0.15 12)",
        surface: "oklch(22% 0.06 12)",
        border: "oklch(75% 0.18 12)",
      },
      warning: {
        base: "oklch(80% 0.12 60)",
        text: "oklch(90% 0.1 60)",
        surface: "oklch(22% 0.04 60)",
        border: "oklch(80% 0.12 60)",
      },
      destructive: {
        base: "oklch(75% 0.18 12)",
        text: "oklch(90% 0.12 12)",
        surface: "oklch(20% 0.05 12)",
        border: "oklch(75% 0.18 12)",
      },
    },
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

          {/* State Color Swatches - Compact Grid */}
          <div className="mb-12">
            <h3
              className="text-xl font-display text-text-primary mb-4"
              style={{ fontWeight: 500 }}
            >
              State Colors (Full Variation Sets)
            </h3>

            {Object.entries({
              accent: colors.accent,
              muted: colors.muted,
              success: colors.success,
              error: colors.error,
              warning: colors.warning,
              destructive: colors.destructive,
            }).map(([name, variations]) => (
              <div key={name} className="mb-6">
                <h4 className="text-sm font-medium text-text-muted mb-3 capitalize">
                  {name}
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <div
                      className="h-16 rounded-lg shadow-sm border border-border-subtle"
                      style={{ backgroundColor: variations.base }}
                    />
                    <p className="text-xs text-text-secondary mt-1">Base</p>
                    <p className="text-xs text-text-muted font-mono">
                      {variations.base}
                    </p>
                  </div>
                  <div>
                    <div
                      className="h-16 rounded-lg shadow-sm border border-border-subtle"
                      style={{ backgroundColor: variations.surface }}
                    />
                    <p className="text-xs text-text-secondary mt-1">Surface</p>
                    <p className="text-xs text-text-muted font-mono">
                      {variations.surface}
                    </p>
                  </div>
                  <div>
                    <div
                      className="h-16 rounded-lg shadow-sm border border-border-subtle flex items-center justify-center"
                      style={{
                        backgroundColor: variations.surface,
                        borderColor: variations.border,
                        borderWidth: "2px",
                      }}
                    >
                      <span
                        className="text-sm font-medium"
                        style={{ color: variations.text }}
                      >
                        Text
                      </span>
                    </div>
                    <p className="text-xs text-text-secondary mt-1">
                      Text+Border
                    </p>
                    <p className="text-xs text-text-muted font-mono">
                      {variations.text}
                    </p>
                  </div>
                  <div>
                    <div
                      className="h-16 rounded-lg shadow-sm border-2 flex items-center justify-center"
                      style={{
                        backgroundColor: "var(--bg-base)",
                        borderColor: variations.border,
                      }}
                    >
                      <span
                        className="text-sm font-medium"
                        style={{ color: variations.base }}
                      >
                        Border
                      </span>
                    </div>
                    <p className="text-xs text-text-secondary mt-1">
                      Border Only
                    </p>
                    <p className="text-xs text-text-muted font-mono">
                      {variations.border}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* State Color Usage Examples */}
          <div className="mb-12">
            <h3
              className="text-xl font-display text-text-primary mb-4"
              style={{ fontWeight: 500 }}
            >
              Usage Examples
            </h3>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Success Example */}
              <div className="bg-color-bg-success rounded-card p-4 border border-color-success">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-color-success"></div>
                  <h5 className="text-sm font-medium text-color-success-text">
                    Success
                  </h5>
                </div>
                <p className="text-xs text-color-success-text">
                  Operation completed successfully
                </p>
              </div>

              {/* Error Example */}
              <div className="bg-color-bg-error rounded-card p-4 border border-color-error">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-color-error"></div>
                  <h5 className="text-sm font-medium text-color-error-text">
                    Error
                  </h5>
                </div>
                <p className="text-xs text-color-error-text">
                  Validation failed
                </p>
              </div>

              {/* Warning Example */}
              <div className="bg-color-bg-warning rounded-card p-4 border border-color-warning">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-color-warning"></div>
                  <h5 className="text-sm font-medium text-color-warning-text">
                    Warning
                  </h5>
                </div>
                <p className="text-xs text-color-warning-text">
                  Action required
                </p>
              </div>

              {/* Accent Example */}
              <div className="bg-color-accent-surface rounded-card p-4 border border-color-accent-border">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-color-accent"></div>
                  <h5 className="text-sm font-medium text-color-accent-text">
                    Accent Feature
                  </h5>
                </div>
                <p className="text-xs text-color-accent-text">
                  Highlighted feature or CTA
                </p>
              </div>

              {/* Muted Example */}
              <div className="bg-color-muted-surface rounded-card p-4 border border-color-muted-border">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-color-muted"></div>
                  <h5 className="text-sm font-medium text-color-muted-text">
                    Muted Element
                  </h5>
                </div>
                <p className="text-xs text-color-muted-text">
                  Subtle information
                </p>
              </div>

              {/* Destructive Example */}
              <div className="bg-color-bg-destructive rounded-card p-4 border border-color-destructive">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-color-destructive"></div>
                  <h5 className="text-sm font-medium text-color-destructive-text">
                    Destructive Action
                  </h5>
                </div>
                <p className="text-xs text-color-destructive-text">
                  Permanent deletion
                </p>
              </div>
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
              Buttons (WCAG 2.2 AA Compliant)
            </h3>

            {/* Button Variants */}
            <div className="mb-8">
              <h4 className="text-sm font-medium text-text-muted mb-3 uppercase tracking-wider">
                Button Variants
              </h4>
              <div className="flex flex-wrap gap-4">
                <Button variant="primary">Primary Button</Button>
                <Button variant="secondary">Secondary Button</Button>
                <Button variant="neutral">Neutral Button</Button>
                <Button variant="outline">Outline Button</Button>
                <Button variant="ghost">Ghost Button</Button>
                <Button variant="link">Link Button</Button>
                <Button variant="destructive">Destructive Button</Button>
              </div>
            </div>

            {/* Button Sizes */}
            <div className="mb-8">
              <h4 className="text-sm font-medium text-text-muted mb-3 uppercase tracking-wider">
                Button Sizes
              </h4>
              <div className="flex flex-wrap items-center gap-4">
                <Button variant="primary" size="sm">
                  Small
                </Button>
                <Button variant="primary" size="md">
                  Medium
                </Button>
                <Button variant="primary" size="lg">
                  Large
                </Button>
                <Button variant="primary" size="icon">
                  🚀
                </Button>
              </div>
            </div>

            {/* States */}
            <div className="mb-8">
              <h4 className="text-sm font-medium text-text-muted mb-3 uppercase tracking-wider">
                Button States
              </h4>
              <div className="flex flex-wrap gap-4">
                <Button variant="primary">Default</Button>
                <Button variant="primary" disabled>
                  Disabled
                </Button>
                <Button variant="secondary" disabled>
                  Disabled
                </Button>
                <Button variant="outline" disabled>
                  Disabled
                </Button>
              </div>
            </div>

            {/* Usage Example */}
            <div className="bg-bg-elevated rounded-card p-4 border border-border-subtle">
              <h4 className="text-sm font-medium text-text-primary mb-2">
                Usage Example
              </h4>
              <pre className="text-xs text-text-secondary overflow-x-auto font-mono">
                {`import { Button } from "@/components/ui/Button";

// Basic usage
<Button>Click me</Button>

// With variant and size
<Button variant="primary" size="lg">Large Primary</Button>

// Ghost and link variants
<Button variant="ghost">Ghost Button</Button>
<Button variant="link">Link Button</Button>

// Disabled state
<Button disabled>Disabled</Button>`}
              </pre>
            </div>
          </div>

          {/* Form Elements */}
          <div className="mb-12">
            <h3
              className="text-xl font-display text-text-primary mb-4"
              style={{ fontWeight: 500 }}
            >
              Form Elements (WCAG 2.2 AA Compliant)
            </h3>

            {/* Input Components */}
            <div className="mb-8">
              <h4 className="text-sm font-medium text-text-muted mb-3 uppercase tracking-wider">
                Input Components
              </h4>
              <div className="max-w-md space-y-4">
                <Input label="Text Input" placeholder="Enter text..." />
                <Input
                  label="Email Input"
                  type="email"
                  placeholder="email@example.com"
                  required
                />
                <Input
                  label="Number Input"
                  type="number"
                  placeholder="123"
                  error="This field has an error"
                />
              </div>
            </div>

            {/* Select Component */}
            <div className="mb-8">
              <h4 className="text-sm font-medium text-text-muted mb-3 uppercase tracking-wider">
                Select Component
              </h4>
              <div className="max-w-md space-y-4">
                <Select
                  label="Choose an option"
                  placeholder="Select an option..."
                  options={[
                    { value: "option1", label: "Option 1" },
                    { value: "option2", label: "Option 2" },
                    { value: "option3", label: "Option 3" },
                  ]}
                />
                <Select
                  label="Required Select"
                  placeholder="Please select..."
                  options={[
                    { value: "a", label: "Choice A" },
                    { value: "b", label: "Choice B" },
                  ]}
                  required
                />
              </div>
            </div>

            {/* Textarea Component */}
            <div className="mb-8">
              <h4 className="text-sm font-medium text-text-muted mb-3 uppercase tracking-wider">
                Textarea Component
              </h4>
              <div className="max-w-md space-y-4">
                <Textarea
                  label="Message"
                  placeholder="Enter your message..."
                  rows={4}
                />
                <Textarea
                  label="Project Description"
                  placeholder="Tell us about your project..."
                  rows={3}
                  required
                  error="Please provide at least 10 characters"
                />
              </div>
            </div>

            {/* File Upload Component */}
            <div className="mb-8">
              <h4 className="text-sm font-medium text-text-muted mb-3 uppercase tracking-wider">
                File Upload Component
              </h4>
              <div className="max-w-md space-y-4">
                <FileUpload
                  label="Upload Files"
                  accept="image/*,.pdf"
                  maxSize={5 * 1024 * 1024} // 5MB
                  multiple
                  maxFiles={3}
                />
                <FileUpload
                  label="Artwork File"
                  accept=".ai,.psd,.pdf,.png,.jpg"
                  required
                />
              </div>
            </div>

            {/* Error States - Explicit Examples */}
            <div className="mb-8">
              <h4 className="text-sm font-medium text-text-muted mb-3 uppercase tracking-wider">
                Error States (for testing focus vs error distinction)
              </h4>
              <div className="max-w-md space-y-4 p-4 bg-bg-subtle rounded-card border border-border-subtle">
                <p className="text-xs text-text-secondary mb-2">
                  Focus uses primary ring, Error uses red border
                </p>
                <Input
                  label="Normal Focus State"
                  placeholder="Click to see focus ring..."
                />
                <Input
                  label="Error State"
                  placeholder="This has an error"
                  error="This field has an error message"
                />
                <Select
                  label="Select with Error"
                  placeholder="Choose..."
                  options={[
                    { value: "a", label: "Option A" },
                    { value: "b", label: "Option B" },
                  ]}
                  error="Please select an option"
                />
                <Textarea
                  label="Textarea with Error"
                  placeholder="Error state example..."
                  rows={3}
                  error="Please provide more details"
                />
              </div>
            </div>

            {/* Usage Example */}
            <div className="bg-bg-elevated rounded-card p-4 border border-border-subtle">
              <h4 className="text-sm font-medium text-text-primary mb-2">
                Usage Example
              </h4>
              <pre className="text-xs text-text-secondary overflow-x-auto font-mono">
                {`import { Input, Select, Textarea, FileUpload } from "@/components/ui";

// Input components
<Input label="Name" required />
<Input label="Email" type="email" error="Invalid email" />

// Select component
<Select 
  label="Country"
  options={[
    { value: "us", label: "United States" },
    { value: "ca", label: "Canada" }
  ]}
  placeholder="Select country..."
/>

// Textarea component
<Textarea 
  label="Message"
  placeholder="Enter your message..."
  rows={4}
  required
/>

// File upload component
<FileUpload
  label="Upload files"
  accept="image/*,.pdf"
  multiple
  maxSize={10 * 1024 * 1024}
/>`}
              </pre>
            </div>
          </div>

          {/* Complete Form Demo */}
          <div className="mb-12">
            <h3
              className="text-xl font-display text-text-primary mb-4"
              style={{ fontWeight: 500 }}
            >
              Complete Form Demo
            </h3>
            <div className="bg-bg-elevated rounded-card p-6 border border-border-subtle">
              <p className="text-sm text-text-secondary mb-4">
                Full quote form using all form components with validation and
                file upload.
              </p>

              {/* Import QuoteForm for demo */}
              <div className="space-y-4">
                <Input label="Name" placeholder="Your name" required />
                <Input
                  type="email"
                  label="Email"
                  placeholder="your@email.com"
                  required
                />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Input
                    type="number"
                    label="Quantity"
                    placeholder="100"
                    min={1}
                    required
                  />
                  <Input
                    type="number"
                    label="Colors"
                    placeholder="2"
                    min={1}
                    max={8}
                  />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Select
                    label="Garment Type"
                    placeholder="Select garment..."
                    options={[
                      { value: "t-shirt", label: "T-Shirt" },
                      { value: "hoodie", label: "Hoodie" },
                      { value: "tank", label: "Tank Top" },
                    ]}
                  />
                  <Select
                    label="Timeline"
                    placeholder="Select timeline..."
                    options={[
                      { value: "standard", label: "Standard (7-10 days)" },
                      { value: "rush", label: "Rush (3-5 days)" },
                    ]}
                  />
                </div>
                <Textarea
                  label="Project Details"
                  placeholder="Tell us about your project..."
                  rows={4}
                  required
                />
                <FileUpload
                  label="Artwork Files"
                  accept=".ai,.psd,.pdf,.png,.jpg"
                  multiple
                  maxSize={10 * 1024 * 1024}
                />
                <div className="pt-4">
                  <Button variant="primary">Send Quote Request</Button>
                </div>
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
                <li>--button-primary-surface-active</li>
                <li>--button-primary-text</li>
                <li>--button-primary-border</li>
                <li>--button-secondary-surface</li>
                <li>--button-secondary-surface-hover</li>
                <li>--button-secondary-surface-active</li>
                <li>--button-secondary-text</li>
                <li>--button-secondary-border</li>
                <li>--button-neutral-surface</li>
                <li>--button-neutral-surface-hover</li>
                <li>--button-neutral-surface-active</li>
                <li>--button-neutral-text</li>
                <li>--button-neutral-border</li>
                <li>--button-outline-surface</li>
                <li>--button-outline-surface-hover</li>
                <li>--button-outline-surface-active</li>
                <li>--button-outline-text</li>
                <li>--button-outline-text-hover</li>
                <li>--button-outline-border</li>
                <li>--button-outline-border-hover</li>
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
                <li>--input-surface-focus</li>
                <li>--input-border</li>
                <li>--input-border-hover</li>
                <li>--input-border-focus</li>
                <li>--input-text</li>
                <li>--input-text-placeholder</li>
                <li>--input-ring-focus</li>
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
                <li>--card-border-tonal</li>
                <li>--card-text</li>
                <li>--card-text-inverse</li>
                <li>--card-text-inverse-muted</li>
                <li>--card-text-tonal</li>
                <li>--card-text-tonal-muted</li>
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
                <li>--text-accent</li>
              </ul>
            </div>
            <div>
              <h3
                className="text-lg font-display text-text-primary mb-3"
                style={{ fontWeight: 500 }}
              >
                Background Tokens
              </h3>
              <ul className="space-y-1 text-text-secondary font-mono text-xs">
                <li>--bg-base</li>
                <li>--bg-subtle</li>
                <li>--bg-elevated</li>
                <li>--bg-inset</li>
                <li>--bg-inverse</li>
              </ul>
            </div>
            <div>
              <h3
                className="text-lg font-display text-text-primary mb-3"
                style={{ fontWeight: 500 }}
              >
                Radius Tokens
              </h3>
              <ul className="space-y-1 text-text-secondary font-mono text-xs">
                <li>--radius-button</li>
                <li>--radius-card</li>
                <li>--radius-input</li>
              </ul>
            </div>
            <div>
              <h3
                className="text-lg font-display text-text-primary mb-3"
                style={{ fontWeight: 500 }}
              >
                Color Palette
              </h3>
              <ul className="space-y-1 text-text-secondary font-mono text-xs">
                <li>--color-primary-100 to -950</li>
                <li>--color-secondary-100 to -950</li>
                <li>--color-neutral-100 to -950</li>
                <li>--color-accent</li>
                <li>--color-muted</li>
              </ul>
            </div>
            <div>
              <h3
                className="text-lg font-display text-text-primary mb-3"
                style={{ fontWeight: 500 }}
              >
                State Color Tokens
              </h3>
              <ul className="space-y-1 text-text-secondary font-mono text-xs">
                <li>--color-accent</li>
                <li>--color-accent-text</li>
                <li>--color-accent-surface</li>
                <li>--color-accent-border</li>
                <li>--color-muted</li>
                <li>--color-muted-text</li>
                <li>--color-muted-surface</li>
                <li>--color-muted-border</li>
                <li>--color-destructive</li>
                <li>--color-destructive-text</li>
                <li>--color-destructive-surface</li>
                <li>--color-destructive-border</li>
                <li>--color-success</li>
                <li>--color-success-surface</li>
                <li>--color-success-text</li>
                <li>--color-success-border</li>
                <li>--color-error</li>
                <li>--color-error-surface</li>
                <li>--color-error-text</li>
                <li>--color-error-border</li>
                <li>--color-warning</li>
                <li>--color-warning-surface</li>
                <li>--color-warning-text</li>
                <li>--color-warning-border</li>
                <li>--color-destructive</li>
                <li>--color-destructive-surface</li>
                <li>--color-destructive-text</li>
                <li>--color-destructive-border</li>
                <li>--color-bg-success</li>
                <li>--color-bg-error</li>
                <li>--color-bg-warning</li>
                <li>--color-bg-destructive</li>
                <li>--color-bg-accent</li>
                <li>--color-bg-muted</li>
                <li>--color-text-success</li>
                <li>--color-text-error</li>
                <li>--color-text-warning</li>
                <li>--color-text-accent</li>
                <li>--color-text-muted</li>
                <li>--color-text-destructive</li>
              </ul>
            </div>
            <div>
              <h3
                className="text-lg font-display text-text-primary mb-3"
                style={{ fontWeight: 500 }}
              >
                Typography Tokens
              </h3>
              <ul className="space-y-1 text-text-secondary font-mono text-xs">
                <li>--font-sans (Figtree)</li>
                <li>--font-display (Dominique)</li>
                <li>--font-mono (Geist)</li>
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
