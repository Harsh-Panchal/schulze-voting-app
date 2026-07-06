-- CreateTable
CREATE TABLE "election_results" (
    "id" TEXT NOT NULL,
    "election_id" TEXT NOT NULL,
    "candidate_id" TEXT NOT NULL,
    "candidate_name" TEXT NOT NULL,
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
