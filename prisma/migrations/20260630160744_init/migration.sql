BEGIN;

-- CreateEnum
CREATE TYPE "ElectionStatus" AS ENUM ('draft', 'active', 'closed');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "elections" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "ElectionStatus" NOT NULL DEFAULT 'draft',
    "alpha" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "beta" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closed_at" TIMESTAMP(3),
    "creator_id" TEXT NOT NULL,

    CONSTRAINT "elections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "candidates" (
    "id" TEXT NOT NULL,
    "election_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "position" INTEGER NOT NULL,

    CONSTRAINT "candidates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ballots" (
    "id" TEXT NOT NULL,
    "election_id" TEXT NOT NULL,
    "ratings" JSONB NOT NULL,
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ballots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "elections_creator_id_idx" ON "elections"("creator_id");

-- CreateIndex
CREATE INDEX "candidates_election_id_idx" ON "candidates"("election_id");

-- CreateIndex
CREATE INDEX "ballots_election_id_idx" ON "ballots"("election_id");

-- AddForeignKey
ALTER TABLE "elections" ADD CONSTRAINT "elections_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidates" ADD CONSTRAINT "candidates_election_id_fkey" FOREIGN KEY ("election_id") REFERENCES "elections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ballots" ADD CONSTRAINT "ballots_election_id_fkey" FOREIGN KEY ("election_id") REFERENCES "elections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "election_results" (
    "id" TEXT NOT NULL,
    "election_id" TEXT NOT NULL,
    "candidate_id" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "percentage" DOUBLE PRECISION NOT NULL,
    "is_winner" BOOLEAN NOT NULL DEFAULT false,
    "total_ballots" INTEGER NOT NULL,
    "computed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "election_results_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "election_results_election_id_idx" ON "election_results"("election_id");

-- AddForeignKey
ALTER TABLE "election_results" ADD CONSTRAINT "election_results_election_id_fkey" FOREIGN KEY ("election_id") REFERENCES "elections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "election_results" ADD CONSTRAINT "election_results_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT;
