-- CreateTable
CREATE TABLE IF NOT EXISTS "business_scans" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "score" INTEGER NOT NULL,
    "primary_issue" TEXT NOT NULL,
    "critical_issues" JSONB NOT NULL DEFAULT '[]',
    "medium_issues" JSONB NOT NULL DEFAULT '[]',
    "opportunities" JSONB NOT NULL DEFAULT '[]',
    "quick_wins" JSONB NOT NULL DEFAULT '[]',
    "raw_ai_response" TEXT,
    CONSTRAINT "business_scans_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "business_scans_user_id_idx" ON "business_scans"("user_id");
CREATE INDEX "business_scans_created_at_idx" ON "business_scans"("created_at" DESC);
