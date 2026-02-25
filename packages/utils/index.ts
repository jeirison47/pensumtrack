import type { Subject, StudentSubject, SubjectStatus } from '@pensumtrack/types'

// ─── Cálculo de estado de una materia ────────────────────────────────────────

/**
 * Calcula el estado de una materia para un estudiante dado su progreso actual.
 *
 * Reglas:
 *   passed      → el estudiante la marcó como aprobada
 *   in-progress → el estudiante la marcó como en curso
 *   preselected → está en la preselección activa
 *   available   → todos sus prerrequisitos están passed o in-progress
 *   locked      → al menos un prerrequisito no está passed/in-progress
 *   pending     → sin prerrequisitos y aún no iniciada (C1)
 */
export function calcSubjectStatus(
  subject: Subject,
  studentSubjects: StudentSubject[],
  preselectedCodes: string[] = [],
): SubjectStatus {
  const record = studentSubjects.find((s) => s.subjectCode === subject.code)

  if (record?.status === 'passed') return 'passed'
  if (record?.status === 'in-progress') return 'in-progress'
  if (record?.status === 'failed') return 'failed'
  if (preselectedCodes.includes(subject.code)) return 'preselected'

  if (subject.prerequisites.length === 0) return 'available'

  const allMet = subject.prerequisites.every((prereq) => {
    const prereqRecord = studentSubjects.find((s) => s.subjectCode === prereq)
    return prereqRecord?.status === 'passed' || prereqRecord?.status === 'in-progress'
  })

  return allMet ? 'available' : 'locked'
}

// ─── Materias que desbloquea al aprobar una materia ──────────────────────────

export function getUnlockedBySubject(
  subjectCode: string,
  allSubjects: Subject[],
  studentSubjects: StudentSubject[],
  preselectedCodes: string[] = [],
): Subject[] {
  return allSubjects.filter((s) => {
    if (!s.prerequisites.includes(subjectCode)) return false
    const currentStatus = calcSubjectStatus(s, studentSubjects, preselectedCodes)
    return currentStatus === 'locked'
  })
}

// ─── Validación de preselección ──────────────────────────────────────────────

const MAX_SUBJECTS = 5
const MAX_CREDITS = 20

export interface PreselectionWarning {
  type: 'max-subjects' | 'max-credits'
  message: string
}

export function validatePreselection(
  selectedCodes: string[],
  allSubjects: Subject[],
): PreselectionWarning[] {
  const warnings: PreselectionWarning[] = []
  const selected = allSubjects.filter((s) => selectedCodes.includes(s.code))
  const totalCredits = selected.reduce((sum, s) => sum + s.credits, 0)

  if (selected.length > MAX_SUBJECTS) {
    warnings.push({
      type: 'max-subjects',
      message: `Tienes ${selected.length} materias seleccionadas. Se recomienda un máximo de ${MAX_SUBJECTS}.`,
    })
  }

  if (totalCredits > MAX_CREDITS) {
    warnings.push({
      type: 'max-credits',
      message: `Tienes ${totalCredits} créditos seleccionados. Se recomienda un máximo de ${MAX_CREDITS}.`,
    })
  }

  return warnings
}

// ─── Stats de progreso ───────────────────────────────────────────────────────

export function calcProgressStats(
  allSubjects: Subject[],
  studentSubjects: StudentSubject[],
) {
  const passed = studentSubjects.filter((s) => s.status === 'passed').length
  const inProgress = studentSubjects.filter((s) => s.status === 'in-progress').length
  const totalCredits = allSubjects.reduce((sum, s) => sum + s.credits, 0)
  const earnedCredits = allSubjects
    .filter((s) => studentSubjects.find((ss) => ss.subjectCode === s.code && ss.status === 'passed'))
    .reduce((sum, s) => sum + s.credits, 0)

  return {
    totalSubjects: allSubjects.length,
    passed,
    inProgress,
    totalCredits,
    earnedCredits,
    percentComplete: totalCredits > 0 ? Math.round((earnedCredits / totalCredits) * 100) : 0,
  }
}
