'use client'

export default function Loading() {
  return (
    <div className="min-h-screen bg-premium-mesh flex items-center justify-center px-6">
      <div className="glass-premium w-full max-w-sm rounded-[2rem] border border-border/30 p-8 text-center shadow-2xl">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-600 shadow-lg shadow-violet-500/30">
          <div className="h-7 w-7 rounded-full border-4 border-white/25 border-t-white animate-spin" />
        </div>
        <h2 className="text-xl font-black text-foreground">Loading workspace</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Preparing your dashboard and syncing the latest finance data.
        </p>
      </div>
    </div>
  )
}
