import { prisma } from '@/lib/db'

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email'
const SENDER = { name: 'PensumTrack App', email: 'pensumtrackapp@gmail.com' }

// ─── Fusible de correos: tope diario global (cuota Brevo = 300/día) ───────────
const DAILY_CAP = 250        // al llegar, se deja de enviar
const ALERT_THRESHOLD = 200  // se avisa al admin una vez al día
const ALERT_EMAIL = process.env.ADMIN_ALERT_EMAIL ?? SENDER.email

// Cuenta y consume un envío del cupo diario (contador en RateLimit por fecha).
async function consumeEmailQuota(): Promise<number> {
  const date = new Date().toISOString().slice(0, 10) // YYYY-MM-DD (UTC)
  const key = `email-quota:${date}`
  const tomorrow = new Date()
  tomorrow.setUTCHours(24, 0, 0, 0) // medianoche siguiente (para limpieza por cron)
  const row = await prisma.rateLimit.upsert({
    where: { key },
    create: { key, count: 1, resetAt: tomorrow },
    update: { count: { increment: 1 } },
  })
  return row.count
}

async function postToBrevo(to: string, toName: string, subject: string, htmlContent: string) {
  const res = await fetch(BREVO_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': process.env.BREVO_API_KEY ?? '',
    },
    body: JSON.stringify({
      sender: SENDER,
      to: [{ email: to, name: toName }],
      subject,
      htmlContent,
    }),
  })
  if (!res.ok) {
    const err = await res.text()
    console.error('[email] Brevo error:', err)
  }
}

async function send(to: string, toName: string, subject: string, htmlContent: string) {
  let count: number
  try {
    count = await consumeEmailQuota()
  } catch (err) {
    // Si el contador falla, no bloqueamos el envío
    console.error('[email] error en cuota:', err)
    return postToBrevo(to, toName, subject, htmlContent)
  }

  // Aviso al admin justo al cruzar el umbral (una sola vez al día)
  if (count === ALERT_THRESHOLD) {
    void postToBrevo(
      ALERT_EMAIL,
      'Admin',
      '⚠️ Volumen alto de correos — PensumTrack',
      `<div style="font-family:sans-serif"><p>Se han enviado <strong>${count}</strong> correos hoy (tope ${DAILY_CAP}). Si no lo esperabas, revisa posible abuso.</p></div>`,
    )
  }

  // Fusible: superado el tope diario, no se envía
  if (count > DAILY_CAP) {
    console.warn(`[email] cuota diaria (${DAILY_CAP}) superada — no se envía: "${subject}"`)
    return
  }

  return postToBrevo(to, toName, subject, htmlContent)
}

export function sendPasswordResetEmail(email: string, name: string, code: string) {
  return send(
    email,
    name,
    'Restablece tu contraseña — PensumTrack',
    `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#0b0d12;color:#e5e7eb;border-radius:16px">
      <div style="margin-bottom:8px">
        <span style="font-size:22px;font-weight:700;color:#10b981">PensumTrack</span>
      </div>
      <p style="color:#9ca3af;font-size:13px;margin-bottom:32px">Sistema de gestión de pensums universitarios</p>

      <h2 style="font-size:20px;font-weight:700;margin-bottom:8px;color:#f9fafb">Restablece tu contraseña</h2>
      <p style="font-size:14px;color:#9ca3af;margin-bottom:28px">
        Hola <strong style="color:#f9fafb">${name}</strong>, usa este código para crear una nueva contraseña.
        Expira en <strong style="color:#f9fafb">15 minutos</strong>.
      </p>

      <div style="background:#1a1d26;border:1px solid #2d3140;border-radius:12px;padding:24px;text-align:center;margin-bottom:28px">
        <span style="font-size:36px;font-weight:700;letter-spacing:10px;color:#10b981">${code}</span>
      </div>

      <p style="font-size:12px;color:#6b7280;margin-top:32px;border-top:1px solid #1f2335;padding-top:16px">
        Si no solicitaste cambiar tu contraseña, ignora este correo: tu cuenta sigue segura.
      </p>
    </div>
    `,
  )
}

export function sendOtpEmail(email: string, name: string, code: string) {
  return send(
    email,
    name,
    'Verifica tu correo — PensumTrack',
    `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#0b0d12;color:#e5e7eb;border-radius:16px">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px">
        <span style="font-size:22px;font-weight:700;color:#10b981">PensumTrack</span>
      </div>
      <p style="color:#9ca3af;font-size:13px;margin-bottom:32px">Sistema de gestión de pensums universitarios</p>

      <h2 style="font-size:20px;font-weight:700;margin-bottom:8px;color:#f9fafb">Verifica tu correo electrónico</h2>
      <p style="font-size:14px;color:#9ca3af;margin-bottom:28px">
        Hola <strong style="color:#f9fafb">${name}</strong>, usa el siguiente código para verificar tu cuenta.
        Expira en <strong style="color:#f9fafb">15 minutos</strong>.
      </p>

      <div style="background:#1a1d26;border:1px solid #2d3140;border-radius:12px;padding:24px;text-align:center;margin-bottom:28px">
        <span style="font-size:36px;font-weight:700;letter-spacing:10px;color:#10b981">${code}</span>
      </div>

      <p style="font-size:12px;color:#6b7280;margin-top:32px;border-top:1px solid #1f2335;padding-top:16px">
        Si no creaste una cuenta en PensumTrack, puedes ignorar este correo.
      </p>
    </div>
    `,
  )
}

