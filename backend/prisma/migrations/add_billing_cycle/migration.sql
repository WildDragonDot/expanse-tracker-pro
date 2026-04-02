-- Add billing cycle start day to User table
ALTER TABLE "User" ADD COLUMN "billingCycleStartDay" INTEGER NOT NULL DEFAULT 1;

-- Add comment
COMMENT ON COLUMN "User"."billingCycleStartDay" IS 'Day of month when billing cycle starts (1-31). Used for monthly expense calculations.';
