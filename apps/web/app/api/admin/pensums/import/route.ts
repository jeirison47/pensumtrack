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

  // Check for duplicate version
  const existingCareer = await prisma.career.findFirst({
    where: {
      name: careerName,
      year,
      university: { name: uniName },
    },
  })
  if (existingCareer) {
    return NextResponse.json(
      { error: `Ya existe un pensum de "${careerName}" para el año ${year}` },
      { status: 409 },
    )
  }

  // Upsert university
  let university = await prisma.university.findFirst({ where: { name: uniName } })
  if (!university) {
    university = await prisma.university.create({
      data: { name: uniName, shortName: uniName.slice(0, 10).toUpperCase() },
    })
  }

  // Create career version
  const career = await prisma.career.create({
    data: {
      name: careerName,
      universityId: university.id,
      totalCredits,
      durationSemesters,
      periodType,
      year,
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
        })),
      },
    },
    include: {
      university: { select: { name: true, shortName: true } },
      _count: { select: { subjects: true } },
    },
  })

  return NextResponse.json({ data: career }, { status: 201 })
}
