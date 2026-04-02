'use client'

import { lazy, Suspense } from 'react'

// Lazy load heavy modal components
const AddExpenseModal = lazy(() => import('./AddExpenseModal'))
const AddIncomeModal = lazy(() => import('./AddIncomeModal'))
const ReportsModal = lazy(() => import('./ReportsModal'))
const CategoryDetailsModal = lazy(() => import('./CategoryDetailsModal'))

// Loading fallback for modals
const ModalLoader = () => (
  <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[100] flex items-center justify-center">
    <div className="glass-premium rounded-2xl p-8 flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
      <p className="text-sm text-muted-foreground">Loading...</p>
    </div>
  </div>
)

// Wrapped components with Suspense
export const LazyAddExpenseModal = (props: any) => (
  <Suspense fallback={props.isOpen ? <ModalLoader /> : null}>
    <AddExpenseModal {...props} />
  </Suspense>
)

export const LazyAddIncomeModal = (props: any) => (
  <Suspense fallback={props.isOpen ? <ModalLoader /> : null}>
    <AddIncomeModal {...props} />
  </Suspense>
)

export const LazyReportsModal = (props: any) => (
  <Suspense fallback={props.isOpen ? <ModalLoader /> : null}>
    <ReportsModal {...props} />
  </Suspense>
)

export const LazyCategoryDetailsModal = (props: any) => (
  <Suspense fallback={props.isOpen ? <ModalLoader /> : null}>
    <CategoryDetailsModal {...props} />
  </Suspense>
)
