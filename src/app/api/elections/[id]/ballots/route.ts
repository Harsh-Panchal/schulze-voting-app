import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// POST /api/elections/[id]/ballots — submit a ballot
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { ratings } = body;

  if (!ratings || typeof ratings !== "object") {
    return NextResponse.json(
      { error: "ratings object is required" },
      { status: 400 }
    );
  }

  // Verify election exists and is active
  const election = await prisma.election.findUnique({ where: { id } });
  if (!election) {
    return NextResponse.json({ error: "Election not found" }, { status: 404 });
  }
  if (election.status !== "active") {
    return NextResponse.json(
      { error: "Election is not accepting votes" },
      { status: 400 }
    );
  }

  const ballot = await prisma.ballot.create({
    data: {
      electionId: id,
      ratings,
    },
  });

  return NextResponse.json(ballot, { status: 201 });
}

// GET /api/elections/[id]/ballots — get ballot count
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const count = await prisma.ballot.count({ where: { electionId: id } });
  return NextResponse.json({ electionId: id, count });
}
