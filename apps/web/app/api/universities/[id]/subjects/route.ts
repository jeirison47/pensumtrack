import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const subjects = await prisma.subject.findMany({
    where: { career: { universityId: id, isActive: true } },
    select: { name: true },
    distinct: ['name'],
    orderBy: { name: 'asc' },
  })
  return NextResponse.json({ data: subjects.map((s) => s.name) })
}
