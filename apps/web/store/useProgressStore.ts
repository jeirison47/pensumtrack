import { create } from 'zustand'
import type { StudentProfileFull, SubjectStatusDB, PreselectionDB } from '@/services/api'

interface ProgressState {
  profile: StudentProfileFull | null
  setProfile: (profile: StudentProfileFull | null) => void
  updateSubjectLocally: (subjectCode: string, status: SubjectStatusDB) => void
  updatePreselectionSubjectsLocally: (id: string, subjectCodes: string[]) => void
  addPreselectionLocally: (preselection: PreselectionDB) => void
  removePreselectionLocally: (id: string, revertSubjects?: string[]) => void
  updatePreselectionStatusLocally: (id: string, status: PreselectionDB['status']) => void
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

  updatePreselectionSubjectsLocally: (id, subjectCodes) =>
    set((state) => {
      if (!state.profile) return state
      const preselections = state.profile.preselections.map((p) =>
        p.id === id ? { ...p, subjects: subjectCodes } : p,
      )
      return { profile: { ...state.profile, preselections } }
    }),

  addPreselectionLocally: (preselection) =>
    set((state) => {
      if (!state.profile) return state
      return { profile: { ...state.profile, preselections: [...state.profile.preselections, preselection] } }
    }),

  removePreselectionLocally: (id, revertSubjects) =>
    set((state) => {
      if (!state.profile) return state
      const preselections = state.profile.preselections.filter((p) => p.id !== id)
      let subjects = state.profile.subjects
      if (revertSubjects?.length) {
        subjects = subjects.map((s) =>
          revertSubjects.includes(s.subjectCode) && s.status === 'IN_PROGRESS'
            ? { ...s, status: 'PENDING' as SubjectStatusDB }
            : s,
        )
      }
      return { profile: { ...state.profile, preselections, subjects } }
    }),

  updatePreselectionStatusLocally: (id, status) =>
    set((state) => {
      if (!state.profile) return state
      const preselections = state.profile.preselections.map((p) =>
        p.id === id ? { ...p, status } : p,
      )
      return { profile: { ...state.profile, preselections } }
    }),
}))
