import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const universityId = searchParams.get('universityId') ?? undefined
    const subjectName = searchParams.get('subject') ?? undefined
    const q = searchParams.get('q') ?? undefined

    const professors = await prisma.professor.findMany({
      where: {
        status: 'ACTIVE',
        ...(q ? { name: { contains: q, mode: 'insensitive' } } : {}),
        teachings: {
          some: {
            ...(universityId ? { universityId } : {}),
            ...(subjectName ? { subjectName: { contains: subjectName, mode: 'insensitive' } } : {}),
          },
        },
      },
      include: {
        teachings: {
          include: { university: { select: { id: true, name: true, shortName: true, logoUrl: true } } },
        },
        ratings: { select: { puntualidad: true, explicacion: true, dominio: true, exigencia: true, personalidad: true, apoyo: true } },
        _count: { select: { comments: true } },
      },
      orderBy: { name: 'asc' },
    })

    const data = professors.map((p) => {
      const avg = computeOverallAvg(p.ratings)
      return {
        id: p.id,
        name: p.name,
        photoUrl: p.photoUrl,
        bio: p.bio,
        overallAvg: avg,
        ratingsCount: p.ratings.length,
        commentsCount: p._count.comments,
        universities: [...new Map(
          p.teachings.map((t) => [t.university.id, t.university])
        ).values()],
        subjects: [...new Set(p.teachings.map((t) => t.subjectName))],
      }
    })

    return NextResponse.json({ data })
  } catch (err) {
    console.error('[professors/list]', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

function computeOverallAvg(ratings: { puntualidad: number; explicacion: number; dominio: number; exigencia: number; personalidad: number; apoyo: number }[]) {
  if (!ratings.length) return null
  const dims = ['puntualidad', 'explicacion', 'dominio', 'exigencia', 'personalidad', 'apoyo'] as const
  const total = ratings.reduce((sum, r) => sum + dims.reduce((s, d) => s + r[d], 0) / dims.length, 0)
  return Math.round((total / ratings.length) * 10) / 10
}
