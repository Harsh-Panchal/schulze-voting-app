import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/elections — list all elections
export async function GET() {
  const elections = await prisma.election.findMany({
    include: { candidates: { orderBy: { position: "asc" } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(elections);
}

// POST /api/elections — create a new election
export async function POST(request: Request) {
  const body = await request.json();
  const { title, description, candidates, parameters } = body;

  if (!title || !candidates || candidates.length === 0) {
    return NextResponse.json(
      { error: "title and candidates are required" },
      { status: 400 }
    );
  }

  const election = await prisma.election.create({
    data: {
      title,
      description: description || null,
      alpha: parameters?.alpha ?? 0.5,
      beta: parameters?.beta ?? 1.0,
      candidates: {
        create: candidates.map(
          (c: { name: string; description?: string }, i: number) => ({
            name: c.name,
            description: c.description || null,
            position: i,
          })
        ),
      },
    },
    include: { candidates: { orderBy: { position: "asc" } } },
  });

  return NextResponse.json(election, { status: 201 });
}
