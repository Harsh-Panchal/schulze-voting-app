import { prisma } from "./db";

interface CandidateInput {
  id: string;
  name: string;
}

interface BallotInput {
  ratings: Record<string, number>;
}

/**
 * Computes Schulze results for an election and stores them in the database.
 * Deletes any existing results for this election before storing new ones.
 */
export async function computeAndStoreResults(electionId: string): Promise<void> {
  const election = await prisma.election.findUnique({
    where: { id: electionId },
    include: { candidates: { orderBy: { position: "asc" } } },
  });

  if (!election) throw new Error("Election not found");

  const ballots = await prisma.ballot.findMany({
    where: { electionId },
  });

  const candidates: CandidateInput[] = election.candidates;
  const n = candidates.length;
  const candidateIds = candidates.map((c) => c.id);

  // Build pairwise preference matrix using rating intensity
  const d: number[][] = Array.from({ length: n }, () => Array(n).fill(0));

  for (const ballot of ballots) {
    const ratings = ballot.ratings as BallotInput["ratings"];
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i === j) continue;
        const ri = ratings[candidateIds[i]];
        const rj = ratings[candidateIds[j]];
        // Skip if either candidate is unrated (null/undefined) in this ballot
        if (ri == null || rj == null) continue;
        const diff = ri - rj;
        if (diff > 0) {
          d[i][j] += diff * election.beta;
        }
      }
    }
  }

  // Schulze beatpath: compute strongest paths
  const p: number[][] = Array.from({ length: n }, () => Array(n).fill(0));

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i === j) continue;
      if (d[i][j] > d[j][i]) {
        p[i][j] = d[i][j];
      }
    }
  }

  // Floyd-Warshall for strongest paths
  for (let k = 0; k < n; k++) {
    for (let i = 0; i < n; i++) {
      if (i === k) continue;
      for (let j = 0; j < n; j++) {
        if (j === i || j === k) continue;
        p[i][j] = Math.max(p[i][j], Math.min(p[i][k], p[k][j]));
      }
    }
  }

  // Compute wins
  const wins: number[] = Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i === j) continue;
      if (p[i][j] > p[j][i]) {
        wins[i]++;
      }
    }
  }

  // Rank by wins (descending)
  const maxWins = Math.max(...wins, 1);
  const ranked = candidates
    .map((c, i) => ({
      candidateId: c.id,
      candidateName: c.name,
      wins: wins[i],
      percentage: Math.round((wins[i] / maxWins) * 1000) / 10,
      rank: 0,
      isWinner: false,
    }))
    .sort((a, b) => b.wins - a.wins);

  // Assign ranks (handle ties)
  let currentRank = 1;
  for (let i = 0; i < ranked.length; i++) {
    if (i > 0 && ranked[i].wins < ranked[i - 1].wins) {
      currentRank = i + 1;
    }
    ranked[i].rank = currentRank;
    ranked[i].isWinner = currentRank === 1;
  }

  // Delete existing results and store new ones
  const computedAt = new Date();
  await prisma.$transaction([
    prisma.electionResult.deleteMany({ where: { electionId } }),
    ...ranked.map((r) =>
      prisma.electionResult.create({
        data: {
          electionId,
          candidateId: r.candidateId,
          rank: r.rank,
          percentage: r.percentage,
          isWinner: r.isWinner,
          totalBallots: ballots.length,
          computedAt,
        },
      })
    ),
  ]);
}
