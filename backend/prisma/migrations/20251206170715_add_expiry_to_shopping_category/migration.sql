-- AlterTable
ALTER TABLE "ShoppingCategory" ADD COLUMN     "expiryDate" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "ShoppingCategory_expiryDate_idx" ON "ShoppingCategory"("expiryDate");
