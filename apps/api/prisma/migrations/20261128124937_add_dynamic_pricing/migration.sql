-- CreateEnum
CREATE TYPE "PricingRuleType" AS ENUM ('date_range', 'day_of_week', 'length_of_stay', 'occupancy', 'lead_time');

-- AlterTable
ALTER TABLE "room_types" ADD COLUMN     "baseCost" DECIMAL(10,2);

-- CreateTable
CREATE TABLE "pricing_rules" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "PricingRuleType" NOT NULL,
    "adjustmentPct" DECIMAL(5,2) NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "roomTypeId" TEXT,
    "startDate" DATE,
    "endDate" DATE,
    "daysOfWeek" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "minNights" INTEGER,
    "minLeadDays" INTEGER,
    "maxLeadDays" INTEGER,
    "minOccupancy" DECIMAL(5,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pricing_rules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pricing_rules_type_active_idx" ON "pricing_rules"("type", "active");

-- CreateIndex
CREATE INDEX "pricing_rules_roomTypeId_idx" ON "pricing_rules"("roomTypeId");

-- AddForeignKey
ALTER TABLE "pricing_rules" ADD CONSTRAINT "pricing_rules_roomTypeId_fkey" FOREIGN KEY ("roomTypeId") REFERENCES "room_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;
