import { Context } from 'hono'
import { prisma } from '../config/database.js'

export const getCareers = async (c: Context) => {
  const { universityId } = c.req.query()

  const careers = await prisma.career.findMany({
    where: {
      isActive: true,
      ...(universityId ? { universityId } : {}),
    },
    select: {
      id: true,
      name: true,
      totalCredits: true,
      durationSemesters: true,
      university: {
        select: { id: true, name: true, shortName: true, logoUrl: true },
      },
    },
    orderBy: [{ university: { name: 'asc' } }, { name: 'asc' }],
  })

  return c.json({ data: careers })
}

export const getCareerById = async (c: Context) => {
  const { id } = c.req.param()

  const career = await prisma.career.findUnique({
    where: { id },
    include: {
      university: {
        select: { id: true, name: true, shortName: true, logoUrl: true },
      },
      subjects: {
        orderBy: [{ semester: 'asc' }, { code: 'asc' }],
      },
    },
  })

  if (!career) return c.json({ error: 'Carrera no encontrada' }, 404)

  return c.json({ data: career })
}
