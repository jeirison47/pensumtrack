const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email'
const SENDER = { name: 'PensumTrack App', email: 'pensumtrackapp@gmail.com' }

async function send(to: string, toName: string, subject: string, htmlContent: string) {
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
