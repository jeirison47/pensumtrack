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

// Listar materias del pensum
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await assertAdmin(req)) return forbidden()
  const { id } = await params

  const pensum = await prisma.pensum.findUnique({
    where: { id },
    include: {
      career: { select: { name: true, university: { select: { name: true, shortName: true } } } },
      subjects: { orderBy: [{ semester: 'asc' }, { code: 'asc' }] },
    },
  })
  if (!pensum) return NextResponse.json({ error: 'Pensum no encontrado' }, { status: 404 })

  return NextResponse.json({
    data: {
      id: pensum.id,
      careerName: pensum.career.name,
      university: pensum.career.university,
      year: pensum.year,
      periodType: pensum.periodType,
      subjects: pensum.subjects,
    },
  })
}

const createSchema = z.object({
  code: z.string().min(1, 'Código requerido'),
  name: z.string().min(1, 'Nombre requerido'),
  credits: z.number().int().min(0),
  semester: z.number().int().min(0),
  periodLabel: z.string().nullable().optional(),
  area: z.string().nullable().optional(),
  prerequisites: z.array(z.string()).default([]),
  corequisites: z.array(z.string()).default([]),
})

// Crear materia en el pensum
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await assertAdmin(req)) return forbidden()
  const { id } = await params

  const pensum = await prisma.pensum.findUnique({ where: { id }, select: { careerId: true } })
  if (!pensum) return NextResponse.json({ error: 'Pensum no encontrado' }, { status: 404 })

  const result = createSchema.safeParse(await req.json())
  if (!result.success) return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 })
  const d = result.data

  try {
    const subject = await prisma.subject.create({
      data: {
        code: d.code.trim(),
        name: d.name.trim(),
        credits: d.credits,
        semester: d.semester,
        periodLabel: d.periodLabel?.trim() || null,
        area: d.area?.trim() || null,
        prerequisites: d.prerequisites,
        corequisites: d.corequisites,
        careerId: pensum.careerId,
        pensumId: id,
      },
    })
    return NextResponse.json({ data: subject }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Ya existe una materia con ese código en esta carrera' }, { status: 400 })
  }
}
