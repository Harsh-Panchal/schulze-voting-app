import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

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

  const data: { status: "active" | "closed"; closedAt?: Date } = { status };
  if (status === "closed") {
    data.closedAt = new Date();
  }

  const election = await prisma.election.update({
    where: { id },
    data,
    include: { candidates: { orderBy: { position: "asc" } } },
  });

  return NextResponse.json(election);
}