export function sendPasswordChangedEmail(email: string, name: string) {
  return send(
    email,
    name,
    'Tu contraseña fue actualizada — PensumTrack',
    `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#0b0d12;color:#e5e7eb;border-radius:16px">
      <div style="margin-bottom:8px">
        <span style="font-size:22px;font-weight:700;color:#10b981">PensumTrack</span>
      </div>
      <p style="color:#9ca3af;font-size:13px;margin-bottom:32px">Sistema de gestión de pensums universitarios</p>

      <h2 style="font-size:20px;font-weight:700;margin-bottom:8px;color:#f9fafb">Contraseña actualizada</h2>
      <p style="font-size:14px;color:#9ca3af;margin-bottom:20px">
        Hola <strong style="color:#f9fafb">${name}</strong>, te informamos que la contraseña de tu cuenta fue cambiada exitosamente.
      </p>
      <p style="font-size:14px;color:#9ca3af;margin-bottom:28px">
        Si realizaste este cambio tú mismo, puedes ignorar este mensaje.<br/>
        Si <strong style="color:#f87171">no fuiste tú</strong>, contacta al soporte inmediatamente.
      </p>

      <div style="background:#1a1d26;border:1px solid #2d3140;border-radius:12px;padding:16px;margin-bottom:28px">
        <p style="font-size:13px;color:#9ca3af;margin:0">
          📧 Cuenta: <strong style="color:#f9fafb">${email}</strong>
        </p>
      </div>

      <p style="font-size:12px;color:#6b7280;margin-top:32px;border-top:1px solid #1f2335;padding-top:16px">
        Este correo fue enviado automáticamente. Por favor no respondas a este mensaje.
      </p>
    </div>
    `,
  )
}

export function sendProfessorRequestStatusEmail(
  email: string,
  name: string,
  professorName: string,
  status: 'COMPLETED' | 'REJECTED',
) {
  const approved = status === 'COMPLETED'
  return send(
    email,
    name,
    approved ? `Solicitud de profesor aprobada — PensumTrack` : `Solicitud de profesor no aprobada — PensumTrack`,
    `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#0b0d12;color:#e5e7eb;border-radius:16px">
      <div style="margin-bottom:8px"><span style="font-size:22px;font-weight:700;color:#10b981">PensumTrack</span></div>
      <p style="color:#9ca3af;font-size:13px;margin-bottom:32px">Sistema de gestión de pensums universitarios</p>
      <h2 style="font-size:20px;font-weight:700;margin-bottom:8px;color:#f9fafb">
        ${approved ? '¡Profesor agregado!' : 'Solicitud no aprobada'}
      </h2>
      <p style="font-size:14px;color:#9ca3af;margin-bottom:20px">
        Hola <strong style="color:#f9fafb">${name}</strong>,
        ${approved
          ? ` tu solicitud para agregar al profesor <strong style="color:#f9fafb">${professorName}</strong> fue aprobada y ya está disponible en PensumTrack.`
          : ` lamentamos informarte que la solicitud para agregar al profesor <strong style="color:#f9fafb">${professorName}</strong> no pudo ser aprobada.`}
      </p>
      <p style="font-size:12px;color:#6b7280;margin-top:32px;border-top:1px solid #1f2335;padding-top:16px">
        Este correo fue enviado automáticamente.
      </p>
    </div>
    `,
  )
}

