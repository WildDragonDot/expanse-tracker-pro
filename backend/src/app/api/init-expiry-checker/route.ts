import { NextResponse } from 'next/server'
import { startExpiryChecker } from '@/lib/expiryChecker'

// Force dynamic rendering - initialization endpoint
export const dynamic = 'force-dynamic'

// This will be called once when the API route is first accessed
let initialized = false

export async function GET() {
  if (!initialized) {
    startExpiryChecker()
    initialized = true
    return NextResponse.json({ 
      message: 'Expiry checker initialized and running',
      status: 'started',
      interval: '5 minutes'
    })
  }
  
  return NextResponse.json({ 
    message: 'Expiry checker already running',
    status: 'running',
    interval: '5 minutes'
  })
}

export async function POST() {
  return GET()
}
