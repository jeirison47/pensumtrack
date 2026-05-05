/**
 * Migration: Career → Pensum separation
 *
 * Run AFTER `prisma db push` (which adds Pensum table + nullable pensumId columns).
 * For each Career that has subjects, creates a Pensum record and links subjects + profiles to it.
 * Also migrates Preselection.period → Preselection.label for existing records.
 */

import { PrismaClient } from '../lib/generated/prisma'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting migration: Career → Pensum separation...\n')

  // 1. Get all careers that have subjects and legacy version fields
  const careers = await prisma.career.findMany({
    include: {
      subjects: true,
      profiles: true,
    },
  })

  console.log(`Found ${careers.length} careers to process`)

  let created = 0
  let skipped = 0

  for (const career of careers) {
    if (career.subjects.length === 0) {
      console.log(`  SKIP "${career.name}" — no subjects`)
      skipped++
      continue
    }

    // Check if a Pensum already exists for this career
    const existingPensum = await prisma.pensum.findFirst({
      where: { careerId: career.id },
    })

    if (existingPensum) {
      console.log(`  SKIP "${career.name}" — Pensum already exists (${existingPensum.id})`)
      skipped++

      // Still ensure subjects and profiles link to this pensum
      await prisma.subject.updateMany({
        where: { careerId: career.id, pensumId: null },
        data: { pensumId: existingPensum.id },
      })
      await prisma.studentProfile.updateMany({
        where: { careerId: career.id, pensumId: null },
        data: { pensumId: existingPensum.id },
      })
      continue
    }

    // Read legacy fields (they're still in DB before Phase 2 cleanup)
    const raw = await prisma.$queryRaw<{
      totalCredits: number | null
      durationSemesters: number | null
      periodType: string | null
      year: number | null
      isActive: boolean
    }[]>`
      SELECT "totalCredits", "durationSemesters", "periodType", "year", "isActive"
      FROM "Career"
      WHERE id = ${career.id}
    `

    const legacy = raw[0]
    const totalCredits = legacy?.totalCredits ?? career.subjects.reduce((s, sub) => s + sub.credits, 0)
    const durationSemesters = legacy?.durationSemesters ?? Math.max(...career.subjects.map((s) => s.semester), 1)
    const periodType = legacy?.periodType ?? 'semester'
    const year = legacy?.year ?? null
    const isActive = legacy?.isActive ?? false

    // Create the Pensum
    const pensum = await prisma.pensum.create({
      data: {
        careerId: career.id,
        year,
        periodType,
        totalCredits,
        durationSemesters,
        isActive,
      },
    })

    console.log(`  CREATE Pensum for "${career.name}" (${career.subjects.length} subjects, year=${year ?? 'n/a'}, isActive=${isActive})`)

    // Link all subjects of this career to the new pensum
    const subjectsUpdated = await prisma.subject.updateMany({
      where: { careerId: career.id },
      data: { pensumId: pensum.id },
    })

    // Link all profiles of this career to the new pensum
    const profilesUpdated = await prisma.studentProfile.updateMany({
      where: { careerId: career.id },
      data: { pensumId: pensum.id },
    })

    console.log(`    → linked ${subjectsUpdated.count} subjects, ${profilesUpdated.count} profiles`)
    created++
  }

  console.log(`\nPensum migration: ${created} created, ${skipped} skipped`)

  // 2. Migrate Preselection.period → Preselection.label for old records
  const preselections = await prisma.preselection.findMany({
    where: { label: null },
  })

  if (preselections.length > 0) {
    console.log(`\nMigrating ${preselections.length} preselections period → label...`)
    for (const p of preselections) {
      if (p.period) {
        await prisma.preselection.update({
          where: { id: p.id },
          data: { label: p.period },
        })
      }
    }
    console.log('  Done.')
  } else {
    console.log('\nNo preselections need label migration.')
  }

  console.log('\nMigration complete.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
