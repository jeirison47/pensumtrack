-- Drop old unique constraint (one preselection per profile)
ALTER TABLE "Preselection" DROP CONSTRAINT IF EXISTS "Preselection_profileId_key";

-- Add new unique constraint (one preselection per profile+period)
ALTER TABLE "Preselection" ADD CONSTRAINT "Preselection_profileId_period_key" UNIQUE ("profileId", "period");
