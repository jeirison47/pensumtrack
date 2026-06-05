import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

// Si ya hay sesión (token en localStorage), redirige al dashboard.
// Devuelve `checking`: true mientras decide, para mostrar un loader y evitar
// que se vea el formulario un instante antes de redirigir.
export function useRedirectIfAuth() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('token')) {
      router.replace('/dashboard')
    } else {
      setChecking(false)
    }
  }, [router])

  return checking
}
