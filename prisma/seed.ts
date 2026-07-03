import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Clear existing data
  await prisma.electionResult.deleteMany();
  await prisma.ballot.deleteMany();
  await prisma.candidate.deleteMany();
  await prisma.election.deleteMany();

  // Create a sample election
  const election = await prisma.election.create({
    data: {
      title: "Best Programming Language 2026",
      description:
        "Vote for your favorite programming language. Rate each from 0 (dislike) to 10 (love).",
      status: "active",
      candidates: {
        create: [
          { name: "TypeScript", description: "JavaScript with types", position: 0 },
          { name: "Rust", description: "Memory-safe systems language", position: 1 },
          { name: "Python", description: "Simple and versatile", position: 2 },
          { name: "Go", description: "Fast and concurrent", position: 3 },
        ],
      },
    },
    include: { candidates: true },
  });

  console.log(`Created election: "${election.title}" (${election.id})`);
  console.log(`  Candidates: ${election.candidates.map((c) => c.name).join(", ")}`);

  // Submit some sample ballots
  const candidateIds = election.candidates.map((c) => c.id);

  const sampleBallots = [
    { [candidateIds[0]]: 9, [candidateIds[1]]: 8, [candidateIds[2]]: 6, [candidateIds[3]]: 7 },
    { [candidateIds[0]]: 7, [candidateIds[1]]: 9, [candidateIds[2]]: 5, [candidateIds[3]]: 8 },
    { [candidateIds[0]]: 8, [candidateIds[1]]: 6, [candidateIds[2]]: 9, [candidateIds[3]]: 4 },
    { [candidateIds[0]]: 6, [candidateIds[1]]: 7, [candidateIds[2]]: 8, [candidateIds[3]]: 9 },
    { [candidateIds[0]]: 10, [candidateIds[1]]: 5, [candidateIds[2]]: 7, [candidateIds[3]]: 6 },
  ];

  for (const ratings of sampleBallots) {
    await prisma.ballot.create({
      data: { electionId: election.id, ratings },
    });
  }

  console.log(`  Submitted ${sampleBallots.length} sample ballots`);

  // Create a closed election for testing results
  const closedElection = await prisma.election.create({
    data: {
      title: "Team Lunch Spot",
      description: "Where should we go for Friday lunch?",
      status: "closed",
      closedAt: new Date(),
      candidates: {
        create: [
          { name: "Pizza Place", position: 0 },
          { name: "Sushi Bar", position: 1 },
          { name: "Burger Joint", position: 2 },
        ],
      },
    },
    include: { candidates: true },
  });

  const closedIds = closedElection.candidates.map((c) => c.id);
  const closedBallots = [
    { [closedIds[0]]: 8, [closedIds[1]]: 6, [closedIds[2]]: 4 },
    { [closedIds[0]]: 5, [closedIds[1]]: 9, [closedIds[2]]: 7 },
    { [closedIds[0]]: 7, [closedIds[1]]: 8, [closedIds[2]]: 3 },
  ];

  for (const ratings of closedBallots) {
    await prisma.ballot.create({
      data: { electionId: closedElection.id, ratings },
    });
  }

  console.log(`Created closed election: "${closedElection.title}" (${closedElection.id})`);
  console.log(`  Submitted ${closedBallots.length} sample ballots`);

  // Compute and store results for the closed election
  const { computeAndStoreResults } = await import("../src/lib/schulze");
  await computeAndStoreResults(closedElection.id);
  console.log(`  Computed and stored results`);

  console.log("\nSeed complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
