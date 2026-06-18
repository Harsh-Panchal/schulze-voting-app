/**
 * API Service Layer
 *
 * This is the SINGLE point of contact between Frontend and Backend.
 * Currently uses mock data stored in localStorage.
 * When backend is ready, replace implementations with real fetch() calls.
 */

import { DEFAULT_ALPHA, DEFAULT_BETA } from "./constants";
import type {
  Election,
  ElectionResults,
  CreateElectionRequest,
  SubmitBallotRequest,
  Ballot,
} from "./types";

// ---- Mock Storage (replace with real API calls later) ----

function getStoredElections(): Election[] {
  if (typeof window === "undefined") return [];
  const data = localStorage.getItem("schulze_elections");
  return data ? JSON.parse(data) : [];
}

function saveElections(elections: Election[]) {
  localStorage.setItem("schulze_elections", JSON.stringify(elections));
}

function getStoredBallots(electionId: string): Ballot[] {
  if (typeof window === "undefined") return [];
  const data = localStorage.getItem(`schulze_ballots_${electionId}`);
  return data ? JSON.parse(data) : [];
}

function saveBallots(electionId: string, ballots: Ballot[]) {
  localStorage.setItem(`schulze_ballots_${electionId}`, JSON.stringify(ballots));
}

// ---- Public API ----

export async function createElection(
  req: CreateElectionRequest
): Promise<Election> {
  // TODO: Replace with fetch(`${API_BASE_URL}/elections`, { method: 'POST', body: JSON.stringify(req) })
  const election: Election = {
    id: crypto.randomUUID(),
    title: req.title,
    description: req.description,
    candidates: req.candidates.map((c, i) => ({
      ...c,
      id: crypto.randomUUID(),
      position: i,
    })),
    status: "draft",
    parameters: {
      alpha: req.parameters?.alpha ?? DEFAULT_ALPHA,
      beta: req.parameters?.beta ?? DEFAULT_BETA,
    },
    createdAt: new Date().toISOString(),
  };

  const elections = getStoredElections();
  elections.push(election);
  saveElections(elections);
  return election;
}

export async function getElection(id: string): Promise<Election | null> {
  // TODO: Replace with fetch(`${API_BASE_URL}/elections/${id}`)
  const elections = getStoredElections();
  return elections.find((e) => e.id === id) ?? null;
}

export async function listElections(): Promise<Election[]> {
  // TODO: Replace with fetch(`${API_BASE_URL}/elections`)
  return getStoredElections();
}

export async function updateElectionStatus(
  id: string,
  status: "active" | "closed"
): Promise<Election | null> {
  // TODO: Replace with fetch(`${API_BASE_URL}/elections/${id}/status`, { method: 'PATCH' })
  const elections = getStoredElections();
  const election = elections.find((e) => e.id === id);
  if (!election) return null;

  election.status = status;
  if (status === "closed") {
    election.closedAt = new Date().toISOString();
  }
  saveElections(elections);
  return election;
}

export async function submitBallot(
  electionId: string,
  req: SubmitBallotRequest
): Promise<Ballot> {
  // TODO: Replace with fetch(`${API_BASE_URL}/elections/${electionId}/ballots`, { method: 'POST' })
  const ballot: Ballot = {
    id: crypto.randomUUID(),
    electionId,
    ratings: req.ratings,
    submittedAt: new Date().toISOString(),
  };

  const ballots = getStoredBallots(electionId);
  ballots.push(ballot);
  saveBallots(electionId, ballots);
  return ballot;
}

export async function getResults(
  electionId: string
): Promise<ElectionResults | null> {
  // TODO: Replace with fetch(`${API_BASE_URL}/elections/${electionId}/results`)
  // For now, return mock placeholder results
  const election = await getElection(electionId);
  if (!election || election.status !== "closed") return null;

  // Placeholder: equal distribution (real backend computes Schulze algorithm)
  const n = election.candidates.length;
  const equalPct = n > 0 ? 100 / n : 0;

  return {
    electionId,
    results: election.candidates.map((c, i) => ({
      candidateId: c.id,
      candidateName: c.name,
      rank: i + 1,
      percentage: Math.round(equalPct * 10) / 10,
      isWinner: i === 0,
    })),
    computedAt: new Date().toISOString(),
  };
}
