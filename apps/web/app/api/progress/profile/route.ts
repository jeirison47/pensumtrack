import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getUserId, unauthorized } from '@/lib/auth-helper'
import { prisma } from '@/lib/db'

const schema = z.object({
  careerId: z.string().min(1, 'careerId requerido'),
  currentSemester: z.number().int().min(1).max(20).default(1),
})

export async function POST(request: NextRequest) {
  try {
    const userId = getUserId(request)
    if (!userId) return unauthorized()

    const body = await request.json()
    const result = schema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 })
    }

    const { careerId, currentSemester } = result.data

    const career = await prisma.career.findUnique({ where: { id: careerId } })
    if (!career) return NextResponse.json({ error: 'Carrera no encontrada' }, { status: 404 })

    // Verificar si ya tiene esta carrera
    const existing = await prisma.studentProfile.findUnique({
      where: { userId_careerId: { userId, careerId } },
    })
    if (existing) {
      return NextResponse.json({ error: 'Ya tienes esta carrera agregada' }, { status: 400 })
    }

    // Primera carrera del usuario → activa; adicionales → inactivas por defecto
    const hasProfiles = await prisma.studentProfile.count({ where: { userId } })
    const isActive = hasProfiles === 0

    const profile = await prisma.studentProfile.create({
      data: { userId, careerId, currentSemester, isActive },
      include: {
        career: { include: { subjects: { orderBy: [{ semester: 'asc' }, { code: 'asc' }] } } },
        subjects: true,
        preselections: { orderBy: { createdAt: 'asc' } },
      },
    })

    return NextResponse.json({ data: profile }, { status: 201 })
  } catch (err) {
    console.error('[profile/create]', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
