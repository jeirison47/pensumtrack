import { NextRequest, NextResponse } from 'next/server'
import { getUserId, unauthorized } from '@/lib/auth-helper'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!getUserId(request)) return unauthorized()

  const { id } = await params
  const university = await prisma.university.findUnique({
    where: { id },
    include: {
      careers: {
        where: { isActive: true },
        select: { id: true, name: true, totalCredits: true, durationSemesters: true },
        orderBy: { name: 'asc' },
      },
    },
  })

  if (!university) return NextResponse.json({ error: 'Universidad no encontrada' }, { status: 404 })
  return NextResponse.json({ data: university })
}
