import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const res = await fetch('https://open.exchangerate-api.com/v6/latest/USD', {
      next: { revalidate: 3600 }, // cachea 1 hora en el edge
    })
    const json = await res.json()
    const rate = json?.rates?.DOP as number | undefined
    if (!rate) throw new Error('No se obtuvo la tasa')
    return NextResponse.json({ data: { rate, updatedAt: json.time_last_update_utc } })
  } catch {
    // Fallback con tasa aproximada si la API falla
    return NextResponse.json({ data: { rate: 60.5, updatedAt: null, fallback: true } })
  }
}
