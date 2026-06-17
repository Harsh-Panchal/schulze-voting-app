"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { getElection, getResults, updateElectionStatus } from "@/lib/api";
import type { Election, ElectionResults } from "@/lib/types";

export default function ResultsPage() {
  const params = useParams();
  const electionId = params.id as string;

  const [election, setElection] = useState<Election | null>(null);
  const [results, setResults] = useState<ElectionResults | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const e = await getElection(electionId);
      setElection(e);

      if (e && e.status === "closed") {
        const r = await getResults(electionId);
        setResults(r);
      }
      setLoading(false);
    }
    load();
  }, [electionId]);

  const handleCloseElection = async () => {
    await updateElectionStatus(electionId, "closed");
    const e = await getElection(electionId);
    setElection(e);
    const r = await getResults(electionId);
    setResults(r);
  };

  if (loading) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-12 text-center text-gray-500">
        Loading results...
      </div>
    );
  }

  if (!election) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-12 text-center">
        <h1 className="text-2xl font-bold text-gray-900">
          Election not found
        </h1>
      </div>
    );
  }

  if (election.status === "active") {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-12">
        <h1 className="text-3xl font-bold text-gray-900">{election.title}</h1>
        <p className="mt-4 text-gray-600">
          This election is still active. Close it to compute results.
        </p>
        <button
          onClick={handleCloseElection}
          className="mt-6 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500"
        >
          Close Election & Compute Results
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900">{election.title}</h1>
      <p className="mt-2 text-sm text-gray-500">
        Election closed • Results computed
      </p>

      {/* Winner Banner */}
      {results && results.results.length > 0 && (
        <div className="mt-8 rounded-lg border-2 border-green-200 bg-green-50 p-6 text-center">
          <p className="text-sm font-medium text-green-600">🏆 Winner</p>
          <h2 className="mt-1 text-2xl font-bold text-green-900">
            {results.results.find((r) => r.isWinner)?.candidateName ??
              "No winner"}
          </h2>
          <p className="mt-1 text-sm text-green-700">
            {results.results.find((r) => r.isWinner)?.percentage.toFixed(1)}%
            dominance score
          </p>
        </div>
      )}

      {/* Ranked List */}
      {results && (
        <div className="mt-8 space-y-3">
          <h3 className="text-lg font-semibold text-gray-900">
            Full Rankings
          </h3>
          {results.results
            .sort((a, b) => a.rank - b.rank)
            .map((result) => (
              <div
                key={result.candidateId}
                className="flex items-center gap-4 rounded-lg border border-gray-200 bg-white p-4"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-sm font-bold text-gray-700">
                  {result.rank}
                </span>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900">
                      {result.candidateName}
                    </span>
                    <span className="text-sm font-semibold text-gray-700">
                      {result.percentage.toFixed(1)}%
                    </span>
                  </div>
                  {/* Percentage bar */}
                  <div className="mt-2 h-2 w-full rounded-full bg-gray-100">
                    <div
                      className="h-2 rounded-full bg-gray-700"
                      style={{ width: `${result.percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Placeholder for future visualizations */}
      <div className="mt-12 rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
        <p className="text-sm text-gray-400">
          📈 Pairwise matrix heatmap & beatpath graph visualizations coming
          soon
        </p>
      </div>
    </div>
  );
}
