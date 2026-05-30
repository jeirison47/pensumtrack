import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getUserId, unauthorized, forbidden } from '@/lib/auth-helper'
import { prisma } from '@/lib/db'
import { sendProfessorUpdateRequestStatusEmail } from '@/lib/email'

const schema = z.object({ status: z.enum(['COMPLETED', 'REJECTED', 'IN_REVIEW']) })

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = getUserId(request)
  if (!userId) return unauthorized()

  const caller = await prisma.user.findUnique({ where: { id: userId }, select: { isAdmin: true } })
  if (!caller?.isAdmin) return forbidden()

  const { id } = await params
  const body = await request.json()
  const result = schema.safeParse(body)
  if (!result.success) return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 })

  const req = await prisma.professorUpdateRequest.findUnique({
    where: { id },
    include: {
      user: { select: { email: true, displayName: true } },
      professor: { select: { name: true } },
    },
  })
  if (!req) return NextResponse.json({ error: 'Solicitud no encontrada' }, { status: 404 })

  const updated = await prisma.professorUpdateRequest.update({
    where: { id },
    data: { status: result.data.status },
  })

  if (result.data.status === 'COMPLETED' || result.data.status === 'REJECTED') {
    await sendProfessorUpdateRequestStatusEmail(
      req.user.email,
      req.user.displayName,
      req.professor.name,
      result.data.status,
    )
  }

  return NextResponse.json({ data: updated })
}
