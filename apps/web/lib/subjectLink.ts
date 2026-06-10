import { prisma } from '@/lib/db'

// Normaliza un nombre de materia para comparar: sin acentos, minúsculas,
// números romanos -> arábigos (I/II/III/IV) y sin signos. Así "Administración I"
// y "Administración 1" se consideran la misma.
export function normalizeSubjectName(s: string): string {
  return s
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\biii\b/g, '3')
    .replace(/\biv\b/g, '4')
    .replace(/\bii\b/g, '2')
    .replace(/\bi\b/g, '1')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

// Mapa nombre(normalizado) -> código de materia para una universidad.
export async function buildSubjectCodeMap(universityId: string): Promise<Map<string, string>> {
  const subjects = await prisma.subject.findMany({
    where: { career: { universityId } },
    select: { code: true, name: true },
  })
  const map = new Map<string, string>()
  for (const s of subjects) {
    const key = normalizeSubjectName(s.name)
    if (!map.has(key)) map.set(key, s.code)
  }
  return map
}

export function lookupCode(map: Map<string, string>, subjectName: string): string | null {
  return map.get(normalizeSubjectName(subjectName)) ?? null
}

export async function resolveSubjectCode(universityId: string, subjectName: string): Promise<string | null> {
  const map = await buildSubjectCodeMap(universityId)
  return lookupCode(map, subjectName)
}

// Religa (rellena subjectCode) las materias de profesores de una universidad
// que estaban sin código y ahora calzan con alguna materia de pensum.
export async function relinkProfessorTeachings(universityId: string): Promise<number> {
  const map = await buildSubjectCodeMap(universityId)
  const unlinked = await prisma.professorTeaching.findMany({
    where: { universityId, subjectCode: null },
    select: { id: true, subjectName: true },
  })
  let linked = 0
  for (const t of unlinked) {
    const code = lookupCode(map, t.subjectName)
    if (code) {
      await prisma.professorTeaching.update({ where: { id: t.id }, data: { subjectCode: code } })
      linked++
    }
  }
  return linked
}
