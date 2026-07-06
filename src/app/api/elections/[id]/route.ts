import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { computeAndStoreResults } from "@/lib/schulze";

// GET /api/elections/[id] — get a single election
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

  return NextResponse.json(election);
}

// PATCH /api/elections/[id] — update election status
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { status } = body;

  if (!["active", "closed"].includes(status)) {
    return NextResponse.json(
      { error: "status must be 'active' or 'closed'" },
      { status: 400 }
    );
  }

  const data: { status: "active" | "closed"; closedAt?: Date | null } = { status };
  if (status === "closed") {
    data.closedAt = new Date();
  } else {
    // Reactivating: clear closedAt
    data.closedAt = null;
  }

  // When reactivating, delete stored results (keep ballots)
  if (status === "active") {
    await prisma.electionResult.deleteMany({ where: { electionId: id } });
  }

  const election = await prisma.election.update({
    where: { id },
    data,
    include: { candidates: { orderBy: { position: "asc" } } },
  });

  // Compute and store results when closing an election
  if (status === "closed") {
    computeAndStoreResults(id).catch(console.error);
  }

  return NextResponse.json(election);
}

// DELETE /api/elections/[id] — delete an election (cascades candidates & ballots)
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const election = await prisma.election.findUnique({ where: { id } });
  if (!election) {
    return NextResponse.json({ error: "Election not found" }, { status: 404 });
  }

  await prisma.election.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
