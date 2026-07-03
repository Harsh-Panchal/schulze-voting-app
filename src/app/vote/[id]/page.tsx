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
  const [ratings, setRatings] = useState<Record<string, number | null>>({});
  const [hoverPositions, setHoverPositions] = useState<Record<string, number | null>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const e = await getElection(electionId);
      setElection(e);
      if (e) {
        // Initialize all ratings to null (unrated)
        const initial: Record<string, number | null> = {};
        e.candidates.forEach((c) => {
          initial[c.id] = null;
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

  const handleClearRating = (candidateId: string) => {
    setRatings((prev) => ({ ...prev, [candidateId]: null }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!election) return;

    setIsSubmitting(true);
    try {
      // Submit ratings as-is (null values stay null)
      const submissionRatings: Record<string, number | null> = {};
      for (const [key, value] of Object.entries(ratings)) {
        submissionRatings[key] = value;
      }
      await submitBallot(electionId, { ratings: submissionRatings });
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
        <div className="mt-6">
          <button
            onClick={() => router.push(`/results/${electionId}`)}
            className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
          >
            View Results
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
        Leave unrated if you have no preference. Ties are allowed.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        {election.candidates.map((candidate) => {
          const rating = ratings[candidate.id];
          const isRated = rating !== null;

          return (
            <div
              key={candidate.id}
              className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">
                  {candidate.name}
                </h3>
                <span className={`text-2xl font-bold ${
                  isRated
                    ? "text-gray-900"
                    : hoverPositions[candidate.id] != null
                      ? "text-gray-900 opacity-50"
                      : "text-gray-300"
                }`}>
                  {isRated
                    ? rating
                    : hoverPositions[candidate.id] != null
                      ? Math.round((hoverPositions[candidate.id]! / 100) * MAX_RATING)
                      : "—"}
                </span>
              </div>
              {candidate.description && (
                <p className="mt-1 text-sm text-gray-500">
                  {candidate.description}
                </p>
              )}
              <div className="mt-4">
                <div className="flex items-center gap-3">
                  <div
                    className="relative flex-1 h-8 flex items-center"
                    onMouseMove={(e) => {
                      if (!isRated) {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const percent = ((e.clientX - rect.left) / rect.width) * 100;
                        setHoverPositions((prev) => ({ ...prev, [candidate.id]: Math.max(0, Math.min(100, percent)) }));
                      }
                    }}
                    onMouseLeave={() => {
                      setHoverPositions((prev) => ({ ...prev, [candidate.id]: null }));
                    }}
                  >
                    {/* Track background */}
                    <div className="absolute inset-x-0 h-2 rounded-full bg-gray-200" />
                    {/* Filled portion (only when rated) */}
                    {isRated && (
                      <div
                        className="absolute left-0 h-2 rounded-full bg-gray-900 transition-all"
                        style={{ width: `${(rating / MAX_RATING) * 100}%` }}
                      />
                    )}
                    {/* Thumb (only when rated) */}
                    {isRated && (
                      <div
                        className="absolute w-5 h-5 rounded-full bg-gray-900 border-2 border-white shadow-md -translate-x-1/2 pointer-events-none"
                        style={{ left: `${(rating / MAX_RATING) * 100}%` }}
                      />
                    )}
                    {/* Hover fill + thumb (only when unrated and hovering) */}
                    {!isRated && hoverPositions[candidate.id] != null && (
                      <>
                        <div
                          className="absolute left-0 h-2 rounded-full bg-gray-900 pointer-events-none opacity-30"
                          style={{ width: `${hoverPositions[candidate.id]}%` }}
                        />
                        <div
                          className="absolute w-4 h-4 rounded-full bg-gray-400 border-2 border-white shadow -translate-x-1/2 pointer-events-none opacity-70"
                          style={{ left: `${hoverPositions[candidate.id]}%` }}
                        />
                      </>
                    )}
                    {/* Invisible range input for interaction */}
                    <input
                      type="range"
                      min={MIN_RATING}
                      max={MAX_RATING}
                      step="1"
                      value={isRated ? rating : 5}
                      onChange={(e) =>
                        handleRatingChange(candidate.id, parseInt(e.target.value))
                      }
                      onMouseDown={(e) => {
                        if (!isRated) {
                          const input = e.currentTarget;
                          const rect = input.getBoundingClientRect();
                          const percent = (e.clientX - rect.left) / rect.width;
                          const val = Math.round(percent * (MAX_RATING - MIN_RATING) + MIN_RATING);
                          handleRatingChange(candidate.id, Math.max(MIN_RATING, Math.min(MAX_RATING, val)));
                        }
                      }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                  </div>
                  {isRated && (
                    <button
                      type="button"
                      onClick={() => handleClearRating(candidate.id)}
                      className="flex h-7 w-7 items-center justify-center rounded-full text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                      title="Clear rating"
                    >
                      ✕
                    </button>
                  )}
                </div>
                <div className="mt-1 flex justify-between text-xs text-gray-400">
                  <span>{MIN_RATING} (worst)</span>
                  <span>{MAX_RATING} (best)</span>
                </div>
              </div>
            </div>
          );
        })}

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
