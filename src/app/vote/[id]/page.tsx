"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { getElection, submitBallot } from "@/lib/api";
import { MAX_RATING, MIN_RATING } from "@/lib/constants";
import type { Election } from "@/lib/types";

export default function VotePage() {
  const params = useParams();
  const router = useRouter();
  const electionId = params.id as string;

  const [election, setElection] = useState<Election | null>(null);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const e = await getElection(electionId);
      setElection(e);
      if (e) {
        // Initialize all ratings to 5 (middle)
        const initial: Record<string, number> = {};
        e.candidates.forEach((c) => {
          initial[c.id] = 5;
        });
        setRatings(initial);
      }
      setLoading(false);
    }
    load();
  }, [electionId]);

  const handleRatingChange = (candidateId: string, value: number) => {
    setRatings((prev) => ({ ...prev, [candidateId]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!election) return;

    setIsSubmitting(true);
    try {
      await submitBallot(electionId, { ratings });
      setSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-12 text-center text-gray-500">
        Loading election...
      </div>
    );
  }

  if (!election) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-12 text-center">
        <h1 className="text-2xl font-bold text-gray-900">
          Election not found
        </h1>
        <p className="mt-2 text-gray-600">
          This election may not exist or has been removed.
        </p>
      </div>
    );
  }

  if (election.status === "closed") {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-12 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Election Closed</h1>
        <p className="mt-2 text-gray-600">
          This election is no longer accepting votes.
        </p>
        <button
          onClick={() => router.push(`/results/${electionId}`)}
          className="mt-4 rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
        >
          View Results
        </button>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-12 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <span className="text-2xl">✓</span>
        </div>
        <h1 className="mt-4 text-2xl font-bold text-gray-900">
          Vote Submitted!
        </h1>
        <p className="mt-2 text-gray-600">
          Thank you for voting. Results will be available once the election
          closes.
        </p>
        <div className="mt-6 flex justify-center gap-4">
          <button
            onClick={() => router.push(`/results/${electionId}`)}
            className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
          >
            View Results
          </button>
          <button
            onClick={() => {
              setSubmitted(false);
              // Reset ratings to 5
              const reset: Record<string, number> = {};
              election.candidates.forEach((c) => {
                reset[c.id] = 5;
              });
              setRatings(reset);
            }}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Submit Another Vote (Testing)
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900">{election.title}</h1>
      {election.description && (
        <p className="mt-2 text-gray-600">{election.description}</p>
      )}
      <p className="mt-4 text-sm text-gray-500">
        Rate each candidate from {MIN_RATING} (worst) to {MAX_RATING} (best).
        You may give the same rating to multiple candidates (ties allowed).
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        {election.candidates.map((candidate) => (
          <div
            key={candidate.id}
            className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">
                {candidate.name}
              </h3>
              <span className="text-2xl font-bold text-gray-900">
                {ratings[candidate.id] ?? 5}
              </span>
            </div>
            {candidate.description && (
              <p className="mt-1 text-sm text-gray-500">
                {candidate.description}
              </p>
            )}
            <div className="mt-4">
              <input
                type="range"
                min={MIN_RATING}
                max={MAX_RATING}
                step="1"
                value={ratings[candidate.id] ?? 5}
                onChange={(e) =>
                  handleRatingChange(candidate.id, parseInt(e.target.value))
                }
                className="w-full accent-gray-900"
              />
              <div className="mt-1 flex justify-between text-xs text-gray-400">
                <span>{MIN_RATING} (worst)</span>
                <span>{MAX_RATING} (best)</span>
              </div>
            </div>
          </div>
        ))}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-md bg-gray-900 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-gray-700 disabled:opacity-50"
        >
          {isSubmitting ? "Submitting..." : "Submit Vote"}
        </button>
      </form>
    </div>
  );
}
