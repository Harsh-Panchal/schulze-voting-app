"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createElection, updateElectionStatus } from "@/lib/api";
import { DEFAULT_ALPHA, DEFAULT_BETA } from "@/lib/constants";

export default function CreateElectionPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [candidates, setCandidates] = useState<string[]>(["", ""]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [alpha, setAlpha] = useState(DEFAULT_ALPHA);
  const [beta, setBeta] = useState(DEFAULT_BETA);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addCandidate = () => setCandidates([...candidates, ""]);

  const removeCandidate = (index: number) => {
    if (candidates.length <= 2) return; // minimum 2 candidates
    setCandidates(candidates.filter((_, i) => i !== index));
  };

  const updateCandidate = (index: number, value: string) => {
    const updated = [...candidates];
    updated[index] = value;
    setCandidates(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || candidates.filter((c) => c.trim()).length < 2) return;

    setIsSubmitting(true);
    try {
      const election = await createElection({
        title: title.trim(),
        description: description.trim() || undefined,
        candidates: candidates
          .filter((c) => c.trim())
          .map((name, i) => ({ name: name.trim(), position: i })),
        parameters: { alpha, beta },
      });

      // Auto-activate the election
      await updateElectionStatus(election.id, "active");
      router.push(`/vote/${election.id}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900">Create Election</h1>
      <p className="mt-2 text-gray-600">
        Set up your election with candidates that voters will rate on a 0–10
        scale.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-8">
        {/* Title */}
        <div>
          <label
            htmlFor="title"
            className="block text-sm font-medium text-gray-700"
          >
            Election Title *
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Best feature to build next"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700"
          >
            Description (optional)
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Provide context for voters..."
            rows={3}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
          />
        </div>

        {/* Candidates */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Candidates * (minimum 2)
          </label>
          <div className="mt-2 space-y-3">
            {candidates.map((candidate, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={candidate}
                  onChange={(e) => updateCandidate(index, e.target.value)}
                  placeholder={`Candidate ${index + 1}`}
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
                />
                {candidates.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeCandidate(index)}
                    className="rounded-md px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addCandidate}
            className="mt-3 text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            + Add candidate
          </button>
        </div>

        {/* Advanced Parameters */}
        <div>
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-sm font-medium text-gray-500 hover:text-gray-700"
          >
            {showAdvanced ? "▼" : "▶"} Advanced Parameters
          </button>
          {showAdvanced && (
            <div className="mt-4 space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Alpha (α): {alpha} — Support vs Margin blend
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={alpha}
                  onChange={(e) => setAlpha(parseFloat(e.target.value))}
                  className="mt-1 w-full"
                />
                <p className="mt-1 text-xs text-gray-500">
                  0 = pure margin, 0.5 = balanced (default), 1 = pure support
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Beta (β): {beta} — Rating intensity weight
                </label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={beta}
                  onChange={(e) => setBeta(parseFloat(e.target.value))}
                  className="mt-1 w-full"
                />
                <p className="mt-1 text-xs text-gray-500">
                  0 = ignore intensity, 1 = balanced (default), 2 = max
                  intensity weight
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={
            isSubmitting ||
            !title.trim() ||
            candidates.filter((c) => c.trim()).length < 2
          }
          className="w-full rounded-md bg-gray-900 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Creating..." : "Create & Start Election"}
        </button>
      </form>
    </div>
  );
}
