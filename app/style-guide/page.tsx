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
      <h3 className="text-sm font-medium text-neutral-600 mb-3 uppercase tracking-wider">
        {name}
      </h3>
      <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
        {Object.entries(shades).map(([shade, color]) => (
          <div key={shade} className="group">
            <div
              className="h-16 rounded-lg shadow-sm border border-neutral-200"
              style={{ backgroundColor: color }}
            />
            <p className="text-xs text-neutral-500 mt-1 text-center">{shade}</p>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <main className="min-h-screen bg-neutral-100">
      <div className="max-w-6xl mx-auto px-6 py-16">
        <header className="mb-16 pb-8 border-b border-neutral-300">
          <p className="text-sm font-medium text-neutral-500 uppercase tracking-wider mb-2">
            Antibroadcasting Inc.
          </p>
          <h1 className="text-5xl font-bold text-primary-950 mb-4">
            Style Guide
          </h1>
          <p className="text-lg text-neutral-600">
            Typography, colors, and components reference
          </p>
        </header>

        {/* Typography Section */}
        <section className="mb-20">
          <h2 className="text-2xl font-bold text-primary-950 mb-8 pb-2 border-b border-neutral-300">
            Typography
          </h2>

          {/* Geist Sans */}
          <div className="mb-12">
            <h3 className="text-sm font-medium text-neutral-500 uppercase tracking-wider mb-4">
              Geist Sans — Primary UI Font (var(--font-sans))
            </h3>
            <div className="space-y-4">
              <div className="flex items-baseline gap-4">
                <span className="text-sm text-neutral-500 w-16">H1</span>
                <h1 className="text-5xl font-bold text-primary-950">
                  Heading One
                </h1>
              </div>
              <div className="flex items-baseline gap-4">
                <span className="text-sm text-neutral-500 w-16">H2</span>
                <h2 className="text-4xl font-bold text-primary-950">
                  Heading Two
                </h2>
              </div>
              <div className="flex items-baseline gap-4">
                <span className="text-sm text-neutral-500 w-16">H3</span>
                <h3 className="text-3xl font-semibold text-primary-950">
                  Heading Three
                </h3>
              </div>
              <div className="flex items-baseline gap-4">
                <span className="text-sm text-neutral-500 w-16">Body</span>
                <p className="text-base text-neutral-700 leading-relaxed">
                  The quick brown fox jumps over the lazy dog. Pack my box with
                  five dozen liquor jugs.
                </p>
              </div>
              <div className="flex items-baseline gap-4">
                <span className="text-sm text-neutral-500 w-16">Small</span>
                <p className="text-sm text-neutral-500">
                  Secondary text, captions, and metadata information.
                </p>
              </div>
            </div>
          </div>

          {/* Dominique Variable Font */}
          <div className="mb-12">
            <h3 className="text-sm font-medium text-neutral-500 uppercase tracking-wider mb-4">
              Dominique — Display Font (var(--font-display))
            </h3>
            <div className="space-y-4 font-display">
              <div className="flex items-baseline gap-4">
                <span className="text-sm text-neutral-500 w-16 font-sans">
                  900
                </span>
                <p className="text-4xl text-primary-950" style={{ fontWeight: 900 }}>
                  Heavy Weight Display
                </p>
              </div>
              <div className="flex items-baseline gap-4">
                <span className="text-sm text-neutral-500 w-16 font-sans">
                  700
                </span>
                <p className="text-3xl text-primary-950" style={{ fontWeight: 700 }}>
                  Bold Display Text
                </p>
              </div>
              <div className="flex items-baseline gap-4">
                <span className="text-sm text-neutral-500 w-16 font-sans">
                  500
                </span>
                <p className="text-2xl text-primary-950" style={{ fontWeight: 500 }}>
                  Medium Weight Display
                </p>
              </div>
              <div className="flex items-baseline gap-4">
                <span className="text-sm text-neutral-500 w-16 font-sans">
                  400
                </span>
                <p className="text-xl text-primary-950" style={{ fontWeight: 400 }}>
                  Regular Display Text
                </p>
              </div>
            </div>
            <p className="text-sm text-neutral-500 mt-4 font-sans">
              Variable font — supports weights 100-900 (or full range depending
              on font capabilities)
            </p>
          </div>

          {/* Geist Mono */}
          <div className="mb-12">
            <h3 className="text-sm font-medium text-neutral-500 uppercase tracking-wider mb-4">
              Geist Mono — Monospace Font (var(--font-mono))
            </h3>
            <div className="space-y-4 font-mono">
              <div className="flex items-baseline gap-4">
                <span className="text-sm text-neutral-500">Code Block</span>
                <code className="px-3 py-2 bg-neutral-200 rounded text-sm text-primary-950">
                  const fontWeight = 400;
                </code>
              </div>
              <p className="text-sm text-neutral-600 leading-relaxed">
                Monospace font for code, technical content, and data display.
                Excellent readability at small sizes.
              </p>
            </div>
          </div>
        </section>

        {/* Colors Section */}
        <section className="mb-20">
          <h2 className="text-2xl font-bold text-primary-950 mb-8 pb-2 border-b border-neutral-300">
            Colors
          </h2>

          {renderColorRow("Primary (Red/Brown)", colors.primary)}
          {renderColorRow("Secondary (Blue/Green)", colors.secondary)}
          {renderColorRow("Neutral (Grays)", colors.neutral)}

          {/* Semantic Colors */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8">
            <div>
              <div
                className="h-20 rounded-lg shadow-sm border border-neutral-200"
                style={{ backgroundColor: colors.accent }}
              />
              <p className="text-sm text-neutral-600 mt-2">Accent</p>
              <p className="text-xs text-neutral-500">{colors.accent}</p>
            </div>
            <div>
              <div
                className="h-20 rounded-lg shadow-sm border border-neutral-200"
                style={{ backgroundColor: colors.muted }}
              />
              <p className="text-sm text-neutral-600 mt-2">Muted</p>
              <p className="text-xs text-neutral-500">{colors.muted}</p>
            </div>
          </div>
        </section>

        {/* Components Section */}
        <section className="mb-20">
          <h2 className="text-2xl font-bold text-primary-950 mb-8 pb-2 border-b border-neutral-300">
            Components
          </h2>

          {/* Buttons */}
          <div className="mb-12">
            <h3 className="text-sm font-medium text-neutral-500 uppercase tracking-wider mb-4">
              Buttons
            </h3>
            <div className="flex flex-wrap gap-4">
              <button className="px-6 py-3 bg-primary-950 text-white rounded-lg font-medium hover:bg-primary-800 transition-colors">
                Primary Button
              </button>
              <button className="px-6 py-3 bg-secondary-600 text-white rounded-lg font-medium hover:bg-secondary-700 transition-colors">
                Secondary Button
              </button>
              <button className="px-6 py-3 bg-neutral-200 text-primary-950 rounded-lg font-medium hover:bg-neutral-300 transition-colors">
                Neutral Button
              </button>
              <button className="px-6 py-3 border-2 border-primary-950 text-primary-950 rounded-lg font-medium hover:bg-primary-950 hover:text-white transition-colors">
                Outline Button
              </button>
            </div>
          </div>

          {/* Form Elements */}
          <div className="mb-12">
            <h3 className="text-sm font-medium text-neutral-500 uppercase tracking-wider mb-4">
              Form Elements
            </h3>
            <div className="max-w-md space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Text Input
                </label>
                <input
                  type="text"
                  placeholder="Enter text..."
                  className="w-full px-4 py-3 bg-white border border-neutral-300 rounded-lg text-primary-950 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Textarea
                </label>
                <textarea
                  rows={3}
                  placeholder="Enter longer text..."
                  className="w-full px-4 py-3 bg-white border border-neutral-300 rounded-lg text-primary-950 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-y"
                />
              </div>
            </div>
          </div>

          {/* Cards */}
          <div className="mb-12">
            <h3 className="text-sm font-medium text-neutral-500 uppercase tracking-wider mb-4">
              Cards
            </h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-neutral-200">
                <h4 className="text-lg font-semibold text-primary-950 mb-2">
                  Standard Card
                </h4>
                <p className="text-neutral-600 text-sm leading-relaxed">
                  A clean card component with subtle shadow and border for
                  content separation.
                </p>
              </div>
              <div className="bg-primary-950 rounded-xl p-6">
                <h4 className="text-lg font-semibold text-white mb-2">
                  Inverse Card
                </h4>
                <p className="text-primary-200 text-sm leading-relaxed">
                  A card using the primary dark color for emphasis and contrast.
                </p>
              </div>
              <div className="bg-secondary-100 rounded-xl p-6 border border-secondary-200">
                <h4 className="text-lg font-semibold text-secondary-900 mb-2">
                  Tonal Card
                </h4>
                <p className="text-secondary-700 text-sm leading-relaxed">
                  A card using secondary color tones for a different visual
                  hierarchy.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Usage Notes */}
        <section>
          <h2 className="text-2xl font-bold text-primary-950 mb-8 pb-2 border-b border-neutral-300">
            Usage Notes
          </h2>
          <div className="prose prose-neutral max-w-none">
            <ul className="space-y-2 text-neutral-700">
              <li>
                <strong>Fonts:</strong> Use <code>font-sans</code> for UI text,{" "}
                <code>font-display</code> for headlines/accents,{" "}
                <code>font-mono</code> for code
              </li>
              <li>
                <strong>Colors:</strong> Use primary for brand elements,
                secondary for accents, neutral for structure
              </li>
              <li>
                <strong>Spacing:</strong> Default Tailwind spacing scale applies
              </li>
              <li>
                <strong>Border Radius:</strong> Use <code>rounded-lg</code> for
                buttons, <code>rounded-xl</code> for cards
              </li>
            </ul>
          </div>
        </section>
      </div>
    </main>
  );
}
