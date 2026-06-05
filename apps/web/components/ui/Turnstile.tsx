'use client'

import { useEffect, useRef } from 'react'

const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'

interface TurnstileWindow extends Window {
  turnstile?: {
    render: (el: HTMLElement, opts: Record<string, unknown>) => string
    reset: (id?: string) => void
    remove: (id?: string) => void
  }
}

interface Props {
  onVerify: (token: string) => void
  onExpire?: () => void
}

// Widget de Cloudflare Turnstile. Si no hay site key configurada, no renderiza
// nada (para no bloquear desarrollo local sin claves).
export function Turnstile({ onVerify, onExpire }: Props) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetId = useRef<string | null>(null)

  // Guardamos los callbacks en refs para que el efecto solo dependa de la site key.
  const onVerifyRef = useRef(onVerify)
  const onExpireRef = useRef(onExpire)
  onVerifyRef.current = onVerify
  onExpireRef.current = onExpire

  useEffect(() => {
    if (!siteKey) return
    const win = window as TurnstileWindow
    let cancelled = false

    const renderWidget = () => {
      if (cancelled || !containerRef.current || !win.turnstile || widgetId.current) return
      widgetId.current = win.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        callback: (token: string) => onVerifyRef.current(token),
        'expired-callback': () => onExpireRef.current?.(),
        'error-callback': () => onExpireRef.current?.(),
        theme: 'auto',
      })
    }

    if (win.turnstile) {
      renderWidget()
    } else if (!document.querySelector(`script[src="${SCRIPT_SRC}"]`)) {
      const s = document.createElement('script')
      s.src = SCRIPT_SRC
      s.async = true
      s.defer = true
      s.onload = renderWidget
      document.head.appendChild(s)
    } else {
      const interval = setInterval(() => {
        if (win.turnstile) {
          clearInterval(interval)
          renderWidget()
        }
      }, 100)
      setTimeout(() => clearInterval(interval), 5000)
    }

    return () => {
      cancelled = true
      if (widgetId.current && win.turnstile) {
        try { win.turnstile.remove(widgetId.current) } catch { /* noop */ }
        widgetId.current = null
      }
    }
  }, [siteKey])

  if (!siteKey) return null
  return <div ref={containerRef} style={{ display: 'flex', justifyContent: 'center' }} />
}
