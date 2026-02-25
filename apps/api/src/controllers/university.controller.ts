import { Context } from 'hono'
import { prisma } from '../config/database.js'

export const getUniversities = async (c: Context) => {
  const universities = await prisma.university.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      shortName: true,
      country: true,
      logoUrl: true,
      _count: { select: { careers: { where: { isActive: true } } } },
    },
    orderBy: { name: 'asc' },
  })

  return c.json({ data: universities })
}

export const getUniversityById = async (c: Context) => {
  const { id } = c.req.param()

  const university = await prisma.university.findUnique({
    where: { id },
    include: {
      careers: {
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          totalCredits: true,
          durationSemesters: true,
        },
        orderBy: { name: 'asc' },
      },
    },
  })

  if (!university) return c.json({ error: 'Universidad no encontrada' }, 404)

  return c.json({ data: university })
}
