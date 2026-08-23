-- AlterTable
ALTER TABLE "ShoppingCategory" ADD COLUMN     "membersCount" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "ShoppingList" ADD COLUMN     "actualPrice" DOUBLE PRECISION,
ADD COLUMN     "expenseId" TEXT;

-- AlterTable
ALTER TABLE "Udhar" ADD COLUMN     "dueDate" TIMESTAMP(3),
ADD COLUMN     "phoneNumber" TEXT;

