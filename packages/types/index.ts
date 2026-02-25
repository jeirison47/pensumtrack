// ─── Pensum types ───────────────────────────────────────────────────────────

export interface Career {
  id: string
  name: string
  university: string
  totalCredits: number
  durationSemesters: number
  subjects: Subject[]
}

export interface Subject {
  code: string          // Ej: "TSO-001"
  name: string
  credits: number
  semester: number      // Cuatrimestre en el pensum (1–N)
  prerequisites: string[]
  corequisites: string[]
  area?: string | null
}

// ─── Student progress types ──────────────────────────────────────────────────

export type SubjectStatus =
  | 'pending'
  | 'in-progress'
  | 'passed'
  | 'failed'
  | 'preselected'
  | 'available'
  | 'locked'

export interface StudentSubject {
  subjectCode: string
  status: SubjectStatus
  grade?: number       // 0–100
  period?: string      // Ej: "2025-1"
}

export interface Preselection {
  period: string
  subjectCodes: string[]
}

export interface StudentProfile {
  careerId: string
  currentSemester: number
  subjects: StudentSubject[]
  preselection: Preselection | null
}

// ─── API response types ──────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T
  message?: string
}

export interface ApiError {
  error: string
  details?: unknown
}
