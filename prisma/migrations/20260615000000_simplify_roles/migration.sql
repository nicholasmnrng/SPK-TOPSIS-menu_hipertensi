-- Redesign the Phase 6 demo schema into the production two-role application.
CREATE TYPE "UserStatus" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED');
CREATE TYPE "ImportRunStatus" AS ENUM ('PREVIEWED', 'SUCCESS', 'FAILED');

ALTER TABLE "user"
  ADD COLUMN "role" TEXT NOT NULL DEFAULT 'USER',
  ADD COLUMN "status" "UserStatus" NOT NULL DEFAULT 'PENDING',
  ADD COLUMN "banned" BOOLEAN DEFAULT false,
  ADD COLUMN "banReason" TEXT,
  ADD COLUMN "banExpires" TIMESTAMP(3),
  ADD COLUMN "approvedAt" TIMESTAMP(3);

UPDATE "user" AS u
SET "role" = COALESCE(
  (
    SELECT CASE WHEN r."code"::text = 'ADMIN' THEN 'ADMIN' ELSE 'USER' END
    FROM "user_roles" ur
    JOIN "roles" r ON r."id" = ur."roleId"
    WHERE ur."userId" = u."id"
    ORDER BY CASE WHEN r."code"::text = 'ADMIN' THEN 0 ELSE 1 END
    LIMIT 1
  ),
  'USER'
);

UPDATE "user"
SET "status" = 'ACTIVE',
    "approvedAt" = NOW();

ALTER TABLE "session" ADD COLUMN "impersonatedBy" TEXT;

DROP TABLE IF EXISTS "user_roles";
DROP TABLE IF EXISTS "roles";
DROP TYPE IF EXISTS "RoleCode";

DROP TABLE IF EXISTS "ranking_results";
DROP TABLE IF EXISTS "ranking_runs";
DROP TABLE IF EXISTS "assessments";
DROP TABLE IF EXISTS "alternatives";
DROP TABLE IF EXISTS "criteria";
DROP TABLE IF EXISTS "audit_logs";
DROP TYPE IF EXISTS "AuditAction";

CREATE TYPE "AuditAction" AS ENUM (
  'REGISTER', 'LOGIN', 'LOGOUT', 'CREATE', 'UPDATE', 'DELETE', 'RESTORE',
  'APPROVE_ACCOUNT', 'SUSPEND_ACCOUNT', 'ACTIVATE_ACCOUNT', 'RESET_PASSWORD',
  'REVOKE_SESSIONS', 'IMPORT_DATA', 'CALCULATE_TOPSIS', 'EXPORT_REPORT',
  'SYSTEM_ERROR', 'HEALTH_CHECK'
);

