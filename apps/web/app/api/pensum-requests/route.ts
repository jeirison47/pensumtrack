import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getUserId, unauthorized } from '@/lib/auth-helper'
import { prisma } from '@/lib/db'

const schema = z.object({
  university: z.string().min(2, 'Escribe el nombre de la universidad'),
  career: z.string().min(2, 'Escribe el nombre de la carrera'),
  year: z.number().int().min(1990).max(2100).optional(),
  periodType: z.enum(['semester', 'quarter', 'trimester']).default('semester'),
  link: z.string().url('El enlace no es válido').optional().or(z.literal('')),
  comment: z.string().max(500, 'Máximo 500 caracteres').optional(),
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

    const { university, career, year, periodType, link, comment } = result.data

    const pensum = await prisma.pensumRequest.create({
      data: {
        userId,
        university,
        career,
        year: year ?? null,
        periodType,
        link: link || null,
        comment: comment || null,
      },
    })

    return NextResponse.json({ data: pensum }, { status: 201 })
  } catch (err) {
    console.error('[pensum-requests POST]', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
