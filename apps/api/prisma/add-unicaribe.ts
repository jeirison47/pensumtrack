/**
 * Script para agregar UNICARIBE + Licenciatura en Administración de Empresas
 * SIN borrar datos existentes. Seguro correr en producción.
 *
 * Uso: pnpm --filter @pensumtrack/api db:add-unicaribe
 *   o: cd apps/api && npx tsx prisma/add-unicaribe.ts
 */
import { PrismaClient } from '../src/generated/prisma/index.js'

const prisma = new PrismaClient()

async function main() {
  // ── Universidad del Caribe ──────────────────────────────────────────────────
  const unicaribe = await prisma.university.upsert({
    where:  { id: 'university-unicaribe' },
    update: {},
    create: {
      id:        'university-unicaribe',
      name:      'Universidad del Caribe',
      shortName: 'UNICARIBE',
      country:   'DO',
    },
  })
  console.log(`✓ ${unicaribe.shortName} — ${unicaribe.name}`)

  // ── Verificar que la carrera no exista ya ───────────────────────────────────
  const existing = await prisma.career.findUnique({ where: { id: 'unicaribe-administracion-empresas' } })
  if (existing) {
    console.log('⚠️  La carrera ya existe en la DB. No se realizaron cambios.')
    return
  }

  const allCodes = [
    'FGC-101','FGC-102','FGC-103','ADE-101',
    'FGC-104','FGC-105','FGC-106','CON-101',
    'FGC-107','FGC-108','MEC-101','ECO-101',
    'FGC-109','FGC-110','MAT-241','CON-102',
    'DMF-103','DER-340','ADE-102','ECO-102',
    'ADE-204','DER-438','TIC-403','ADE-310','ADE-103',
    'NEG-103','NEG-105','ADE-205','ADE-206','ADE-311',
    'NEG-107','NEG-110','ADE-207','ADE-312','ADE-104',
    'ECO-405','ADE-105','ADE-106','ADE-309',
    'NEG-108','ECO-404','ADE-107','ADE-108',
    'FGC-111','ADE-109','ADE-417','ADE-418',
    'ADE-110','ADE-421','ADE-423',
  ]

  // ── Licenciatura en Administración de Empresas ──────────────────────────────
  const adm = await prisma.career.create({
    data: {
      id:                'unicaribe-administracion-empresas',
      name:              'Licenciatura en Administración de Empresas',
      universityId:      unicaribe.id,
      totalCredits:      153,
      durationSemesters: 12,
      subjects: {
        create: [
          // ── Cuatrimestre 1 ─────────────────────────────────────────────────
          { code: 'FGC-101', name: 'Orientación Académica Institucional',           credits: 2, semester: 1,  prerequisites: [],                              corequisites: [] },
          { code: 'FGC-102', name: 'Método del Trabajo Académico',                 credits: 2, semester: 1,  prerequisites: [],                              corequisites: [] },
          { code: 'FGC-103', name: 'Metodología de la Investigación',              credits: 3, semester: 1,  prerequisites: [],                              corequisites: [] },
          { code: 'ADE-101', name: 'Administración I',                             credits: 3, semester: 1,  prerequisites: [],                              corequisites: [] },
          // ── Cuatrimestre 2 ─────────────────────────────────────────────────
          { code: 'FGC-104', name: 'Lengua Española I',                            credits: 3, semester: 2,  prerequisites: ['FGC-102'],                     corequisites: [] },
          { code: 'FGC-105', name: 'Matemática Básica I',                          credits: 3, semester: 2,  prerequisites: ['FGC-102'],                     corequisites: [] },
          { code: 'FGC-106', name: 'Tecnología de la Información y Comunicación I',credits: 3, semester: 2,  prerequisites: ['FGC-102'],                     corequisites: [] },
          { code: 'CON-101', name: 'Contabilidad I',                               credits: 3, semester: 2,  prerequisites: ['FGC-102'],                     corequisites: [] },
          // ── Cuatrimestre 3 ─────────────────────────────────────────────────
          { code: 'FGC-107', name: 'Historia Social Dominicana',                   credits: 3, semester: 3,  prerequisites: ['FGC-102'],                     corequisites: [] },
          { code: 'FGC-108', name: 'Inglés I',                                     credits: 3, semester: 3,  prerequisites: ['FGC-102'],                     corequisites: [] },
          { code: 'MEC-101', name: 'Mercadotecnia I',                              credits: 3, semester: 3,  prerequisites: ['ADE-101'],                     corequisites: [] },
          { code: 'ECO-101', name: 'Economía I',                                   credits: 3, semester: 3,  prerequisites: ['FGC-102'],                     corequisites: [] },
          // ── Cuatrimestre 4 ─────────────────────────────────────────────────
          { code: 'FGC-109', name: 'Filosofía',                                    credits: 2, semester: 4,  prerequisites: ['FGC-102'],                     corequisites: [] },
          { code: 'FGC-110', name: 'Desarrollo Sostenible y Gestión de Riesgos',   credits: 2, semester: 4,  prerequisites: ['FGC-102'],                     corequisites: [] },
          { code: 'MAT-241', name: 'Estadística I',                                credits: 3, semester: 4,  prerequisites: ['FGC-105'],                     corequisites: [] },
          { code: 'CON-102', name: 'Contabilidad II',                              credits: 3, semester: 4,  prerequisites: ['CON-101'],                     corequisites: [] },
          // ── Cuatrimestre 5 ─────────────────────────────────────────────────
          { code: 'DMF-103', name: 'Matemática Financiera I',                      credits: 3, semester: 5,  prerequisites: ['FGC-105'],                     corequisites: [] },
          { code: 'DER-340', name: 'Derecho Comercial I',                          credits: 3, semester: 5,  prerequisites: ['ECO-101'],                     corequisites: [] },
          { code: 'ADE-102', name: 'Administración II',                            credits: 3, semester: 5,  prerequisites: ['ADE-101'],                     corequisites: [] },
          { code: 'ECO-102', name: 'Economía II',                                  credits: 3, semester: 5,  prerequisites: ['ECO-101'],                     corequisites: [] },
          // ── Cuatrimestre 6 ─────────────────────────────────────────────────
          { code: 'ADE-204', name: 'Administración de Personal I',                 credits: 3, semester: 6,  prerequisites: ['ADE-101'],                     corequisites: [] },
          { code: 'DER-438', name: 'Derecho Laboral I',                            credits: 3, semester: 6,  prerequisites: ['ADE-101'],                     corequisites: [] },
          { code: 'TIC-403', name: 'Tecnología de la Información y Comunicación II',credits: 3, semester: 6, prerequisites: ['FGC-106'],                     corequisites: [] },
          { code: 'ADE-310', name: 'Administración Financiera I',                  credits: 3, semester: 6,  prerequisites: ['DMF-103'],                     corequisites: [] },
          { code: 'ADE-103', name: 'Comportamiento Organizacional',                credits: 3, semester: 6,  prerequisites: ['ADE-102'],                     corequisites: [] },
          // ── Cuatrimestre 7 ─────────────────────────────────────────────────
          { code: 'NEG-103', name: 'Liderazgo y Desarrollo de Habilidades',        credits: 2, semester: 7,  prerequisites: ['ADE-101'],                     corequisites: [] },
          { code: 'NEG-105', name: 'Desarrollo Organizacional',                    credits: 3, semester: 7,  prerequisites: ['ADE-101'],                     corequisites: [] },
          { code: 'ADE-205', name: 'Administración de Personal II',                credits: 3, semester: 7,  prerequisites: ['ADE-204'],                     corequisites: [] },
          { code: 'ADE-206', name: 'Administración de la Producción I',            credits: 3, semester: 7,  prerequisites: ['ADE-102'],                     corequisites: [] },
          { code: 'ADE-311', name: 'Administración Financiera II',                 credits: 3, semester: 7,  prerequisites: ['ADE-310'],                     corequisites: [] },
          // ── Cuatrimestre 8 ─────────────────────────────────────────────────
          { code: 'NEG-107', name: 'Inteligencia de Negocios',                     credits: 3, semester: 8,  prerequisites: ['MAT-241'],                     corequisites: [] },
          { code: 'NEG-110', name: 'Inglés Técnico para Negocios',                 credits: 3, semester: 8,  prerequisites: ['FGC-108'],                     corequisites: [] },
          { code: 'ADE-207', name: 'Presupuesto Empresarial I',                    credits: 3, semester: 8,  prerequisites: ['CON-102'],                     corequisites: [] },
          { code: 'ADE-312', name: 'Administración de la Producción II',           credits: 3, semester: 8,  prerequisites: ['ADE-206'],                     corequisites: [] },
          { code: 'ADE-104', name: 'Dirección Comercial',                          credits: 3, semester: 8,  prerequisites: ['ADE-102'],                     corequisites: [] },
          // ── Cuatrimestre 9 ─────────────────────────────────────────────────
          { code: 'ECO-405', name: 'Formulación de Proyectos',                     credits: 3, semester: 9,  prerequisites: ['ECO-101'],                     corequisites: [] },
          { code: 'ADE-105', name: 'Gestión Logística y de la Calidad',            credits: 3, semester: 9,  prerequisites: ['ADE-312'],                     corequisites: [] },
          { code: 'ADE-106', name: 'Gestión de la Seguridad y Salud en el Trabajo',credits: 3, semester: 9,  prerequisites: ['ADE-104'],                     corequisites: [] },
          { code: 'ADE-309', name: 'Presupuesto Empresarial II',                   credits: 3, semester: 9,  prerequisites: ['ADE-207'],                     corequisites: [] },
          // ── Cuatrimestre 10 ────────────────────────────────────────────────
          { code: 'NEG-108', name: 'Ética en los Negocios',                        credits: 2, semester: 10, prerequisites: ['FGC-110'],                     corequisites: [] },
          { code: 'ECO-404', name: 'Evaluación de Proyectos',                      credits: 3, semester: 10, prerequisites: ['ECO-405'],                     corequisites: [] },
          { code: 'ADE-107', name: 'Administración de Costo',                      credits: 3, semester: 10, prerequisites: ['ADE-309'],                     corequisites: [] },
          { code: 'ADE-108', name: 'Negocios Globales',                            credits: 3, semester: 10, prerequisites: ['NEG-107'],                     corequisites: [] },
          // ── Cuatrimestre 11 ────────────────────────────────────────────────
          { code: 'FGC-111', name: 'Seminario de Grado',                           credits: 3, semester: 11, prerequisites: ['FGC-103'],                     corequisites: [] },
          { code: 'ADE-109', name: 'Emprendimiento e Innovación Empresarial',      credits: 3, semester: 11, prerequisites: ['ECO-404'],                     corequisites: [] },
          { code: 'ADE-417', name: 'Administración Pública I',                     credits: 3, semester: 11, prerequisites: ['ADE-101'],                     corequisites: [] },
          { code: 'ADE-418', name: 'Seminario de Administración',                  credits: 3, semester: 11, prerequisites: ['ADE-312'],                     corequisites: [] },
          // ── Cuatrimestre 12 ────────────────────────────────────────────────
          { code: 'ADE-110', name: 'Práctica Profesional',                         credits: 6, semester: 12, prerequisites: ['ADE-109'],                     corequisites: [] },
          { code: 'ADE-421', name: 'Sistema de Información Gerencial',             credits: 3, semester: 12, prerequisites: ['NEG-105'],                     corequisites: [] },
          { code: 'ADE-423', name: 'Dirección Empresarial',                        credits: 3, semester: 12, prerequisites: ['NEG-107'],                     corequisites: [] },
          { code: 'DHS-440', name: 'Trabajo de Grado',                             credits: 6, semester: 12, prerequisites: allCodes,                        corequisites: [] },
        ],
      },
    },
  })
  console.log(`✓ ${adm.name} — ${adm.totalCredits} créditos, ${adm.durationSemesters} cuatrimestres`)
  console.log('\n✅ UNICARIBE agregado correctamente.')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
