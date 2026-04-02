-- AlterTable
ALTER TABLE "ShoppingItem" ADD COLUMN     "expenseId" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "notificationSettings" JSONB;
