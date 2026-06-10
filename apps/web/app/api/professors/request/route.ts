import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getUserId, unauthorized } from '@/lib/auth-helper'
import { prisma } from '@/lib/db'

const schema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  universityId: z.string().optional(),
  universityName: z.string().optional(),
  subjects: z.array(z.string().min(2)).min(1, 'Agrega al menos una materia'),
  schedule: z.array(z.enum(['MORNING', 'AFTERNOON', 'NIGHT'])).default([]),
  bio: z.string().max(500).optional(),
  comment: z.string().max(500).optional(),
})

export async function POST(request: NextRequest) {
  const userId = getUserId(request)
  if (!userId) return unauthorized()

  try {
    const body = await request.json()
    const result = schema.safeParse(body)
    if (!result.success) return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 })

    const { name, universityId, universityName, subjects, schedule, bio, comment } = result.data

    if (!universityId && !universityName) {
      return NextResponse.json({ error: 'Especifica la universidad' }, { status: 400 })
    }

    const req = await prisma.professorRequest.create({
      data: { userId, name, universityId, universityName, subjects, schedule, bio, comment },
    })

    return NextResponse.json({ data: req }, { status: 201 })
  } catch (err) {
    console.error('[professors/request]', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
