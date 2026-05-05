import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getUserId, unauthorized } from '@/lib/auth-helper'
import { prisma } from '@/lib/db'

const schema = z.object({
  label: z.string().min(1, 'El nombre del período es requerido'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
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

    const { label } = result.data

    const profile = await prisma.studentProfile.findFirst({ where: { userId } })
    if (!profile) return NextResponse.json({ error: 'Perfil no encontrado' }, { status: 404 })

    const preselection = await prisma.preselection.create({
      data: {
        profileId: profile.id,
        period: label,
        subjects: [],
      },
    })

    return NextResponse.json({ data: preselection }, { status: 201 })
  } catch (err) {
    console.error('[preselections POST]', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
