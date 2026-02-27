import jwt from 'jsonwebtoken'
import { NextRequest, NextResponse } from 'next/server'

export function getUserId(request: NextRequest): string | null {
  const auth = request.headers.get('Authorization')
  if (!auth?.startsWith('Bearer ')) return null
  const token = auth.replace('Bearer ', '')
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET ?? '') as { userId: string }
    return payload.userId
  } catch {
    return null
  }
}

export function unauthorized() {
  return NextResponse.json({ error: 'Token requerido' }, { status: 401 })
}
