const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api'

function getToken() {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('token')
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken()
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  })

  const json = await res.json()
  if (!res.ok) throw new Error(json.error ?? 'Error desconocido')
  return json
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export const authApi = {
  register: (email: string, password: string, displayName: string) =>
    request<{ data: { user: User; token: string } }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, displayName }),
    }),

  login: (email: string, password: string) =>
    request<{ data: { user: User; token: string } }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  me: () => request<{ data: User }>('/auth/me'),
}

// ─── Universities ─────────────────────────────────────────────────────────────

export const universityApi = {
  list: () => request<{ data: UniversitySummary[] }>('/universities'),
  get: (id: string) => request<{ data: UniversityWithCareers }>(`/universities/${id}`),
}

// ─── Careers ─────────────────────────────────────────────────────────────────

export const careerApi = {
  list: (universityId?: string) =>
    request<{ data: CareerSummary[] }>(`/careers${universityId ? `?universityId=${universityId}` : ''}`),
  get: (id: string) => request<{ data: CareerWithSubjects }>(`/careers/${id}`),
}

// ─── Progress ─────────────────────────────────────────────────────────────────

export const progressApi = {
  me: () => request<{ data: StudentProfileFull | null }>('/progress/me'),

  upsertProfile: (careerId: string, currentSemester: number) =>
    request<{ data: StudentProfileFull }>('/progress/profile', {
      method: 'POST',
      body: JSON.stringify({ careerId, currentSemester }),
    }),

  updateSubject: (subjectCode: string, status: SubjectStatusDB, grade?: number, period?: string) =>
    request<{ data: StudentSubjectDB }>('/progress/subject', {
      method: 'PUT',
      body: JSON.stringify({ subjectCode, status, grade, period }),
    }),

  updatePreselection: (period: string, subjectCodes: string[]) =>
    request<{ data: { period: string; subjects: string[] } }>('/progress/preselection', {
      method: 'PUT',
      body: JSON.stringify({ period, subjectCodes }),
    }),
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface User {
  id: string
  email: string
  displayName: string
  isAdmin: boolean
  createdAt: string
  settings?: {
    id: string
    careerId: string
    currentSemester: number
  } | null
}

export interface UniversitySummary {
  id: string
  name: string
  shortName: string
  country: string
  logoUrl: string | null
  _count: { careers: number }
}

export interface UniversityWithCareers extends Omit<UniversitySummary, '_count'> {
  careers: Array<{
    id: string
    name: string
    totalCredits: number
    durationSemesters: number
  }>
}

export interface CareerSummary {
  id: string
  name: string
  university: { id: string; name: string; shortName: string; logoUrl: string | null }
  totalCredits: number
  durationSemesters: number
}

export interface Subject {
  code: string
  name: string
  credits: number
  semester: number
  area: string | null
  prerequisites: string[]
  corequisites: string[]
}

export interface CareerWithSubjects extends CareerSummary {
  subjects: Subject[]
}

export type SubjectStatusDB = 'PENDING' | 'IN_PROGRESS' | 'PASSED' | 'FAILED'

export interface StudentSubjectDB {
  id: string
  subjectCode: string
  status: SubjectStatusDB
  grade: number | null
  period: string | null
}

export interface PreselectionDB {
  id: string
  period: string
  subjects: string[]
}

export interface StudentProfileFull {
  id: string
  userId: string
  careerId: string
  currentSemester: number
  career: CareerWithSubjects
  subjects: StudentSubjectDB[]
  preselections: PreselectionDB[]
}
