export function HomePage() {
  return (
    <main className="mx-auto max-w-2xl p-8" data-testid="home-page">
      <h1 className="text-3xl font-semibold">Welcome</h1>
      <p className="mt-2 text-slate-600">
        Scaffolded by the agenticai framework. Drive features with{' '}
        <code className="rounded bg-slate-200 px-1.5 py-0.5">/new-feature</code>.
      </p>
    </main>
  );
}
