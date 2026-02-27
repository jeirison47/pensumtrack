import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getUserId, unauthorized } from '@/lib/auth-helper'
import { prisma } from '@/lib/db'

const schema = z.object({
  label: z.string().min(1, 'El nombre del período es requerido'),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
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

    const { label, startDate, endDate } = result.data

    const profile = await prisma.studentProfile.findFirst({ where: { userId, isActive: true } })
    if (!profile) return NextResponse.json({ error: 'Perfil no encontrado' }, { status: 404 })

    // Solo 1 período activo (OPEN o CONFIRMED) a la vez
    const active = await prisma.preselection.findFirst({
      where: { profileId: profile.id, status: { in: ['OPEN', 'CONFIRMED'] } },
    })
    if (active) {
      return NextResponse.json(
        { error: 'Ya tienes un período activo. Ciérralo antes de crear uno nuevo.' },
        { status: 409 },
      )
    }

    const preselection = await prisma.preselection.create({
      data: {
        profileId: profile.id,
        label,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        status: 'OPEN',
        subjects: [],
      },
    })

    return NextResponse.json({ data: preselection }, { status: 201 })
  } catch (err) {
    console.error('[preselections POST]', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
