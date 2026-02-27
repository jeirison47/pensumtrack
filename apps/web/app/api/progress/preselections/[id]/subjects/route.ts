import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getUserId, unauthorized } from '@/lib/auth-helper'
import { prisma } from '@/lib/db'

const schema = z.object({
  subjectCodes: z.array(z.string()),
})

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const userId = getUserId(request)
    if (!userId) return unauthorized()

    const { id } = await params

    const body = await request.json()
    const result = schema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 })
    }

    const { subjectCodes } = result.data

    const profile = await prisma.studentProfile.findFirst({ where: { userId, isActive: true } })
    if (!profile) return NextResponse.json({ error: 'Perfil no encontrado' }, { status: 404 })

    const preselection = await prisma.preselection.findFirst({
      where: { id, profileId: profile.id },
    })
    if (!preselection) return NextResponse.json({ error: 'Período no encontrado' }, { status: 404 })

    if (preselection.status !== 'OPEN') {
      return NextResponse.json({ error: 'Solo puedes editar materias en períodos abiertos' }, { status: 409 })
    }

    const updated = await prisma.preselection.update({
      where: { id },
      data: { subjects: subjectCodes },
    })

    return NextResponse.json({ data: updated })
  } catch (err) {
    console.error('[preselections/subjects PUT]', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
