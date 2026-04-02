-- DropForeignKey
ALTER TABLE "ExpensePlanning" DROP CONSTRAINT "ExpensePlanning_categoryId_fkey";

-- AddForeignKey
ALTER TABLE "ExpensePlanning" ADD CONSTRAINT "ExpensePlanning_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "PlanningCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
