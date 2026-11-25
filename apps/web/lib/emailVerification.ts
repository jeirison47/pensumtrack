// ─────────────────────────────────────────────────────────────────────────────
// INTERRUPTOR: verificación del correo con código al registrarse
//
// APAGADO por defecto (temporalmente), porque los correos no están llegando:
// Brevo rechaza los envíos desde Vercel (bloqueo por "IPs autorizadas").
//
// Mientras esté apagado:
//   - Al registrarse, la cuenta se crea al instante y la persona entra directo
//     al onboarding, sin pedir código.
//   - Al iniciar sesión, no se pide código a quien tenga el correo sin verificar.
//   - Las cuentas creadas así quedan con el correo "sin verificar" (es la verdad),
//     así el admin las distingue y, al volver a encender, se les pedirá el código
//     una sola vez en su próximo inicio de sesión.
//
// PARA VOLVER A ENCENDERLO (cuando los correos de Brevo ya lleguen):
//   En Vercel → proyecto pensumtrack → Settings → Environment Variables, crear
//   EMAIL_VERIFICATION_ENABLED = true (Production) y volver a desplegar.
// ─────────────────────────────────────────────────────────────────────────────
export const EMAIL_VERIFICATION_ENABLED = process.env.EMAIL_VERIFICATION_ENABLED === 'true'
