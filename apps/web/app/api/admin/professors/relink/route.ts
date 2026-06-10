import { NextRequest, NextResponse } from 'next/server'
import { getUserId, unauthorized, forbidden } from '@/lib/auth-helper'
import { prisma } from '@/lib/db'
import { relinkProfessorTeachings } from '@/lib/subjectLink'

// Religa las materias de profesores que estén sin código, contra las materias
// de los pensums cargados (todas las universidades). Acción manual del admin.
export async function POST(request: NextRequest) {
  const userId = getUserId(request)
  if (!userId) return unauthorized()
  const caller = await prisma.user.findUnique({ where: { id: userId }, select: { isAdmin: true } })
  if (!caller?.isAdmin) return forbidden()

  const universities = await prisma.university.findMany({ select: { id: true } })
  let linked = 0
  for (const u of universities) {
    linked += await relinkProfessorTeachings(u.id)
  }

  return NextResponse.json({ data: { linked } })
}
