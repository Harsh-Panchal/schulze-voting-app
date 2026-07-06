import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/elections/[id]/results — return stored Schulze results
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const election = await prisma.election.findUnique({
    where: { id },
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

  // Read stored results from database
  const results = await prisma.electionResult.findMany({
    where: { electionId: id },
    include: { candidate: { select: { name: true } } },
    orderBy: { rank: "asc" },
  });

  // If results haven't been computed yet (async calculation still in progress)
  if (results.length === 0) {
    return NextResponse.json(
      { error: "Results are being calculated", status: "calculating" },
      { status: 202 }
    );
  }

  return NextResponse.json({
    electionId: id,
    results: results.map((r) => ({
      candidateId: r.candidateId,
      candidateName: r.candidate.name,
      rank: r.rank,
      percentage: r.percentage,
      isWinner: r.isWinner,
    })),
    totalBallots: results[0].totalBallots,
    computedAt: results[0].computedAt.toISOString(),
  });
}
