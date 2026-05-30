import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getUserId } from '@/lib/auth-helper'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const userId = getUserId(request)

    const professor = await prisma.professor.findUnique({
      where: { id, status: 'ACTIVE' },
      include: {
        teachings: {
          include: {
            university: { select: { id: true, name: true, shortName: true, logoUrl: true } },
            ratings: {
              select: { puntualidad: true, explicacion: true, dominio: true, exigencia: true, personalidad: true, apoyo: true },
            },
          },
          orderBy: [{ universityId: 'asc' }, { subjectName: 'asc' }],
        },
        ratings: {
          select: { puntualidad: true, explicacion: true, dominio: true, exigencia: true, personalidad: true, apoyo: true, teachingId: true, userId: true },
        },
        comments: {
          include: { user: { select: { id: true, displayName: true, username: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!professor) return NextResponse.json({ error: 'Profesor no encontrado' }, { status: 404 })

    const dims = ['puntualidad', 'explicacion', 'dominio', 'exigencia', 'personalidad', 'apoyo'] as const

    const teachingsWithAvg = professor.teachings.map((t) => {
      const avg = t.ratings.length
        ? Object.fromEntries(dims.map((d) => [d, Math.round((t.ratings.reduce((s, r) => s + r[d], 0) / t.ratings.length) * 10) / 10]))
        : null
      const userRating = userId
        ? professor.ratings.find((r) => r.teachingId === t.id && r.userId === userId)
        : null
      return {
        id: t.id,
        university: t.university,
        subjectName: t.subjectName,
        schedule: t.schedule,
        ratingsCount: t.ratings.length,
        avg,
        userRating: userRating
          ? { puntualidad: userRating.puntualidad, explicacion: userRating.explicacion, dominio: userRating.dominio, exigencia: userRating.exigencia, personalidad: userRating.personalidad, apoyo: userRating.apoyo }
          : null,
      }
    })

    const allRatings = professor.ratings
    const overallAvg = allRatings.length
      ? Object.fromEntries(dims.map((d) => [d, Math.round((allRatings.reduce((s, r) => s + r[d], 0) / allRatings.length) * 10) / 10]))
      : null

    const comments = professor.comments.map((c) => ({
      id: c.id,
      content: c.content,
      isAnonymous: c.isAnonymous,
      createdAt: c.createdAt,
      user: c.isAnonymous ? null : { id: c.user.id, displayName: c.user.displayName, username: c.user.username },
    }))

    return NextResponse.json({
      data: {
        id: professor.id,
        name: professor.name,
        photoUrl: professor.photoUrl,
        bio: professor.bio,
        overallAvg,
        ratingsCount: allRatings.length,
        teachings: teachingsWithAvg,
        comments,
      },
    })
  } catch (err) {
    console.error('[professors/detail]', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
