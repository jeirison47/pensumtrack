import { NextResponse } from 'next/server'
import { getTrialDays } from '@/lib/trial'

export async function GET() {
  return NextResponse.json({ data: { days: await getTrialDays() } })
}
