import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getUserId, unauthorized } from '@/lib/auth-helper'
import { prisma } from '@/lib/db'

const schema = z.object({
  content: z.string().min(5, 'El comentario debe tener al menos 5 caracteres').max(500),
  isAnonymous: z.boolean().default(false),
})

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = getUserId(request)
  if (!userId) return unauthorized()

  try {
    const { id: professorId } = await params
    const body = await request.json()
    const result = schema.safeParse(body)
    if (!result.success) return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 })

    const professor = await prisma.professor.findUnique({
      where: { id: professorId, status: 'ACTIVE' },
      select: { teachings: { select: { universityId: true } } },
    })
    if (!professor) return NextResponse.json({ error: 'Profesor no encontrado' }, { status: 404 })

    // Verificar que el usuario pertenece a alguna universidad donde el profesor da clases
    const professorUniversityIds = [...new Set(professor.teachings.map((t) => t.universityId))]
    const userProfile = await prisma.studentProfile.findFirst({
      where: { userId, career: { universityId: { in: professorUniversityIds } } },
    })
    if (!userProfile) {
      return NextResponse.json(
        { error: 'Solo pueden comentar estudiantes de las universidades donde el profesor da clases' },
        { status: 403 },
      )
    }

    const comment = await prisma.professorComment.create({
      data: { userId, professorId, content: result.data.content, isAnonymous: result.data.isAnonymous },
      include: { user: { select: { id: true, displayName: true, username: true } } },
    })

    return NextResponse.json({
      data: {
        id: comment.id,
        content: comment.content,
        isAnonymous: comment.isAnonymous,
        createdAt: comment.createdAt,
        user: comment.isAnonymous ? null : { id: comment.user.id, displayName: comment.user.displayName, username: comment.user.username },
      },
    })
  } catch (err) {
    console.error('[professors/comment]', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
