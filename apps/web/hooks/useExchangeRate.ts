import { useQuery } from '@tanstack/react-query'

interface RateData {
  rate: number
  updatedAt: string | null
  fallback?: boolean
}

export function useExchangeRate() {
  const { data } = useQuery<{ data: RateData }>({
    queryKey: ['exchange-rate'],
    queryFn: () => fetch('/api/exchange-rate').then((r) => r.json()),
    staleTime: 1000 * 60 * 60, // 1 hora
    retry: 1,
  })

  const rate = data?.data?.rate ?? null

  function toDOP(usd: number): string {
    if (!rate) return '...'
    return Math.round(usd * rate).toLocaleString('es-DO')
  }

  return { rate, toDOP, updatedAt: data?.data?.updatedAt ?? null }
}
