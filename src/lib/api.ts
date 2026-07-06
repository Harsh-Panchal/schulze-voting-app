/**
 * API Service Layer
 *
 * This is the SINGLE point of contact between Frontend and Backend.
 * All functions call the Next.js API routes which interact with PostgreSQL.
 */

import type {
  Election,
  ElectionResults,
  CreateElectionRequest,
  SubmitBallotRequest,
  Ballot,
} from "./types";

const API_URL = "/api";

// ---- Public API ----

export async function createElection(
  req: CreateElectionRequest
): Promise<Election> {
  const res = await fetch(`${API_URL}/elections`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  if (!res.ok) throw new Error("Failed to create election");
  return res.json();
}

export async function getElection(id: string): Promise<Election | null> {
  const res = await fetch(`${API_URL}/elections/${id}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to fetch election");
  return res.json();
}

export async function listElections(): Promise<Election[]> {
  const res = await fetch(`${API_URL}/elections`);
  if (!res.ok) throw new Error("Failed to list elections");
  return res.json();
}

export async function updateElectionStatus(
  id: string,
  status: "active" | "closed"
): Promise<Election | null> {
  const res = await fetch(`${API_URL}/elections/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to update election status");
  return res.json();
}

export async function submitBallot(
  electionId: string,
  req: SubmitBallotRequest
): Promise<Ballot> {
  const res = await fetch(`${API_URL}/elections/${electionId}/ballots`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  if (!res.ok) throw new Error("Failed to submit ballot");
  return res.json();
}

export async function getResults(
  electionId: string
): Promise<ElectionResults | null> {
  const res = await fetch(`${API_URL}/elections/${electionId}/results`);
  if (res.status === 202) return null; // results still calculating
  if (res.status === 400 || res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to fetch results");
  return res.json();
}

export async function deleteElection(id: string): Promise<void> {
  const res = await fetch(`${API_URL}/elections/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete election");
}