export function sendProfessorUpdateRequestStatusEmail(
  email: string,
  name: string,
  professorName: string,
  status: 'COMPLETED' | 'REJECTED',
) {
  const approved = status === 'COMPLETED'
  return send(
    email,
    name,
    approved ? `Actualización de profesor aprobada — PensumTrack` : `Actualización de profesor rechazada — PensumTrack`,
    `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#0b0d12;color:#e5e7eb;border-radius:16px">
      <div style="margin-bottom:8px"><span style="font-size:22px;font-weight:700;color:#10b981">PensumTrack</span></div>
      <p style="color:#9ca3af;font-size:13px;margin-bottom:32px">Sistema de gestión de pensums universitarios</p>
      <h2 style="font-size:20px;font-weight:700;margin-bottom:8px;color:#f9fafb">
        ${approved ? 'Información actualizada' : 'Solicitud rechazada'}
      </h2>
      <p style="font-size:14px;color:#9ca3af;margin-bottom:20px">
        Hola <strong style="color:#f9fafb">${name}</strong>,
        ${approved
          ? ` tu solicitud de actualización para el profesor <strong style="color:#f9fafb">${professorName}</strong> fue aprobada y la información ya está actualizada.`
          : ` tu solicitud de actualización para el profesor <strong style="color:#f9fafb">${professorName}</strong> no pudo ser aprobada en este momento.`}
      </p>
      <p style="font-size:12px;color:#6b7280;margin-top:32px;border-top:1px solid #1f2335;padding-top:16px">
        Este correo fue enviado automáticamente.
      </p>
    </div>
    `,
  )
}

export function sendRequestStatusEmail(
  email: string,
  name: string,
  university: string,
  career: string,
  status: 'COMPLETED' | 'REJECTED',
) {
  const approved = status === 'COMPLETED'
  return send(
    email,
    name,
    approved
      ? `Tu carrera fue agregada — PensumTrack`
      : `Actualización sobre tu solicitud — PensumTrack`,
    `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#0b0d12;color:#e5e7eb;border-radius:16px">
      <div style="margin-bottom:8px">
        <span style="font-size:22px;font-weight:700;color:#10b981">PensumTrack</span>
      </div>
      <p style="color:#9ca3af;font-size:13px;margin-bottom:32px">Sistema de gestión de pensums universitarios</p>

      <div style="width:48px;height:48px;border-radius:50%;background:${approved ? 'rgba(16,185,129,0.12)' : 'rgba(248,113,113,0.12)'};display:flex;align-items:center;justify-content:center;margin-bottom:20px;font-size:22px">
        ${approved ? '✅' : '❌'}
      </div>

      <h2 style="font-size:20px;font-weight:700;margin-bottom:8px;color:#f9fafb">
        ${approved ? '¡Tu carrera ya está disponible!' : 'Solicitud no aprobada'}
      </h2>
      <p style="font-size:14px;color:#9ca3af;margin-bottom:20px">
        Hola <strong style="color:#f9fafb">${name}</strong>,
        ${approved
          ? ' nos alegra informarte que tu solicitud fue aprobada y la carrera ya está disponible en PensumTrack.'
          : ' lamentamos informarte que tu solicitud no pudo ser aprobada en este momento.'}
      </p>

      <div style="background:#1a1d26;border:1px solid #2d3140;border-radius:12px;padding:16px;margin-bottom:28px">
        <p style="font-size:13px;color:#9ca3af;margin:0 0 6px 0">🏛️ Universidad: <strong style="color:#f9fafb">${university}</strong></p>
        <p style="font-size:13px;color:#9ca3af;margin:0">🎓 Carrera: <strong style="color:#f9fafb">${career}</strong></p>
      </div>

      ${approved
        ? '<p style="font-size:14px;color:#9ca3af">Ya puedes buscarla desde la app y agregarla a tu perfil.</p>'
        : '<p style="font-size:14px;color:#9ca3af">Puedes enviar una nueva solicitud con más detalles si consideras que hubo un error.</p>'}

      <p style="font-size:12px;color:#6b7280;margin-top:32px;border-top:1px solid #1f2335;padding-top:16px">
        Este correo fue enviado automáticamente. Por favor no respondas a este mensaje.
      </p>
    </div>
    `,
  )
}

export function sendPlanExpiringEmail(
  email: string,
  name: string,
  planName: string,
  expiresAt: Date,
  daysLeft: number,
) {
  const fecha = expiresAt.toLocaleDateString('es-DO', { day: '2-digit', month: 'long', year: 'numeric' })
  return send(
    email,
    name,
    `Tu plan ${planName} vence pronto — PensumTrack`,
    `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#0b0d12;color:#e5e7eb;border-radius:16px">
      <div style="margin-bottom:8px">
        <span style="font-size:22px;font-weight:700;color:#10b981">PensumTrack</span>
      </div>
      <p style="color:#9ca3af;font-size:13px;margin-bottom:32px">Sistema de gestión de pensums universitarios</p>

      <div style="width:48px;height:48px;border-radius:50%;background:rgba(234,179,8,0.12);display:flex;align-items:center;justify-content:center;margin-bottom:20px;font-size:22px">⏳</div>

      <h2 style="font-size:20px;font-weight:700;margin-bottom:8px;color:#f9fafb">Tu plan vence en ${daysLeft} ${daysLeft === 1 ? 'día' : 'días'}</h2>
      <p style="font-size:14px;color:#9ca3af;margin-bottom:20px">
        Hola <strong style="color:#f9fafb">${name}</strong>, tu plan
        <strong style="color:#f9fafb">${planName}</strong> vence el
        <strong style="color:#f9fafb">${fecha}</strong>. Renueva tu pago para no perder el acceso a las funciones premium.
      </p>

      <div style="background:#1a1d26;border:1px solid #2d3140;border-radius:12px;padding:16px;margin-bottom:28px">
        <p style="font-size:13px;color:#9ca3af;margin:0">
          Para renovar, realiza el pago y envía el comprobante desde tu perfil en la app,
          o escríbenos por WhatsApp al <strong style="color:#f9fafb">809-980-9245</strong>.
        </p>
      </div>

      <p style="font-size:12px;color:#6b7280;margin-top:32px;border-top:1px solid #1f2335;padding-top:16px">
        Este correo fue enviado automáticamente. Por favor no respondas a este mensaje.
      </p>
    </div>
    `,
  )
}

