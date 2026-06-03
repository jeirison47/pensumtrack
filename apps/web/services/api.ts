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

  const text = await res.text()
  const json = text ? JSON.parse(text) : {}
  if (!res.ok) throw new Error(json.error ?? 'Error desconocido')
  return json
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export const authApi = {
  register: (email: string, username: string, password: string, displayName: string) =>
    request<{ data: { user: User; token: string } }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, username, password, displayName }),
    }),

  login: (identifier: string, password: string) =>
    request<{ data: { user: User; token: string } }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password }),
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

  addCareer: (careerId: string, currentSemester: number, pensumId?: string) =>
    request<{ data: StudentProfileFull }>('/progress/profile', {
      method: 'POST',
      body: JSON.stringify({ careerId, currentSemester, pensumId }),
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

// ─── Admin ─────────────────────────────────────────────────────────────────

export const adminApi = {
  stats: () => request<{ data: AdminStats }>('/admin/stats'),
  users: (q?: string, page?: number) =>
    request<{ data: AdminUserList }>(`/admin/users?q=${q ?? ''}&page=${page ?? 1}`),
  toggleAdmin: (id: string, isAdmin: boolean) =>
    request<{ data: User }>(`/admin/users/${id}/admin`, {
      method: 'PATCH',
      body: JSON.stringify({ isAdmin }),
    }),
  toggleActive: (id: string, isActive: boolean) =>
    request<{ data: User }>(`/admin/users/${id}/active`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive }),
    }),
  assignPlan: (id: string, planId: string | null) =>
    request<{ data: User }>(`/admin/users/${id}/plan`, {
      method: 'PATCH',
      body: JSON.stringify({ planId }),
    }),
  resetPassword: (id: string, newPassword: string) =>
    request<{ data: { message: string } }>(`/admin/users/${id}/reset-password`, {
      method: 'PATCH',
      body: JSON.stringify({ newPassword }),
    }),
  deleteUser: (id: string) =>
    request<{ data: { id: string } }>(`/admin/users/${id}`, { method: 'DELETE' }),
  bulkAction: (ids: string[], action: 'delete' | 'activate' | 'deactivate' | 'assign_plan', planId?: string | null) =>
    request<{ data: { affected: number } }>('/admin/users/bulk', {
      method: 'POST',
      body: JSON.stringify({ ids, action, planId }),
    }),
  listPlans: () => request<{ data: Plan[] }>('/admin/plans'),
  createPlan: (data: { name: string; description?: string; price?: number | null; features: string[]; isDefault?: boolean }) =>
    request<{ data: Plan }>('/admin/plans', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  deletePlan: (id: string) =>
    request<{ data: { id: string } }>(`/admin/plans/${id}`, { method: 'DELETE' }),
  // Universities
  listUniversities: () => request<{ data: UniversityAdmin[] }>('/admin/universities'),
  createUniversity: (data: { name: string; shortName: string; country?: string; logoUrl?: string | null }) =>
    request<{ data: UniversityAdmin }>('/admin/universities', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateUniversity: (id: string, data: { name?: string; shortName?: string; country?: string; logoUrl?: string | null; isActive?: boolean }) =>
    request<{ data: UniversityAdmin }>(`/admin/universities/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deleteUniversity: (id: string) =>
    request<{ data: { id: string } }>(`/admin/universities/${id}`, { method: 'DELETE' }),
  // Careers
  listCareers: (universityId?: string) =>
    request<{ data: CareerAdmin[] }>(`/admin/careers${universityId ? `?universityId=${universityId}` : ''}`),
  createCareer: (data: { name: string; universityId: string }) =>
    request<{ data: CareerAdmin }>('/admin/careers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateCareer: (id: string, data: { name?: string; universityId?: string; isActive?: boolean }) =>
    request<{ data: CareerAdmin }>(`/admin/careers/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deleteCareer: (id: string) =>
    request<{ data: { id: string } }>(`/admin/careers/${id}`, { method: 'DELETE' }),
}

export const pensumApi = {
  preview: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    return fetch('/api/admin/pensums/preview', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    }).then(async (res) => {
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Error al parsear')
      return json as { data: ParsedPensum }
    })
  },
  import: (pensum: ParsedPensum, universityId?: string, careerId?: string) =>
    request<{ data: CareerVersion }>('/admin/pensums/import', {
      method: 'POST',
      body: JSON.stringify({ ...pensum, universityId, careerId }),
    }),
  list: () => request<{ data: CareerVersion[] }>('/admin/pensums'),
  toggleActive: (id: string, isActive: boolean) =>
    request<{ data: { id: string; isActive: boolean } }>(`/admin/pensums/${id}/active`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive }),
    }),
}

