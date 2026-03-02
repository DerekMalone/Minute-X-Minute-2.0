import Link from "next/link";

const features = [
  {
    title: "Practice Composer",
    description:
      "Sequence drills by time block and instantly see how your practice fits. The time counter keeps your plan honest.",
  },
  {
    title: "Drill Library",
    description:
      "Build a reusable library of drills for your program. Attach diagrams, notes, and tags — find anything in seconds.",
  },
  {
    title: "Team Management",
    description:
      "Invite players with a shareable link. Share the day's plan before they arrive on the field.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-mx-bg text-mx-text">
      <header className="border-b border-mx-stroke-soft">
        <nav
          className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4"
          aria-label="Main navigation"
        >
          <span className="text-lg font-bold tracking-tight">MinuteXMinute</span>
          <Link
            href="/login"
            className="text-sm font-medium text-mx-muted hover:text-mx-text transition-colors"
          >
            Sign in
          </Link>
        </nav>
      </header>

      <main>
        <section className="mx-auto max-w-5xl px-6 py-24 text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Practice plans built for lacrosse coaches
          </h1>
          <p className="mt-6 text-lg text-mx-muted mx-auto max-w-2xl">
            Build, run, and share practice sessions in minutes — organized by drill, time, and role.
            No spreadsheets. No confusion.
          </p>
          <div className="mt-10">
            <Link
              href="/signup"
              className="inline-flex h-12 items-center justify-center rounded-full bg-mx-green px-8 text-sm font-semibold text-black hover:opacity-90 transition-opacity"
            >
              Get started free
            </Link>
          </div>
        </section>

        <section
          className="mx-auto max-w-5xl px-6 pb-24"
          aria-labelledby="features-heading"
        >
          <h2
            id="features-heading"
            className="mb-12 text-center text-2xl font-bold"
          >
            Everything your staff needs to run a tight practice
          </h2>
          <ul className="grid gap-6 sm:grid-cols-3" role="list">
            {features.map((f) => (
              <li key={f.title} className="rounded-xl bg-mx-surface p-6 space-y-2">
                <h3 className="font-semibold">{f.title}</h3>
                <p className="text-sm text-mx-muted">{f.description}</p>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <footer className="border-t border-mx-stroke-soft">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6 text-sm text-mx-muted">
          <span>&copy; {new Date().getFullYear()} MinuteXMinute</span>
          <Link href="/login" className="hover:text-mx-text transition-colors">
            Sign in
          </Link>
        </div>
      </footer>
    </div>
  );
}
