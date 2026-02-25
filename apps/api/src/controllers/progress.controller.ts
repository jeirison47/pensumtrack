import { Context } from 'hono'
import { z } from 'zod'
import { prisma } from '../config/database.js'

const createProfileSchema = z.object({
  careerId: z.string().min(1, 'careerId requerido'),
  currentSemester: z.number().int().min(1).max(20).default(1),
})

const updateSubjectSchema = z.object({
  subjectCode: z.string().min(1, 'subjectCode requerido'),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'PASSED', 'FAILED']),
  grade: z.number().min(0).max(100).optional(),
  period: z.string().optional(),
})

const updatePreselectionSchema = z.object({
  period: z.string().min(1, 'period requerido'),
  subjectCodes: z.array(z.string()),
})

// GET /api/progress/me
export const getMyProgress = async (c: Context) => {
  const userId = c.get('userId') as string

  const profile = await prisma.studentProfile.findUnique({
    where: { userId },
    include: {
      career: {
        include: {
          subjects: { orderBy: [{ semester: 'asc' }, { code: 'asc' }] },
        },
      },
      subjects: true,
      preselection: true,
    },
  })

  if (!profile) return c.json({ data: null })

  return c.json({ data: profile })
}

// POST /api/progress/profile  — crear o actualizar perfil de estudiante
export const upsertProfile = async (c: Context) => {
  const userId = c.get('userId') as string
  const body = await c.req.json()
  const result = createProfileSchema.safeParse(body)

  if (!result.success) {
    return c.json({ error: result.error.errors[0].message }, 400)
  }

  const { careerId, currentSemester } = result.data

  const career = await prisma.career.findUnique({ where: { id: careerId } })
  if (!career) return c.json({ error: 'Carrera no encontrada' }, 404)

  const profile = await prisma.studentProfile.upsert({
    where: { userId },
    create: { userId, careerId, currentSemester },
    update: { careerId, currentSemester },
    include: {
      career: {
        include: { subjects: { orderBy: [{ semester: 'asc' }, { code: 'asc' }] } },
      },
      subjects: true,
      preselection: true,
    },
  })

  return c.json({ data: profile })
}

// PUT /api/progress/subject  — actualizar estado de una materia
export const updateSubject = async (c: Context) => {
  const userId = c.get('userId') as string
  const body = await c.req.json()
  const result = updateSubjectSchema.safeParse(body)

  if (!result.success) {
    return c.json({ error: result.error.errors[0].message }, 400)
  }

  const { subjectCode, status, grade, period } = result.data

  const profile = await prisma.studentProfile.findUnique({ where: { userId } })
  if (!profile) return c.json({ error: 'Perfil no encontrado. Selecciona una carrera primero.' }, 404)

  const subject = await prisma.subject.findUnique({ where: { code: subjectCode } })
  if (!subject) return c.json({ error: 'Materia no encontrada' }, 404)

  const studentSubject = await prisma.studentSubject.upsert({
    where: { profileId_subjectCode: { profileId: profile.id, subjectCode } },
    create: { profileId: profile.id, subjectCode, status, grade, period },
    update: { status, grade, period },
  })

  return c.json({ data: studentSubject })
}

// PUT /api/progress/preselection  — actualizar preselección
export const updatePreselection = async (c: Context) => {
  const userId = c.get('userId') as string
  const body = await c.req.json()
  const result = updatePreselectionSchema.safeParse(body)

  if (!result.success) {
    return c.json({ error: result.error.errors[0].message }, 400)
  }

  const { period, subjectCodes } = result.data

  const profile = await prisma.studentProfile.findUnique({ where: { userId } })
  if (!profile) return c.json({ error: 'Perfil no encontrado. Selecciona una carrera primero.' }, 404)

  const preselection = await prisma.preselection.upsert({
    where: { profileId: profile.id },
    create: { profileId: profile.id, period, subjects: subjectCodes },
    update: { period, subjects: subjectCodes },
  })

  return c.json({ data: preselection })
}