export const pensumRequestsApi = {
  listAdmin: () => request<{ data: PensumRequest[] }>('/admin/pensum-requests'),
  updateStatus: (id: string, status: PensumRequestStatus) =>
    request<{ data: PensumRequest }>(`/admin/pensum-requests/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface AdminStats {
  totalUsers: number
  totalUniversities: number
  totalCareers: number
  recentUsers: { id: string; email: string; displayName: string; createdAt: string }[]
}

export interface AdminUserList {
  users: (User & { isActive: boolean; plan?: { id: string; name: string } | null })[]
  total: number
  page: number
  pages: number
}

export interface User {
  id: string
  email: string
  username: string | null
  displayName: string
  isAdmin: boolean
  planName?: string | null
  planFeatures?: string[]
  planExpiresAt?: string | null
  planExpired?: boolean
  createdAt: string
  settings?: {
    id: string
    careerId: string
    currentSemester: number
  } | null
}

export interface Plan {
  id: string
  name: string
  description: string | null
  price: number | null
  isDefault: boolean
  createdAt: string
  features: { id: string; featureKey: string }[]
  _count: { users: number }
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

export interface UniversityAdmin {
  id: string
  name: string
  shortName: string
  country: string
  logoUrl: string | null
  isActive: boolean
  createdAt: string
  _count: { careers: number }
}

export interface CareerAdmin {
  id: string
  name: string
  universityId: string
  isActive: boolean
  createdAt: string
  university: { id: string; name: string; shortName: string }
  _count: { pensums: number; profiles: number }
}

export interface CareerSummary {
  id: string
  name: string
  university: { id: string; name: string; shortName: string; logoUrl: string | null }
  totalCredits: number
  durationSemesters: number
  year?: number | null
  activePensumId?: string | null
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
  year?: number | null
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
  startDate: string | null
  endDate: string | null
  status: PreselectionStatus
  subjects: string[]
  createdAt: string
}

export interface ProfileSummary {
  id: string
  careerId: string
  pensumId: string | null
  currentSemester: number
  isActive?: boolean
  career: {
    id: string
    name: string
    totalCredits: number
    durationSemesters: number
    university: { name: string; shortName: string; logoUrl: string | null }
  }
}

export interface PensumSummary {
  id: string
  year: number | null
  periodType: string
  totalCredits: number
  durationSemesters: number
  isActive: boolean
  subjects: Subject[]
}

export interface StudentProfileFull {
  id: string
  userId: string
  careerId: string
  pensumId: string | null
  currentSemester: number
  career: CareerWithSubjects & {
    university: { id: string; name: string; shortName: string; logoUrl: string | null }
  }
  pensum: PensumSummary | null
  subjects: StudentSubjectDB[]
  preselections: PreselectionDB[]
}

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
  periodType: 'semester' | 'quarter' | 'trimester'
  year: number
  subjects: ParsedSubject[]
  warnings: string[]
}

export type PensumRequestStatus = 'PENDING' | 'IN_REVIEW' | 'COMPLETED' | 'REJECTED'

export interface PensumRequest {
  id: string
  university: string
  career: string
  year: number | null
  periodType: string
  link: string | null
  comment: string | null
  status: PensumRequestStatus
  createdAt: string
  user: { id: string; displayName: string; email: string; username: string | null }
}

export interface CareerVersion {
  id: string
  name: string
  year: number | null
  periodType: string
  totalCredits: number
  durationSemesters: number
  isActive: boolean
  createdAt: string
  careerId?: string
  university: { id: string; name: string; shortName: string }
  _count: { subjects: number; profiles: number }
}
