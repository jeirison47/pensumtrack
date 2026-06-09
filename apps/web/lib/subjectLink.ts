import { prisma } from '@/lib/db'

// Construye un mapa nombre(normalizado) -> código de materia para una universidad,
// a partir de las materias reales de sus pensums. Si un nombre se repite en varias
// carreras, se queda con el primero.
export async function buildSubjectCodeMap(universityId: string): Promise<Map<string, string>> {
  const subjects = await prisma.subject.findMany({
    where: { career: { universityId } },
    select: { code: true, name: true },
  })
  const map = new Map<string, string>()
  for (const s of subjects) {
    const key = s.name.trim().toLowerCase()
    if (!map.has(key)) map.set(key, s.code)
  }
  return map
}

export function lookupCode(map: Map<string, string>, subjectName: string): string | null {
  return map.get(subjectName.trim().toLowerCase()) ?? null
}

// Resuelve el código de una materia (por nombre) dentro de una universidad.
export async function resolveSubjectCode(universityId: string, subjectName: string): Promise<string | null> {
  const map = await buildSubjectCodeMap(universityId)
  return lookupCode(map, subjectName)
}
