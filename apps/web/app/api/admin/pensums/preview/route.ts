import { NextRequest, NextResponse } from 'next/server'
import { getUserId, unauthorized, forbidden } from '@/lib/auth-helper'
import { prisma } from '@/lib/db'
import { parsePensum } from '@/lib/parsePensum'

export async function POST(request: NextRequest) {
  const userId = getUserId(request)
  if (!userId) return unauthorized()

  const caller = await prisma.user.findUnique({ where: { id: userId }, select: { isAdmin: true } })
  if (!caller?.isAdmin) return forbidden()

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'No se recibió ningún archivo' }, { status: 400 })

    const ext = file.name.split('.').pop()?.toLowerCase()
    if (!ext || !['md', 'txt'].includes(ext)) {
      return NextResponse.json({ error: 'Solo se aceptan archivos .md y .txt' }, { status: 400 })
    }

    const text = await file.text()
    const parsed = parsePensum(text)

    return NextResponse.json({ data: parsed })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error al parsear el archivo'
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}
