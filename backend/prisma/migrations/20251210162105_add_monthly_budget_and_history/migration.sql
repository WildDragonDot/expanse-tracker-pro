-- CreateTable
CREATE TABLE "MonthlyBudget" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "spent" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "resetDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MonthlyBudget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BudgetHistory" (
    "id" TEXT NOT NULL,
    "budgetId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "budgetedAmount" INTEGER NOT NULL,
    "spentAmount" INTEGER NOT NULL,
    "remainingAmount" INTEGER NOT NULL,
    "percentage" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BudgetHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MonthlyBudget_userId_idx" ON "MonthlyBudget"("userId");

-- CreateIndex
CREATE INDEX "MonthlyBudget_userId_month_year_idx" ON "MonthlyBudget"("userId", "month", "year");

-- CreateIndex
CREATE INDEX "MonthlyBudget_userId_isActive_idx" ON "MonthlyBudget"("userId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "MonthlyBudget_userId_category_month_year_key" ON "MonthlyBudget"("userId", "category", "month", "year");

-- CreateIndex
CREATE INDEX "BudgetHistory_userId_idx" ON "BudgetHistory"("userId");

-- CreateIndex
CREATE INDEX "BudgetHistory_budgetId_idx" ON "BudgetHistory"("budgetId");

-- CreateIndex
CREATE INDEX "BudgetHistory_userId_month_year_idx" ON "BudgetHistory"("userId", "month", "year");

-- AddForeignKey
ALTER TABLE "MonthlyBudget" ADD CONSTRAINT "MonthlyBudget_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetHistory" ADD CONSTRAINT "BudgetHistory_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "MonthlyBudget"("id") ON DELETE CASCADE ON UPDATE CASCADE;
