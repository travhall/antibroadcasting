import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { FileUpload } from "@/components/ui/FileUpload";

// ─── Token Definitions ──────────────────────────────────────────────────────
// All color data references CSS custom properties directly.
// Changing globals.css automatically flows through — no manual sync needed.

const PALETTE_SCALES = [
  {
    name: "Primary (hue 12 — --color-primary)",
    prefix: "--color-primary",
    shades: [100, 200, 300, 400, 500, 600, 700, 800, 900, 950],
  },
  {
    name: "Secondary (hue 195 — --color-secondary)",
    prefix: "--color-secondary",
    shades: [100, 200, 300, 400, 500, 600, 700, 800, 900, 950],
  },
  {
    name: "Neutral (hue 195 — near-achromatic)",
    prefix: "--color-neutral",
    shades: [100, 200, 300, 400, 500, 600, 700, 800, 900, 950],
  },
] as const;

const STATE_COLORS = [
  "accent",
  "muted",
  "success",
  "error",
  "warning",
  "destructive",
] as const;

type StateColor = (typeof STATE_COLORS)[number];

function stateTokens(name: StateColor) {
  return {
    base: `--color-${name}`,
    text: `--color-${name}-text`,
    surface: `--color-${name}-surface`,
    border: `--color-${name}-border`,
  };
}

function renderPaletteScale(scale: (typeof PALETTE_SCALES)[number]) {
  return (
    <div className="mb-8" key={scale.name}>
      <h3 className="text-sm font-medium text-text-muted mb-3 uppercase tracking-wider">
        {scale.name}
      </h3>
      <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
        {scale.shades.map((shade) => {
          const token = `${scale.prefix}-${shade}`;
          return (
            <div key={shade} className="group">
              <div
                className="h-16 rounded-lg shadow-sm border border-border-subtle"
                style={{ backgroundColor: `var(${token})` }}
                title={token}
              />
              <p className="text-xs text-text-secondary mt-1 text-center">
                {shade}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function StyleGuide() {
  return (

    <section>
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

          {PALETTE_SCALES.map(renderPaletteScale)}

          {/* State Color Swatches - Compact Grid */}
          <div className="mb-12">
            <h3
              className="text-xl font-display text-text-primary mb-4"
              style={{ fontWeight: 500 }}
            >
              State Colors (Full Variation Sets)
            </h3>

            {STATE_COLORS.map((name) => {
              const t = stateTokens(name);
              return (
                <div key={name} className="mb-6">
                  <h4 className="text-sm font-medium text-text-muted mb-3 capitalize">
                    {name}
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {/* Base */}
                    <div>
                      <div
                        className="h-16 rounded-lg shadow-sm border border-border-subtle"
                        style={{ backgroundColor: `var(${t.base})` }}
                        title={t.base}
                      />
                      <p className="text-xs text-text-secondary mt-1">Base</p>
                      <p className="text-xs text-text-muted font-mono">{t.base}</p>
                    </div>
                    {/* Surface */}
                    <div>
                      <div
                        className="h-16 rounded-lg shadow-sm border border-border-subtle"
                        style={{ backgroundColor: `var(${t.surface})` }}
                        title={t.surface}
                      />
                      <p className="text-xs text-text-secondary mt-1">Surface</p>
                      <p className="text-xs text-text-muted font-mono">{t.surface}</p>
                    </div>
                    {/* Text on surface */}
                    <div>
                      <div
                        className="h-16 rounded-lg shadow-sm flex items-center justify-center"
                        style={{
                          backgroundColor: `var(${t.surface})`,
                          borderColor: `var(${t.border})`,
                          borderWidth: "2px",
                        }}
                      >
                        <span
                          className="text-sm font-medium"
                          style={{ color: `var(${t.text})` }}
                        >
                          Text
                        </span>
                      </div>
                      <p className="text-xs text-text-secondary mt-1">Text + Border</p>
                      <p className="text-xs text-text-muted font-mono">{t.text}</p>
                    </div>
                    {/* Border on base */}
                    <div>
                      <div
                        className="h-16 rounded-lg shadow-sm border-2 flex items-center justify-center"
                        style={{
                          backgroundColor: "var(--bg-base)",
                          borderColor: `var(${t.border})`,
                        }}
                      >
                        <span
                          className="text-sm font-medium"
                          style={{ color: `var(${t.base})` }}
                        >
                          Border
                        </span>
                      </div>
                      <p className="text-xs text-text-secondary mt-1">Border Only</p>
                      <p className="text-xs text-text-muted font-mono">{t.border}</p>
                    </div>
                  </div>
                </div>
              );
            })}

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
              <div className="bg-bg-success rounded-card p-4 border border-border-success">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-success"></div>
                  <h5 className="text-sm font-medium text-text-success">
                    Success
                  </h5>
                </div>
                <p className="text-xs text-text-success">
                  Operation completed successfully
                </p>
              </div>

              {/* Error Example */}
              <div className="bg-bg-error rounded-card p-4 border border-border-error">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-error"></div>
                  <h5 className="text-sm font-medium text-text-error">
                    Error
                  </h5>
                </div>
                <p className="text-xs text-text-error">
                  Validation failed
                </p>
              </div>

              {/* Warning Example */}
              <div className="bg-bg-warning rounded-card p-4 border border-border-warning">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-warning"></div>
                  <h5 className="text-sm font-medium text-text-warning">
                    Warning
                  </h5>
                </div>
                <p className="text-xs text-text-warning">
                  Action required
                </p>
              </div>

              {/* Accent Example */}
              <div className="bg-bg-accent rounded-card p-4 border border-border-accent">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-accent"></div>
                  <h5 className="text-sm font-medium text-text-accent">
                    Accent Feature
                  </h5>
                </div>
                <p className="text-xs text-text-accent">
                  Highlighted feature or CTA
                </p>
              </div>

              {/* Muted Example */}
              <div className="bg-bg-muted rounded-card p-4 border border-border-muted">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-muted"></div>
                  <h5 className="text-sm font-medium text-text-muted">
                    Muted Element
                  </h5>
                </div>
                <p className="text-xs text-text-muted">
                  Subtle information
                </p>
              </div>

              {/* Destructive Example */}
              <div className="bg-bg-destructive rounded-card p-4 border border-border-destructive">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-destructive"></div>
                  <h5 className="text-sm font-medium text-text-destructive">
                    Destructive Action
                  </h5>
                </div>
                <p className="text-xs text-text-destructive">
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
                Use <code>rounded-button</code> for buttons, <code>rounded-card</code>{" "}
                for cards — both map to your design token values
              </li>
              <li>
                <strong className="text-text-primary">Accessibility:</strong>{" "}
                All text meets WCAG 2.2 AA contrast (4.5:1)
              </li>
            </ul>
          </div>
        </section>
      </div>
    </section>
  );
}
