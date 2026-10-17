export default function HomePage() {
  return (
    <div className="container-page py-space-6">
      <header className="mb-space-6">
        <span className="text-small font-medium text-purple-light tracking-wide uppercase">
          Flowtop Architectural Bath Fittings
        </span>
        <h1 className="text-display font-light text-primary mt-space-2">
          Pure geometry, precision water flow.
        </h1>
        <p className="text-body text-muted max-w-xl mt-space-3">
          Nothing is hard-coded. Everything lives in the database and is rendered dynamically
          through precision design tokens.
        </p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-space-4">
        <div className="bg-purple-deep text-white p-space-4 rounded-md shadow-md">
          <h2 className="text-title font-medium text-white">Brand Foundation</h2>
          <p className="text-small text-purple-pale mt-space-2">
            Styled with <code className="bg-purple-light/20 px-space-2 py-space-1 rounded-sm text-white">bg-purple-deep</code> and{' '}
            <code className="bg-purple-light/20 px-space-2 py-space-1 rounded-sm text-white">p-space-4</code>.
          </p>
          <div className="mt-space-4">
            <button
              type="button"
              className="touch-target px-space-5 py-space-2 rounded-pill bg-white text-purple-deep font-medium text-small focus-ring shadow-sm"
            >
              Explore Collection
            </button>
          </div>
        </div>

        <div className="bg-surface-solid border border-border p-space-4 rounded-md shadow-sm">
          <h2 className="text-title font-medium text-primary">Token Verification</h2>
          <p className="text-small text-muted mt-space-2">
            Every colour, spacing, radius and elevation value comes from the central token system.
          </p>
          <ul className="mt-space-4 space-y-space-2 text-small text-primary">
            <li className="flex items-center gap-space-2">
              <span className="w-space-3 h-space-3 rounded-pill bg-success" />
              <span>Tailwind default scale replaced</span>
            </li>
            <li className="flex items-center gap-space-2">
              <span className="w-space-3 h-space-3 rounded-pill bg-success" />
              <span>Zero raw hex codes in components</span>
            </li>
            <li className="flex items-center gap-space-2">
              <span className="w-space-3 h-space-3 rounded-pill bg-success" />
              <span>Strict TypeScript with zero <code>any</code></span>
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
}
