import Link from "next/link";

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-16">
      {/* Hero Section */}
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
          Fair Voting Made Simple
        </h1>
        <p className="mt-6 text-lg leading-8 text-gray-600">
          Create elections where voters rate candidates on a 0–10 scale. The
          Schulze beatpath method ensures the fairest winner — combining
          majority preferences with rating intensity for transparent, meaningful
          results.
        </p>
        <div className="mt-10 flex items-center justify-center gap-x-6">
          <Link
            href="/create"
            className="rounded-md bg-gray-900 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900"
          >
            Create Election
          </Link>
        </div>
      </div>

      {/* Features */}
      <div className="mx-auto mt-24 max-w-4xl">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100">
              <span className="text-xl">⚖️</span>
            </div>
            <h3 className="mt-4 text-base font-semibold text-gray-900">
              Condorcet Fair
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              If one option is preferred over every other in head-to-head
              comparisons, it wins. No vote splitting.
            </p>
          </div>
          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100">
              <span className="text-xl">📊</span>
            </div>
            <h3 className="mt-4 text-base font-semibold text-gray-900">
              Intensity Aware
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              Rating differences matter. A strong preference (9 vs 2) counts
              more than a slight one (6 vs 5).
            </p>
          </div>
          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100">
              <span className="text-xl">🎯</span>
            </div>
            <h3 className="mt-4 text-base font-semibold text-gray-900">
              Clear Results
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              Get a winner, a ranked list, and percentage scores that show how
              strongly each option dominated.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
