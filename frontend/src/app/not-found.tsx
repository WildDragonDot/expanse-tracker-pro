import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-premium-mesh flex items-center justify-center px-6">
      <div className="glass-premium w-full max-w-md rounded-[2rem] border border-border/30 p-8 text-center shadow-2xl">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-violet-500">404</p>
        <h1 className="mt-3 text-3xl font-black text-foreground">Page not found</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          This route does not exist or may have been moved. Let&apos;s get you back to the dashboard.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/25"
        >
          Go to dashboard
        </Link>
      </div>
    </div>
  )
}
