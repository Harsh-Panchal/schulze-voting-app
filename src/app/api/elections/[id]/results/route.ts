import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/elections/[id]/results — compute and return Schulze results
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const election = await prisma.election.findUnique({
    where: { id },
    include: { candidates: { orderBy: { position: "asc" } } },
  });

  if (!election) {
    return NextResponse.json({ error: "Election not found" }, { status: 404 });
  }
  if (election.status !== "closed") {
    return NextResponse.json(
      { error: "Election must be closed to view results" },
      { status: 400 }
    );
  }

  const ballots = await prisma.ballot.findMany({
    where: { electionId: id },
  });

  const candidates = election.candidates;
  const n = candidates.length;
  const candidateIds = candidates.map((c) => c.id);

  // Build pairwise preference matrix using rating intensity
  // d[i][j] = sum of max(0, rating_i - rating_j) * beta for each ballot
  const d: number[][] = Array.from({ length: n }, () => Array(n).fill(0));

  for (const ballot of ballots) {
    const ratings = ballot.ratings as Record<string, number>;
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i === j) continue;
        const ri = ratings[candidateIds[i]] ?? 0;
        const rj = ratings[candidateIds[j]] ?? 0;
        const diff = ri - rj;
        if (diff > 0) {
          d[i][j] += diff * election.beta;
        }
      }
    }
  }

  // Schulze beatpath: compute strongest paths
  const p: number[][] = Array.from({ length: n }, () => Array(n).fill(0));

  // Initialize: p[i][j] = d[i][j] if d[i][j] > d[j][i], else 0
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

  // Compute wins: how many candidates each candidate beats
  const wins: number[] = Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i === j) continue;
      if (p[i][j] > p[j][i]) {
        wins[i]++;
      }
    }
  }

  // Rank by number of wins (descending)
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

  return NextResponse.json({
    electionId: id,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    results: ranked.map(({ wins, ...rest }) => rest),
    totalBallots: ballots.length,
    computedAt: new Date().toISOString(),
  });
}
