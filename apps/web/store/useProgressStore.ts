import { create } from 'zustand'
import type { StudentProfileFull, SubjectStatusDB } from '@/services/api'

interface ProgressState {
  profile: StudentProfileFull | null
  setProfile: (profile: StudentProfileFull | null) => void
  updateSubjectLocally: (subjectCode: string, status: SubjectStatusDB) => void
  updatePreselectionLocally: (period: string, subjectCodes: string[]) => void
}

export const useProgressStore = create<ProgressState>((set) => ({
  profile: null,

  setProfile: (profile) => set({ profile }),

  updateSubjectLocally: (subjectCode, status) =>
    set((state) => {
      if (!state.profile) return state
      const exists = state.profile.subjects.find((s) => s.subjectCode === subjectCode)
      const updated = exists
        ? state.profile.subjects.map((s) => s.subjectCode === subjectCode ? { ...s, status } : s)
        : [...state.profile.subjects, { id: '', subjectCode, status, grade: null, period: null }]
      return { profile: { ...state.profile, subjects: updated } }
    }),

  updatePreselectionLocally: (period, subjectCodes) =>
    set((state) => {
      if (!state.profile) return state
      const exists = state.profile.preselections.find((p) => p.period === period)
      let preselections
      if (subjectCodes.length === 0) {
        preselections = state.profile.preselections.filter((p) => p.period !== period)
      } else if (exists) {
        preselections = state.profile.preselections.map((p) =>
          p.period === period ? { ...p, subjects: subjectCodes } : p
        )
      } else {
        preselections = [...state.profile.preselections, { id: '', period, subjects: subjectCodes }]
      }
      return { profile: { ...state.profile, preselections } }
    }),
}))
