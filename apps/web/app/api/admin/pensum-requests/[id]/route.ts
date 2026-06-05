import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getUserId, unauthorized, forbidden } from '@/lib/auth-helper'
import { prisma } from '@/lib/db'
import { sendRequestStatusEmail } from '@/lib/email'

const schema = z.object({
  status: z.enum(['PENDING', 'IN_REVIEW', 'COMPLETED', 'REJECTED']),
})

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = getUserId(request)
  if (!userId) return unauthorized()

  const caller = await prisma.user.findUnique({ where: { id: userId }, select: { isAdmin: true } })
  if (!caller?.isAdmin) return forbidden()

  const { id } = await params
  const body = await request.json()
  const result = schema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 })
  }

  const updated = await prisma.pensumRequest.update({
    where: { id },
    data: { status: result.data.status },
    include: { user: { select: { email: true, displayName: true } } },
  })

  // Notificar al estudiante cuando se aprueba o rechaza su solicitud
  if (result.data.status === 'COMPLETED' || result.data.status === 'REJECTED') {
    try {
      await sendRequestStatusEmail(
        updated.user.email,
        updated.user.displayName,
        updated.university,
        updated.career,
        result.data.status,
      )
    } catch { /* email no crítico */ }
  }

  return NextResponse.json({ data: updated })
}
