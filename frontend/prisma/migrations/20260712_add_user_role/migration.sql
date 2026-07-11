-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

-- AlterTable: add role with safe default for existing users
ALTER TABLE "User" ADD COLUMN "role" "Role" NOT NULL DEFAULT 'USER';

-- Index for role-based queries
CREATE INDEX "User_role_idx" ON "User"("role");
