import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { computeAndStoreResults } from "@/lib/schulze";
import { getSessionUser } from "@/lib/auth";

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

// PATCH /api/elections/[id] — update election status (creator only)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const existing = await prisma.election.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Election not found" }, { status: 404 });
  }
  if (existing.creatorId !== user.id) {
    return NextResponse.json({ error: "Only the creator can manage this election" }, { status: 403 });
  }

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

// DELETE /api/elections/[id] — delete an election (creator only)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const election = await prisma.election.findUnique({ where: { id } });
  if (!election) {
    return NextResponse.json({ error: "Election not found" }, { status: 404 });
  }
  if (election.creatorId !== user.id) {
    return NextResponse.json({ error: "Only the creator can delete this election" }, { status: 403 });
  }

  await prisma.election.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
}
