import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  const plans = await prisma.plan.findMany({
    select: {
      id: true,
      name: true,
      description: true,
      price: true,
      isDefault: true,
      features: { select: { featureKey: true } },
    },
    orderBy: [{ price: 'asc' }, { createdAt: 'asc' }],
  })
  return NextResponse.json({ data: plans })
}
