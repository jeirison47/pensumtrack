import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  const config = await prisma.appConfig.findUnique({ where: { key: 'usd_dop_rate' } })

  if (config) {
    return NextResponse.json({
      data: {
        rate: parseFloat(config.value),
        updatedAt: config.updatedAt.toISOString(),
      },
    })
  }

  // Sin tasa guardada: consultar API externa como fallback
  try {
    const res = await fetch('https://open.exchangerate-api.com/v6/latest/USD')
    const json = await res.json()
    const rate = json?.rates?.DOP as number | undefined
    if (!rate) throw new Error()
    return NextResponse.json({ data: { rate, updatedAt: null, fromApi: true } })
  } catch {
    return NextResponse.json({ data: { rate: 60.5, updatedAt: null, fallback: true } })
  }
}
