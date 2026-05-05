import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getUserId, unauthorized } from '@/lib/auth-helper'
import { prisma } from '@/lib/db'

const schema = z.object({
  careerId: z.string().min(1, 'careerId requerido'),
  pensumId: z.string().optional(),
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
    let { pensumId } = result.data

    const career = await prisma.career.findUnique({ where: { id: careerId } })
    if (!career) return NextResponse.json({ error: 'Carrera no encontrada' }, { status: 404 })

    const existing = await prisma.studentProfile.findFirst({ where: { userId, careerId } })
    if (existing) {
      return NextResponse.json({ error: 'Ya tienes esta carrera agregada' }, { status: 400 })
    }

    // Auto-select active pensum if not provided
    if (!pensumId) {
      const activePensum = await prisma.pensum.findFirst({
        where: { careerId, isActive: true },
        orderBy: { createdAt: 'desc' },
      })
      pensumId = activePensum?.id
    }

    const profile = await prisma.studentProfile.create({
      data: { userId, careerId, pensumId: pensumId ?? null, currentSemester },
      include: {
        career: {
          include: {
            university: { select: { id: true, name: true, shortName: true, logoUrl: true } },
            subjects: { orderBy: [{ semester: 'asc' }, { code: 'asc' }] },
          },
        },
        pensum: {
          include: {
            subjects: { orderBy: [{ semester: 'asc' }, { code: 'asc' }] },
          },
        },
        subjects: true,
        preselections: { orderBy: { createdAt: 'asc' } },
      },
    })

    return NextResponse.json({ data: { ...profile, preselections: [] } }, { status: 201 })
  } catch (err) {
    console.error('[profile/create]', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
