-- AlterTable: remove candidate_name column and add candidate relation
ALTER TABLE "election_results" DROP COLUMN "candidate_name";

-- AddForeignKey
ALTER TABLE "election_results" ADD CONSTRAINT "election_results_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
