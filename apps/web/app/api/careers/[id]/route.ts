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
    },
  })

  if (!career) return NextResponse.json({ error: 'Carrera no encontrada' }, { status: 404 })
  return NextResponse.json({ data: career })
}
