import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getUserId, unauthorized, forbidden } from '@/lib/auth-helper'
import { prisma } from '@/lib/db'

async function assertAdmin(req: NextRequest) {
  const userId = getUserId(req)
  if (!userId) return false
  const caller = await prisma.user.findUnique({ where: { id: userId }, select: { isAdmin: true } })
  return !!caller?.isAdmin
}

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  credits: z.number().int().min(0).optional(),
  semester: z.number().int().min(0).optional(),
  periodLabel: z.string().nullable().optional(),
  area: z.string().nullable().optional(),
  prerequisites: z.array(z.string()).optional(),
  corequisites: z.array(z.string()).optional(),
})

// Verifica que la materia (code) pertenezca a ese pensum y devuelve su careerId
async function findSubject(pensumId: string, code: string) {
  const pensum = await prisma.pensum.findUnique({ where: { id: pensumId }, select: { careerId: true } })
  if (!pensum) return null
  const subject = await prisma.subject.findUnique({
    where: { code_careerId: { code, careerId: pensum.careerId } },
    select: { code: true, careerId: true, pensumId: true },
  })
  if (!subject || subject.pensumId !== pensumId) return null
  return subject
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string; code: string }> }) {
  if (!await assertAdmin(req)) return forbidden()
  const { id, code } = await params
  const subjectCode = decodeURIComponent(code)

  const subject = await findSubject(id, subjectCode)
  if (!subject) return NextResponse.json({ error: 'Materia no encontrada en este pensum' }, { status: 404 })

  const result = updateSchema.safeParse(await req.json())
  if (!result.success) return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 })
  const d = result.data

  const updated = await prisma.subject.update({
    where: { code_careerId: { code: subject.code, careerId: subject.careerId } },
    data: {
      ...(d.name !== undefined ? { name: d.name.trim() } : {}),
      ...(d.credits !== undefined ? { credits: d.credits } : {}),
      ...(d.semester !== undefined ? { semester: d.semester } : {}),
      ...(d.periodLabel !== undefined ? { periodLabel: d.periodLabel?.trim() || null } : {}),
      ...(d.area !== undefined ? { area: d.area?.trim() || null } : {}),
      ...(d.prerequisites !== undefined ? { prerequisites: d.prerequisites } : {}),
      ...(d.corequisites !== undefined ? { corequisites: d.corequisites } : {}),
    },
  })
  return NextResponse.json({ data: updated })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string; code: string }> }) {
  if (!await assertAdmin(req)) return forbidden()
  const { id, code } = await params
  const subjectCode = decodeURIComponent(code)

  const subject = await findSubject(id, subjectCode)
  if (!subject) return NextResponse.json({ error: 'Materia no encontrada en este pensum' }, { status: 404 })

  await prisma.subject.delete({
    where: { code_careerId: { code: subject.code, careerId: subject.careerId } },
  })
  return NextResponse.json({ data: { ok: true } })
}
