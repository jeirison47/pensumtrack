/**
 * Migration: Career → Pensum separation
 * Run after prisma db push. Creates Pensum records from legacy Career data.
 */

import { PrismaClient } from '../lib/generated/prisma/index.js'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting migration: Career → Pensum separation...\n')

  const careers = await prisma.career.findMany({
    include: { subjects: true, profiles: true },
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

    const existingPensum = await prisma.pensum.findFirst({ where: { careerId: career.id } })

    if (existingPensum) {
      console.log(`  SKIP "${career.name}" — Pensum already exists`)
      skipped++
      await prisma.subject.updateMany({ where: { careerId: career.id, pensumId: null }, data: { pensumId: existingPensum.id } })
      await prisma.studentProfile.updateMany({ where: { careerId: career.id, pensumId: null }, data: { pensumId: existingPensum.id } })
      continue
    }

    // Read legacy fields via raw SQL (still in DB)
    const raw = await prisma.$queryRaw`
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

    const pensum = await prisma.pensum.create({
      data: { careerId: career.id, year, periodType, totalCredits, durationSemesters, isActive },
    })

    console.log(`  CREATE Pensum for "${career.name}" (${career.subjects.length} subjects, year=${year ?? 'n/a'}, isActive=${isActive})`)

    const s = await prisma.subject.updateMany({ where: { careerId: career.id }, data: { pensumId: pensum.id } })
    const p = await prisma.studentProfile.updateMany({ where: { careerId: career.id }, data: { pensumId: pensum.id } })
    console.log(`    → linked ${s.count} subjects, ${p.count} profiles`)
    created++
  }

  console.log(`\nPensums: ${created} created, ${skipped} skipped`)

  // Migrate Preselection.period → Preselection.label
  const oldPreselections = await prisma.preselection.findMany({ where: { label: null } })
  if (oldPreselections.length > 0) {
    console.log(`\nMigrating ${oldPreselections.length} preselections period → label...`)
    for (const p of oldPreselections) {
      if (p.period) {
        await prisma.preselection.update({ where: { id: p.id }, data: { label: p.period } })
      }
    }
    console.log('  Done.')
  }

  console.log('\nMigration complete.')
}

main().catch((e) => { console.error(e); process.exit(1) }).finally(() => prisma.$disconnect())
