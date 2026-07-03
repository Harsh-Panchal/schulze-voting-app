"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { listElections, updateElectionStatus, deleteElection } from "@/lib/api";
import type { Election } from "@/lib/types";

type ElectionWithCount = Election & { _count?: { ballots: number; results: number } };

type Tab = "active" | "closed";

export default function ElectionsPage() {
  const [elections, setElections] = useState<ElectionWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("active");

  useEffect(() => {
    let cancelled = false;
    listElections()
      .then((data) => { if (!cancelled) setElections(data); })
      .catch(console.error)
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  function refreshElections() {
    listElections()
      .then(setElections)
      .catch(console.error);
  }

  async function handleClose(id: string) {
    await updateElectionStatus(id, "closed");
    refreshElections();
  }

  async function handleReactivate(id: string) {
    await updateElectionStatus(id, "active");
    refreshElections();
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Are you sure you want to delete "${title}"? This cannot be undone.`)) {
      return;
    }
    await deleteElection(id);
    refreshElections();
  }

  const filtered = elections.filter((e) => e.status === activeTab);

  return (
    <div className="container mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-900">Elections</h1>
      <p className="mt-2 text-gray-600">
        Browse active elections to vote, or view results of closed ones.
      </p>

      {/* Tabs */}
      <div className="mt-8 flex border-b">
        <button
          onClick={() => setActiveTab("active")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "active"
              ? "border-gray-900 text-gray-900"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Active
        </button>
        <button
          onClick={() => setActiveTab("closed")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "closed"
              ? "border-gray-900 text-gray-900"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Closed
        </button>
      </div>

      {/* Content */}
      <div className="mt-6">
        {loading ? (
          <p className="text-gray-500">Loading elections...</p>
        ) : filtered.length === 0 ? (
          <p className="text-gray-500">
            No {activeTab} elections found.
          </p>
        ) : (
          <div className="grid gap-4">
            {filtered.map((election) => (
              <div
                key={election.id}
                className="flex items-center justify-between rounded-lg border p-4 hover:bg-gray-50 transition-colors"
              >
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {election.title}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {election.candidates.length} candidates · {election._count?.ballots ?? 0} votes · Created{" "}
                    {new Date(election.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {activeTab === "active" ? (
                    <Link
                      href={`/vote/${election.id}`}
                      className="rounded-md px-4 py-2 text-sm font-medium shadow-sm bg-gray-900 text-white hover:bg-gray-700"
                    >
                      Vote
                    </Link>
                  ) : (election._count?.results ?? 0) > 0 ? (
                    <Link
                      href={`/results/${election.id}`}
                      className="rounded-md px-4 py-2 text-sm font-medium shadow-sm bg-green-600 text-white hover:bg-green-500"
                    >
                      View Results
                    </Link>
                  ) : (
                    <span className="rounded-md px-4 py-2 text-sm font-medium bg-yellow-50 text-yellow-700 border border-yellow-200">
                      Calculating...
                    </span>
                  )}
                  {activeTab === "active" ? (
                    <button
                      onClick={() => handleClose(election.id)}
                      className="rounded-md border border-yellow-300 bg-yellow-50 px-3 py-2 text-sm font-medium text-yellow-800 hover:bg-yellow-100"
                    >
                      Close
                    </button>
                  ) : (
                    <button
                      onClick={() => handleReactivate(election.id)}
                      className="rounded-md border border-green-300 bg-green-50 px-3 py-2 text-sm font-medium text-green-800 hover:bg-green-100"
                    >
                      Reactivate
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(election.id, election.title)}
                    className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm font-medium text-red-800 hover:bg-red-100"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
