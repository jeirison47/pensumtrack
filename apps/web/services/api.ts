const BASE_URL = '/api'

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

  profiles: () => request<{ data: ProfileSummary[] }>('/progress/profiles'),

  addCareer: (careerId: string, currentSemester: number) =>
    request<{ data: StudentProfileFull }>('/progress/profile', {
      method: 'POST',
      body: JSON.stringify({ careerId, currentSemester }),
    }),

  switchCareer: (profileId: string) =>
    request<{ data: { id: string; isActive: boolean } }>(`/progress/profiles/${profileId}/active`, {
      method: 'PUT',
    }),

  updateSubject: (subjectCode: string, status: SubjectStatusDB, grade?: number, period?: string) =>
    request<{ data: StudentSubjectDB }>('/progress/subject', {
      method: 'PUT',
      body: JSON.stringify({ subjectCode, status, grade, period }),
    }),

  createPeriod: (label: string, startDate: string, endDate: string) =>
    request<{ data: PreselectionDB }>('/progress/preselections', {
      method: 'POST',
      body: JSON.stringify({ label, startDate, endDate }),
    }),

  updatePeriodSubjects: (id: string, subjectCodes: string[]) =>
    request<{ data: PreselectionDB }>(`/progress/preselections/${id}/subjects`, {
      method: 'PUT',
      body: JSON.stringify({ subjectCodes }),
    }),

  confirmPeriod: (id: string) =>
    request<{ data: PreselectionDB }>(`/progress/preselections/${id}/confirm`, {
      method: 'PUT',
    }),

  closePeriod: (id: string, results: { subjectCode: string; status: 'PASSED' | 'FAILED'; grade?: number }[]) =>
    request<{ data: PreselectionDB }>(`/progress/preselections/${id}/close`, {
      method: 'PUT',
      body: JSON.stringify({ results }),
    }),

  deletePeriod: (id: string) =>
    request<{ data: { id: string } }>(`/progress/preselections/${id}`, {
      method: 'DELETE',
    }),
}

// ─── User ─────────────────────────────────────────────────────────────────────

export const userApi = {
  updateProfile: (data: { displayName?: string; currentPassword?: string; newPassword?: string }) =>
    request<{ data: User }>('/auth/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
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

export type PreselectionStatus = 'OPEN' | 'CONFIRMED' | 'CLOSED'

export interface PreselectionDB {
  id: string
  label: string
  startDate: string
  endDate: string
  status: PreselectionStatus
  subjects: string[]
  createdAt: string
}

export interface ProfileSummary {
  id: string
  careerId: string
  currentSemester: number
  isActive: boolean
  career: {
    id: string
    name: string
    totalCredits: number
    durationSemesters: number
    university: { name: string; shortName: string; logoUrl: string | null }
  }
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
