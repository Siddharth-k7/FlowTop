-- AlterTable
ALTER TABLE "user" ADD COLUMN     "mfa_last_used_step" INTEGER,
ADD COLUMN     "mfa_pending_expires_at" TIMESTAMPTZ(6),
ADD COLUMN     "mfa_pending_secret" TEXT;

-- CreateTable
CREATE TABLE "mfa_recovery_code" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "code_hash" TEXT NOT NULL,
    "used_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mfa_recovery_code_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "mfa_recovery_code_code_hash_key" ON "mfa_recovery_code"("code_hash");

-- CreateIndex
CREATE INDEX "mfa_recovery_code_user_id_idx" ON "mfa_recovery_code"("user_id");

-- AddForeignKey
ALTER TABLE "mfa_recovery_code" ADD CONSTRAINT "mfa_recovery_code_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
