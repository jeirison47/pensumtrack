import { Context } from 'hono'
import { prisma } from '../config/database.js'

export const getCareers = async (c: Context) => {
  const careers = await prisma.career.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      university: true,
      totalCredits: true,
      durationSemesters: true,
    },
    orderBy: [{ university: 'asc' }, { name: 'asc' }],
  })

  return c.json({ data: careers })
}

export const getCareerById = async (c: Context) => {
  const { id } = c.req.param()

  const career = await prisma.career.findUnique({
    where: { id },
    include: {
      subjects: {
        orderBy: [{ semester: 'asc' }, { code: 'asc' }],
      },
    },
  })

  if (!career) return c.json({ error: 'Carrera no encontrada' }, 404)

  return c.json({ data: career })
}
