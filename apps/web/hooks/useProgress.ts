'use client'

import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { progressApi } from '@/services/api'
import { useAuthStore } from '@/store/useAuthStore'
import { useProgressStore } from '@/store/useProgressStore'
import { calcSubjectStatus } from '@pensumtrack/utils'
import type { Subject, StudentSubject, SubjectStatus } from '@pensumtrack/types'

export function useProgress() {
  const { isAuthenticated } = useAuthStore()
  const { profile, setProfile } = useProgressStore()

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['progress'],
    queryFn: () => progressApi.me(),
    enabled: isAuthenticated,
  })

  useEffect(() => {
    if (data?.data !== undefined) setProfile(data.data)
  }, [data, setProfile])

  const preselectedCodes = profile?.preselection?.subjects ?? []

  const getSubjectStatus = (subjectCode: string): SubjectStatus => {
    if (!profile) return 'pending'
    const allSubjects: Subject[] = profile.career.subjects
    const subject = allSubjects.find((s) => s.code === subjectCode)
    if (!subject) return 'pending'

    const studentSubjects: StudentSubject[] = profile.subjects.map((s) => ({
      subjectCode: s.subjectCode,
      status: s.status === 'IN_PROGRESS' ? 'in-progress'
            : s.status === 'PASSED'      ? 'passed'
            : s.status === 'FAILED'      ? 'failed'
            : 'pending',
    }))

    return calcSubjectStatus(subject, studentSubjects, preselectedCodes)
  }

  return { profile, isLoading, refetch, getSubjectStatus, preselectedCodes }
}