CREATE TABLE "criteria" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "unit" TEXT NOT NULL,
  "weight" DOUBLE PRECISION NOT NULL,
  "attribute" "CriterionAttribute" NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "criteria_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "guidelines" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "issuer" TEXT NOT NULL,
  "year" INTEGER NOT NULL,
  "url" TEXT NOT NULL,
  "summary" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "guidelines_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "criterion_guidelines" (
  "id" TEXT NOT NULL,
  "criterionId" TEXT NOT NULL,
  "guidelineId" TEXT NOT NULL,
  "note" TEXT,
  CONSTRAINT "criterion_guidelines_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "foods" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "normalizedName" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "description" TEXT,
  "source" TEXT,
  "basisGram" DOUBLE PRECISION NOT NULL DEFAULT 100,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "foods_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "food_nutrients" (
  "id" TEXT NOT NULL,
  "foodId" TEXT NOT NULL,
  "criterionId" TEXT NOT NULL,
  "value" DOUBLE PRECISION,
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "food_nutrients_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "import_runs" (
  "id" TEXT NOT NULL,
  "fileName" TEXT NOT NULL,
  "fileType" TEXT NOT NULL,
  "status" "ImportRunStatus" NOT NULL,
  "totalRows" INTEGER NOT NULL,
  "validRows" INTEGER NOT NULL,
  "incompleteRows" INTEGER NOT NULL,
  "errorRows" INTEGER NOT NULL,
  "summary" JSONB,
  "errorMessage" TEXT,
  "createdById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "import_runs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ranking_runs" (
  "id" TEXT NOT NULL,
  "status" "RankingRunStatus" NOT NULL DEFAULT 'SUCCESS',
  "criteriaSnapshot" JSONB NOT NULL,
  "guidelineSnapshot" JSONB NOT NULL,
  "matrixSnapshot" JSONB NOT NULL,
  "normalizedMatrix" JSONB NOT NULL,
  "weightedMatrix" JSONB NOT NULL,
  "idealPositive" JSONB NOT NULL,
  "idealNegative" JSONB NOT NULL,
  "disclaimer" TEXT NOT NULL,
  "errorMessage" TEXT,
  "createdById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ranking_runs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ranking_results" (
  "id" TEXT NOT NULL,
  "rankingRunId" TEXT NOT NULL,
  "foodId" TEXT NOT NULL,
  "rank" INTEGER NOT NULL,
  "dPositive" DOUBLE PRECISION NOT NULL,
  "dNegative" DOUBLE PRECISION NOT NULL,
  "preference" DOUBLE PRECISION NOT NULL,
  "detail" JSONB NOT NULL,
  "justification" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ranking_results_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "audit_logs" (
  "id" TEXT NOT NULL,
  "actorId" TEXT,
  "action" "AuditAction" NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT,
  "metadata" JSONB,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "health_checks" (
  "id" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "database" TEXT NOT NULL,
  "latencyMs" INTEGER NOT NULL,
  "message" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "health_checks_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "criteria_code_key" ON "criteria"("code");
CREATE INDEX "criteria_attribute_idx" ON "criteria"("attribute");
CREATE INDEX "criteria_deletedAt_idx" ON "criteria"("deletedAt");
CREATE UNIQUE INDEX "guidelines_code_key" ON "guidelines"("code");
CREATE INDEX "guidelines_deletedAt_idx" ON "guidelines"("deletedAt");
CREATE UNIQUE INDEX "criterion_guidelines_criterionId_guidelineId_key" ON "criterion_guidelines"("criterionId", "guidelineId");
CREATE UNIQUE INDEX "foods_normalizedName_key" ON "foods"("normalizedName");
CREATE UNIQUE INDEX "foods_slug_key" ON "foods"("slug");
CREATE INDEX "foods_name_idx" ON "foods"("name");
CREATE INDEX "foods_deletedAt_idx" ON "foods"("deletedAt");
CREATE UNIQUE INDEX "food_nutrients_foodId_criterionId_key" ON "food_nutrients"("foodId", "criterionId");
CREATE INDEX "food_nutrients_foodId_idx" ON "food_nutrients"("foodId");
CREATE INDEX "food_nutrients_criterionId_idx" ON "food_nutrients"("criterionId");
CREATE INDEX "import_runs_status_createdAt_idx" ON "import_runs"("status", "createdAt");
CREATE INDEX "import_runs_createdById_idx" ON "import_runs"("createdById");
CREATE INDEX "ranking_runs_status_idx" ON "ranking_runs"("status");
CREATE INDEX "ranking_runs_createdAt_idx" ON "ranking_runs"("createdAt");
CREATE INDEX "ranking_runs_createdById_idx" ON "ranking_runs"("createdById");
CREATE UNIQUE INDEX "ranking_results_rankingRunId_foodId_key" ON "ranking_results"("rankingRunId", "foodId");
CREATE INDEX "ranking_results_rankingRunId_rank_idx" ON "ranking_results"("rankingRunId", "rank");
CREATE INDEX "ranking_results_foodId_idx" ON "ranking_results"("foodId");
CREATE INDEX "ranking_results_preference_idx" ON "ranking_results"("preference");
CREATE INDEX "audit_logs_actorId_idx" ON "audit_logs"("actorId");
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");
CREATE INDEX "audit_logs_entityType_entityId_idx" ON "audit_logs"("entityType", "entityId");
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");
CREATE INDEX "health_checks_createdAt_idx" ON "health_checks"("createdAt");
CREATE INDEX "user_role_status_idx" ON "user"("role", "status");

ALTER TABLE "criterion_guidelines" ADD CONSTRAINT "criterion_guidelines_criterionId_fkey" FOREIGN KEY ("criterionId") REFERENCES "criteria"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "criterion_guidelines" ADD CONSTRAINT "criterion_guidelines_guidelineId_fkey" FOREIGN KEY ("guidelineId") REFERENCES "guidelines"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "food_nutrients" ADD CONSTRAINT "food_nutrients_foodId_fkey" FOREIGN KEY ("foodId") REFERENCES "foods"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "food_nutrients" ADD CONSTRAINT "food_nutrients_criterionId_fkey" FOREIGN KEY ("criterionId") REFERENCES "criteria"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "import_runs" ADD CONSTRAINT "import_runs_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ranking_runs" ADD CONSTRAINT "ranking_runs_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ranking_results" ADD CONSTRAINT "ranking_results_rankingRunId_fkey" FOREIGN KEY ("rankingRunId") REFERENCES "ranking_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ranking_results" ADD CONSTRAINT "ranking_results_foodId_fkey" FOREIGN KEY ("foodId") REFERENCES "foods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
