import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Universidad
  const university = await prisma.university.upsert({
    where: { id: 'university-itla' },
    update: {},
    create: {
      id: 'university-itla',
      name: 'Instituto Tecnológico de Las Américas',
      shortName: 'ITLA',
      country: 'DO',
    },
  })
  console.log(`✓ Universidad: ${university.shortName}`)

  const career = await prisma.career.upsert({
    where: { id: 'itla-sonido' },
    update: {},
    create: {
      id: 'itla-sonido',
      name: 'Tecnólogo en Sonido',
      universityId: 'university-itla',
      totalCredits: 146,
      durationSemesters: 7,
      subjects: {
        create: [
          // C1
          { code: 'HIS-001', name: 'Historia Universal',         credits: 2, semester: 1, prerequisites: [], corequisites: [] },
          { code: 'ESP-001', name: 'Redacción Castellana',        credits: 2, semester: 1, prerequisites: [], corequisites: [] },
          { code: 'MAT-001', name: 'Pre-cálculo',                 credits: 5, semester: 1, prerequisites: [], corequisites: [] },
          { code: 'TI-101',  name: 'Fundamentos del Computador',  credits: 4, semester: 1, prerequisites: [], corequisites: [] },
          { code: 'HMU-001', name: 'Historia de la Música',       credits: 3, semester: 1, prerequisites: [], corequisites: [] },
          { code: 'OAI-001', name: 'Orientación Institucional',   credits: 1, semester: 1, prerequisites: [], corequisites: [] },
          { code: 'TSO-001', name: 'Teoría del Sonido',           credits: 3, semester: 1, prerequisites: [], corequisites: [] },
          { code: 'ING-001', name: 'Inglés Nivel 1–3',            credits: 3, semester: 1, prerequisites: [], corequisites: [] },
          // C2
          { code: 'HIS-002', name: 'Historia Dominicana',                    credits: 2, semester: 2, prerequisites: ['HIS-001'], corequisites: [] },
          { code: 'ELT-001', name: 'Electrónica',                            credits: 4, semester: 2, prerequisites: ['MAT-001'], corequisites: [] },
          { code: 'TMU-001', name: 'Teoría Musical 1',                       credits: 3, semester: 2, prerequisites: ['HMU-001'], corequisites: [] },
          { code: 'IDW-001', name: 'Introducción al DAW',                    credits: 4, semester: 2, prerequisites: [], corequisites: [] },
          { code: 'TEA-001', name: 'Taller Entrenamiento Auditivo 1',        credits: 2, semester: 2, prerequisites: ['TSO-001'], corequisites: [] },
          { code: 'ING-002', name: 'Inglés Nivel 4–6',                       credits: 3, semester: 2, prerequisites: ['ING-001'], corequisites: [] },
          { code: 'CBG-101', name: 'Ética 1',                                credits: 2, semester: 2, prerequisites: [], corequisites: [] },
          { code: 'PSE-001', name: 'Procesamiento de Señal',                 credits: 3, semester: 2, prerequisites: ['ELT-001', 'TSO-001'], corequisites: [] },
          { code: 'MMZ-001', name: 'Mesa de Mezcla 1',                       credits: 4, semester: 2, prerequisites: ['IDW-001', 'TMU-001'], corequisites: [] },
          // C3
          { code: 'MIC-001',  name: 'Microfonía',                            credits: 4, semester: 3, prerequisites: ['PSE-001'], corequisites: [] },
          { code: 'GES-001',  name: 'Grabación en Estudio',                  credits: 3, semester: 3, prerequisites: ['MIC-001'], corequisites: [] },
          { code: 'MIDI-001', name: 'MIDI',                                  credits: 3, semester: 3, prerequisites: ['IDW-001'], corequisites: [] },
          { code: 'TEA-002',  name: 'Taller Entrenamiento Auditivo 2',       credits: 2, semester: 3, prerequisites: ['TEA-001'], corequisites: [] },
          { code: 'IDW-002',  name: 'DAW Avanzado',                          credits: 3, semester: 3, prerequisites: ['IDW-001'], corequisites: [] },
          { code: 'CES-001',  name: 'Comunicación y Expresión Sonora',       credits: 4, semester: 3, prerequisites: [], corequisites: [] },
          { code: 'PSA-001',  name: 'Psicoacústica',                         credits: 3, semester: 3, prerequisites: ['MAT-001'], corequisites: [] },
          { code: 'SAV-001',  name: 'Sonido para Audiovisuales',             credits: 3, semester: 3, prerequisites: ['IDW-001'], corequisites: [] },
          { code: 'TMU-002',  name: 'Teoría Musical 2',                      credits: 3, semester: 3, prerequisites: ['TMU-001'], corequisites: [] },
          // C4
          { code: 'SCT-001', name: 'Sonido para Cine y TV 1',               credits: 3, semester: 4, prerequisites: ['GES-001', 'SAV-001'], corequisites: [] },
          { code: 'ADM-101', name: 'Metodología de la Investigación',        credits: 2, semester: 4, prerequisites: [], corequisites: [] },
          { code: 'ACA-001', name: 'Acústica Arquitectónica',                credits: 3, semester: 4, prerequisites: ['TSO-001', 'PSA-001'], corequisites: [] },
          { code: 'MMZ-002', name: 'Mesa de Mezcla 2',                       credits: 4, semester: 4, prerequisites: ['MMZ-001'], corequisites: [] },
          { code: 'CBG-102', name: 'Ética 2',                                credits: 2, semester: 4, prerequisites: ['CBG-101'], corequisites: [] },
          { code: 'ING-003', name: 'Inglés Nivel 7–9',                       credits: 3, semester: 4, prerequisites: ['ING-002'], corequisites: [] },
          { code: 'SDV-001', name: 'Sonido en Vivo 1',                       credits: 3, semester: 4, prerequisites: ['MIC-001'], corequisites: [] },
          // C5
          { code: 'SCT-002', name: 'Sonido para Cine y TV 2',               credits: 3, semester: 5, prerequisites: ['SCT-001'], corequisites: [] },
          { code: 'MSO-001', name: 'Masterización de Sonido',               credits: 2, semester: 5, prerequisites: ['IDW-002', 'MMZ-002'], corequisites: [] },
          { code: 'SEN-001', name: 'Sonido Envolvente',                      credits: 3, semester: 5, prerequisites: ['ACA-001', 'MMZ-002'], corequisites: [] },
          // C6
          { code: 'SDV-002', name: 'Sonido en Vivo 2',                       credits: 3, semester: 6, prerequisites: ['SDV-001'], corequisites: [] },
          { code: 'ING-004', name: 'Inglés Nivel 10–12',                     credits: 3, semester: 6, prerequisites: ['ING-003'], corequisites: [] },
          { code: 'ING-101', name: 'Inglés Técnico',                         credits: 4, semester: 6, prerequisites: ['ING-004'], corequisites: [] },
          { code: 'LEG-001', name: 'Aspectos Legales de la Industria',       credits: 2, semester: 6, prerequisites: [], corequisites: [] },
          // C7
          { code: 'CBG-301', name: 'Proyecto Final',                         credits: 4, semester: 7, prerequisites: ['SCT-002', 'MSO-001', 'SDV-002', 'LEG-001'], corequisites: [] },
        ],
      },
    },
  })

  console.log(`✓ Carrera creada: ${career.name} (${career.university})`)
  console.log(`  ${career.totalCredits} créditos · ${career.durationSemesters} cuatrimestres`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
