import { NextRequest, NextResponse } from 'next/server'
import { getUserId, unauthorized } from '@/lib/auth-helper'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!getUserId(request)) return unauthorized()

  const { id } = await params
  const career = await prisma.career.findUnique({
    where: { id },
    include: {
      university: { select: { id: true, name: true, shortName: true, logoUrl: true } },
      subjects: { orderBy: [{ semester: 'asc' }, { code: 'asc' }] },
      pensums: {
        where: { isActive: true },
        orderBy: { year: 'desc' },
        take: 1,
        include: { subjects: { orderBy: [{ semester: 'asc' }, { code: 'asc' }] } },
      },
    },
  })

  if (!career) return NextResponse.json({ error: 'Carrera no encontrada' }, { status: 404 })

  const activePensum = career.pensums[0]

  return NextResponse.json({
    data: {
      id: career.id,
      name: career.name,
      university: career.university,
      totalCredits: activePensum?.totalCredits ?? career.totalCredits ?? 0,
      durationSemesters: activePensum?.durationSemesters ?? career.durationSemesters ?? 0,
      year: activePensum?.year ?? career.year ?? null,
      periodType: activePensum?.periodType ?? career.periodType ?? 'semester',
      subjects: activePensum?.subjects ?? career.subjects,
    },
  })
}
