import { NextRequest, NextResponse } from 'next/server'
import { getUserId, unauthorized, forbidden } from '@/lib/auth-helper'
import { prisma } from '@/lib/db'
import { type ParsedPensum } from '@/lib/parsePensum'

export async function POST(request: NextRequest) {
  const userId = getUserId(request)
  if (!userId) return unauthorized()

  const caller = await prisma.user.findUnique({ where: { id: userId }, select: { isAdmin: true } })
  if (!caller?.isAdmin) return forbidden()

  const pensum: ParsedPensum = await request.json()

  const { university: uniName, career: careerName, totalCredits, durationSemesters, periodType, year, subjects } = pensum

  // Upsert university
  let university = await prisma.university.findFirst({ where: { name: uniName } })
  if (!university) {
    university = await prisma.university.create({
      data: { name: uniName, shortName: uniName.slice(0, 10).toUpperCase() },
    })
  }

  // Upsert career (name + university)
  let career = await prisma.career.findFirst({
    where: { name: careerName, universityId: university.id },
  })
  if (!career) {
    career = await prisma.career.create({
      data: { name: careerName, universityId: university.id, isActive: true },
    })
  }

  // Check for duplicate pensum version
  const existingPensum = await prisma.pensum.findFirst({
    where: { careerId: career.id, year },
  })
  if (existingPensum) {
    return NextResponse.json(
      { error: `Ya existe un pensum de "${careerName}" para el año ${year ?? 'sin año'}` },
      { status: 409 },
    )
  }

  // Create pensum and subjects
  const newPensum = await prisma.pensum.create({
    data: {
      careerId: career.id,
      year,
      periodType,
      totalCredits,
      durationSemesters,
      isActive: false,
      subjects: {
        create: subjects.map((s) => ({
          code: s.code,
          name: s.name,
          credits: s.credits,
          semester: s.semester,
          area: s.area ?? undefined,
          prerequisites: s.prerequisites,
          corequisites: s.corequisites,
          careerId: career!.id,
        })),
      },
    },
    include: {
      career: {
        include: { university: { select: { id: true, name: true, shortName: true } } },
      },
      _count: { select: { subjects: true, profiles: true } },
    },
  })

  const data = {
    id: newPensum.id,
    name: newPensum.career.name,
    year: newPensum.year,
    periodType: newPensum.periodType,
    totalCredits: newPensum.totalCredits,
    durationSemesters: newPensum.durationSemesters,
    isActive: newPensum.isActive,
    createdAt: newPensum.createdAt,
    careerId: newPensum.careerId,
    university: newPensum.career.university,
    _count: newPensum._count,
  }

  return NextResponse.json({ data }, { status: 201 })
}