export function sendPlanExpiredEmail(email: string, name: string, planName: string) {
  return send(
    email,
    name,
    `Tu plan ${planName} venció — PensumTrack`,
    `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#0b0d12;color:#e5e7eb;border-radius:16px">
      <div style="margin-bottom:8px">
        <span style="font-size:22px;font-weight:700;color:#10b981">PensumTrack</span>
      </div>
      <p style="color:#9ca3af;font-size:13px;margin-bottom:32px">Sistema de gestión de pensums universitarios</p>

      <div style="width:48px;height:48px;border-radius:50%;background:rgba(248,113,113,0.12);display:flex;align-items:center;justify-content:center;margin-bottom:20px;font-size:22px">🔒</div>

      <h2 style="font-size:20px;font-weight:700;margin-bottom:8px;color:#f9fafb">Tu plan ${planName} venció</h2>
      <p style="font-size:14px;color:#9ca3af;margin-bottom:20px">
        Hola <strong style="color:#f9fafb">${name}</strong>, tu plan venció y tu cuenta volvió al plan gratuito.
        Tu información sigue guardada; solo se pausaron las funciones premium.
      </p>

      <div style="background:#1a1d26;border:1px solid #2d3140;border-radius:12px;padding:16px;margin-bottom:28px">
        <p style="font-size:13px;color:#9ca3af;margin:0">
          Renueva cuando quieras desde tu perfil en la app o escríbenos por WhatsApp al
          <strong style="color:#f9fafb">809-980-9245</strong> para reactivar tu plan.
        </p>
      </div>

      <p style="font-size:12px;color:#6b7280;margin-top:32px;border-top:1px solid #1f2335;padding-top:16px">
        Este correo fue enviado automáticamente. Por favor no respondas a este mensaje.
      </p>
    </div>
    `,
  )
}

export function sendTrialActivatedEmail(email: string, name: string, planName: string, days: number, expiresAt: Date) {
  const fecha = expiresAt.toLocaleDateString('es-DO', { day: '2-digit', month: 'long', year: 'numeric' })
  return send(
    email,
    name,
    `¡Tu prueba ${planName} está activa! — PensumTrack`,
    `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#0b0d12;color:#e5e7eb;border-radius:16px">
      <div style="margin-bottom:8px">
        <span style="font-size:22px;font-weight:700;color:#10b981">PensumTrack</span>
      </div>
      <p style="color:#9ca3af;font-size:13px;margin-bottom:32px">Sistema de gestión de pensums universitarios</p>

      <div style="width:48px;height:48px;border-radius:50%;background:rgba(16,185,129,0.12);display:flex;align-items:center;justify-content:center;margin-bottom:20px;font-size:22px">✨</div>

      <h2 style="font-size:20px;font-weight:700;margin-bottom:8px;color:#f9fafb">¡Tu prueba ${planName} está activa!</h2>
      <p style="font-size:14px;color:#9ca3af;margin-bottom:20px">
        Hola <strong style="color:#f9fafb">${name}</strong>, activaste tu prueba gratis por
        <strong style="color:#f9fafb">${days} días</strong>. Ya tienes desbloqueadas todas las funciones premium.
      </p>

      <div style="background:#1a1d26;border:1px solid #2d3140;border-radius:12px;padding:16px;margin-bottom:28px">
        <p style="font-size:13px;color:#9ca3af;margin:0">
          Tu prueba vence el <strong style="color:#f9fafb">${fecha}</strong>. Al terminar, tu cuenta vuelve
          al plan gratuito automáticamente (tu información se conserva). Si quieres seguir con Premium,
          puedes pagar desde tu perfil antes de esa fecha.
        </p>
      </div>

      <p style="font-size:12px;color:#6b7280;margin-top:32px;border-top:1px solid #1f2335;padding-top:16px">
        Este correo fue enviado automáticamente. Por favor no respondas a este mensaje.
      </p>
    </div>
    `,
  )
}
