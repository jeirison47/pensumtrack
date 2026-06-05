export type PeriodType = 'semester' | 'quarter' | 'trimester'

export interface ParsedSubject {
  code: string
  name: string
  credits: number
  semester: number
  area: string | null
  prerequisites: string[]
  corequisites: string[]
}

export interface ParsedPensum {
  university: string
  career: string
  totalCredits: number
  durationSemesters: number
  periodType: PeriodType
  year: number
  subjects: ParsedSubject[]
  warnings: string[]
}

function parseFrontmatter(text: string): { fm: Record<string, string>; body: string } {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/)
  if (!match) throw new Error('No se encontró el encabezado (frontmatter). Asegúrate de que el archivo empiece con ---')

  const fm: Record<string, string> = {}
  for (const line of match[1].split(/\r?\n/)) {
    const colon = line.indexOf(':')
    if (colon === -1) continue
    const key = line.slice(0, colon).trim()
    const val = line.slice(colon + 1).trim()
    if (key) fm[key] = val
  }

  return { fm, body: text.slice(match[0].length) }
}

function parseTableRows(block: string): string[][] {
  const rows: string[][] = []
  for (const line of block.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed.startsWith('|')) continue
    if (/^\|[\s\-|]+\|$/.test(trimmed)) continue // separator row
    const cells = trimmed.split('|').slice(1, -1).map((c) => c.trim())
    if (cells.length > 0) rows.push(cells)
  }
  return rows
}

// ¿El token significa "todas las materias"? (TODAS, TODOS, "todas las materias"...)
function isAllPrereqToken(token: string): boolean {
  const up = token.trim().toUpperCase()
  return up === 'TODAS' || up === 'TODOS' || up.startsWith('TODAS ') || up.startsWith('TODOS ')
}

function normalizePeriodType(raw: string): PeriodType {
  const map: Record<string, PeriodType> = {
    semester: 'semester', semestre: 'semester',
    quarter: 'quarter', cuatrimestre: 'quarter',
    trimester: 'trimester', trimestre: 'trimester',
  }
  return map[raw.toLowerCase()] ?? 'semester'
}

export function parsePensum(text: string): ParsedPensum {
  const warnings: string[] = []
  const { fm, body } = parseFrontmatter(text)

  // Validate required fields
  const required = ['university', 'career', 'totalCredits', 'durationSemesters', 'year']
  for (const key of required) {
    if (!fm[key]) throw new Error(`Campo requerido faltante en el encabezado: "${key}"`)
  }

  const totalCredits = parseInt(fm.totalCredits)
  const durationSemesters = parseInt(fm.durationSemesters)
  const year = parseInt(fm.year)

  if (isNaN(totalCredits)) throw new Error('"totalCredits" debe ser un número')
  if (isNaN(durationSemesters)) throw new Error('"durationSemesters" debe ser un número')
  if (isNaN(year) || year < 1900 || year > 2100) throw new Error('"year" debe ser un año válido (ej: 2025)')

  const periodType = normalizePeriodType(fm.periodType ?? 'semester')

  // Split body into period sections
  const sections = body.split(/^##\s+/m).filter((s) => s.trim())
  if (sections.length === 0) throw new Error('No se encontraron secciones de período (## Período N)')

  const subjects: ParsedSubject[] = []
  const codesSeen = new Set<string>()

  for (const section of sections) {
    const lines = section.split(/\r?\n/)
    const header = lines[0].trim()

    // Extract period number from header (e.g. "Período 1", "Semestre 2", "1")
    const numMatch = header.match(/(\d+)/)
    if (!numMatch) { warnings.push(`Sección ignorada (no se encontró número de período): "${header}"`); continue }
    const semester = parseInt(numMatch[1])

    const tableBlock = lines.slice(1).join('\n')
    const rows = parseTableRows(tableBlock)

    // Skip header row (first row is column names)
    for (const row of rows.slice(1)) {
      const [code, name, creditsRaw, area, prereqRaw, coreqRaw] = row

      if (!code || !name) { warnings.push(`Fila incompleta ignorada en período ${semester}`); continue }

      const credits = parseInt(creditsRaw)
      if (isNaN(credits)) { warnings.push(`Créditos inválidos para "${code}" — fila ignorada`); continue }

      if (codesSeen.has(code)) {
        warnings.push(`Código duplicado "${code}" en período ${semester} — ignorado`)
        continue
      }
      codesSeen.add(code)

      const prerequisites = prereqRaw
        ? prereqRaw.split(',').map((s) => s.trim()).filter(Boolean)
        : []

      const corequisites = coreqRaw
        ? coreqRaw.split(',').map((s) => s.trim()).filter(Boolean)
        : []

      subjects.push({
        code,
        name,
        credits,
        semester,
        area: area && area !== '-' ? area : null,
        prerequisites,
        corequisites,
      })
    }
  }

  if (subjects.length === 0) throw new Error('No se encontraron materias en el archivo')

  // Expandir "TODAS"/"TODOS" → todas las demás materias del pensum
  // (convención para materias finales como pasantía o trabajo de grado).
  const allCodes = subjects.map((s) => s.code)
  for (const s of subjects) {
    if (s.prerequisites.some(isAllPrereqToken)) {
      s.prerequisites = allCodes.filter((c) => c !== s.code)
      warnings.push(`"${s.code}": el prerrequisito "TODAS" se expandió a las ${s.prerequisites.length} materias del pensum.`)
    }
  }

  // Warn about prerequisites that don't exist in the pensum
  for (const s of subjects) {
    for (const pre of s.prerequisites) {
      if (!codesSeen.has(pre)) {
        warnings.push(`Prerrequisito "${pre}" de "${s.code}" no existe en este pensum`)
      }
    }
    for (const co of s.corequisites) {
      if (!codesSeen.has(co)) {
        warnings.push(`Correquisito "${co}" de "${s.code}" no existe en este pensum`)
      }
    }
  }

  return {
    university: fm.university,
    career: fm.career,
    totalCredits,
    durationSemesters,
    periodType,
    year,
    subjects,
    warnings,
  }
}

export const PENSUM_TEMPLATE = `---
university: Nombre de la Universidad
career: Nombre de la Carrera
totalCredits: 150
durationSemesters: 7
periodType: semester
year: 2025
---

## Período 1

| Código | Materia | Créditos | Área | Prerrequisitos | Correquisitos |
|--------|---------|----------|------|----------------|---------------|
| INF101 | Introducción a la Programación | 4 | Informática | | |
| MAT101 | Matemática I | 3 | Ciencias | | |

## Período 2

| Código | Materia | Créditos | Área | Prerrequisitos | Correquisitos |
|--------|---------|----------|------|----------------|---------------|
| INF102 | Programación Orientada a Objetos | 4 | Informática | INF101 | |
| MAT102 | Matemática II | 3 | Ciencias | MAT101 | |
`

export const PERIOD_LABELS: Record<string, string> = {
  semester: 'Semestre',
  quarter: 'Cuatrimestre',
  trimester: 'Trimestre',
}
