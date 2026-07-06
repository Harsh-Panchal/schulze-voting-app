// ============================================================
// Core Domain Types — Schulze Voting Platform
// These types define the API contract between Frontend & Backend
// ============================================================

// --- Election & Candidates ---

export interface Candidate {
  id: string;
  name: string;
  description?: string;
  position: number; // display order
}

export type ElectionStatus = "draft" | "active" | "closed";

export interface ElectionParameters {
  alpha: number; // 0-1, support vs margin blend (default 0.5)
  beta: number; // 0-2, rating intensity weight (default 1.0)
}

export interface Election {
  id: string;
  title: string;
  description?: string;
  candidates: Candidate[];
  status: ElectionStatus;
  parameters: ElectionParameters;
  createdAt: string; // ISO date
  closedAt?: string; // ISO date
}

// --- Ballots ---

export interface Ballot {
  id: string;
  electionId: string;
  ratings: Record<string, number>; // candidateId → 0-10
  submittedAt: string; // ISO date
}

// --- Results (returned by backend after election closes) ---

export interface CandidateResult {
  candidateId: string;
  candidateName: string;
  rank: number;
  percentage: number;
  isWinner: boolean;
}

export interface ElectionResults {
  electionId: string;
  results: CandidateResult[];
  computedAt: string; // ISO date
}

// --- API Request/Response shapes ---

export interface CreateElectionRequest {
  title: string;
  description?: string;
  candidates: Omit<Candidate, "id">[];
  parameters?: Partial<ElectionParameters>;
}

export interface SubmitBallotRequest {
  ratings: Record<string, number | null>; // candidateId → 0-10 or null (unrated)
}

// --- Algorithm internals (for future visualization) ---

export interface PairwiseMatrix {
  matrix: number[][];
  candidateIds: string[];
}

export interface BeatpathResult {
  P: number[][];
  candidateIds: string[];
  winnerId: string | null;
}
