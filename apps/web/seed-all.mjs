import { PrismaClient } from './lib/generated/prisma/index.js'

const prisma = new PrismaClient()

async function main() {
  // ─── Limpieza ──────────────────────────────────────────────────────────────
  console.log('🧹 Limpiando DB...')
  await prisma.preselection.deleteMany()
  await prisma.studentSubject.deleteMany()
  await prisma.studentProfile.deleteMany()
  await prisma.subject.deleteMany()
  await prisma.career.deleteMany()
  await prisma.university.deleteMany()
  console.log('✓ DB limpia\n')

  // ─── Universidades ─────────────────────────────────────────────────────────
  const itla = await prisma.university.create({
    data: { id: 'university-itla', name: 'Instituto Tecnológico de Las Américas', shortName: 'ITLA', country: 'DO' },
  })
  const unphu = await prisma.university.create({
    data: { id: 'university-unphu', name: 'Universidad Nacional Pedro Henríquez Ureña', shortName: 'UNPHU', country: 'DO' },
  })
  const unicaribe = await prisma.university.create({
    data: { id: 'university-unicaribe', name: 'Universidad del Caribe', shortName: 'UNICARIBE', country: 'DO' },
  })
  console.log(`✓ ${itla.shortName}, ${unphu.shortName}, ${unicaribe.shortName}\n`)

  // ─── ITLA: Tecnólogo en Sonido (Res. 58-2022) — 109 cr, 7 cuatrimestres ──
  const sonido = await prisma.career.create({
    data: {
      id: 'itla-sonido',
      name: 'Tecnólogo en Sonido',
      universityId: itla.id,
      totalCredits: 109,
      durationSemesters: 7,
      subjects: {
        create: [
          // C1
          { code: 'TI-101',    name: 'Fundamentos del Computador',          credits: 3, semester: 1, prerequisites: [],                          corequisites: []            },
          { code: 'TSO-101',   name: 'Introducción a la Música',            credits: 2, semester: 1, prerequisites: [],                          corequisites: []            },
          { code: 'ESP-101',   name: 'Redacción Castellana',                credits: 4, semester: 1, prerequisites: [],                          corequisites: []            },
          { code: 'TSO-001',   name: 'Teoría del Sonido',                   credits: 3, semester: 1, prerequisites: [],                          corequisites: []            },
          { code: 'OAI-001',   name: 'Orientación Institucional',           credits: 1, semester: 1, prerequisites: [],                          corequisites: []            },
          { code: 'TSO-002',   name: 'Introducción al DAW',                 credits: 2, semester: 1, prerequisites: [],                          corequisites: ['TSO-002-L'] },
          { code: 'TSO-002-L', name: 'Lab. Introducción al DAW',            credits: 1, semester: 1, prerequisites: [],                          corequisites: ['TSO-002']   },
          // C2
          { code: 'ING-001',   name: 'Inglés Nivel 1-3',                   credits: 0, semester: 2, prerequisites: [],                          corequisites: []            },
          { code: 'MAT-010',   name: 'Matemática Aplicada para Multimedia', credits: 5, semester: 2, prerequisites: [],                          corequisites: []            },
          { code: 'DEP-101',   name: 'Educación Física',                    credits: 0, semester: 2, prerequisites: [],                          corequisites: []            },
          { code: 'TSO-003',   name: 'Electrónica del Audio',               credits: 3, semester: 2, prerequisites: ['TSO-001'],                 corequisites: []            },
          { code: 'TSO-004',   name: 'Procesamiento de Señal',              credits: 3, semester: 2, prerequisites: ['TSO-001', 'TSO-002'],      corequisites: []            },
          { code: 'TSO-102',   name: 'Teoría Musical I',                    credits: 3, semester: 2, prerequisites: ['TSO-001'],                 corequisites: []            },
          // C3
          { code: 'ING-002',   name: 'Inglés Nivel 4-6',                   credits: 0, semester: 3, prerequisites: ['ING-001'],                 corequisites: []            },
          { code: 'TSO-005',   name: 'Mesa de Mezcla 1',                   credits: 3, semester: 3, prerequisites: ['TSO-004'],                 corequisites: []            },
          { code: 'TSO-006',   name: 'Microfonía',                          credits: 3, semester: 3, prerequisites: ['TSO-003'],                 corequisites: []            },
          { code: 'TSO-103',   name: 'Teoría Musical II',                   credits: 3, semester: 3, prerequisites: ['TSO-102'],                 corequisites: []            },
          { code: 'TSO-104',   name: 'Entrenamiento Auditivo Musical',      credits: 3, semester: 3, prerequisites: ['TSO-102'],                 corequisites: []            },
          { code: 'TSO-105',   name: 'Introducción al Piano',               credits: 3, semester: 3, prerequisites: ['TSO-102'],                 corequisites: []            },
          { code: 'TSO-201',   name: 'Sonido para Audiovisuales',           credits: 3, semester: 3, prerequisites: ['TSO-002'],                 corequisites: []            },
          // C4
          { code: 'ING-003',   name: 'Inglés Nivel 7-9',                   credits: 0, semester: 4, prerequisites: ['ING-002'],                 corequisites: []            },
          { code: 'TSO-106',   name: 'Entrenamiento Auditivo Frecuencial',  credits: 3, semester: 4, prerequisites: ['TSO-104'],                 corequisites: []            },
          { code: 'TSO-107',   name: 'Producción Musical',                  credits: 3, semester: 4, prerequisites: ['TSO-004', 'TSO-105'],      corequisites: []            },
          { code: 'TSO-300',   name: 'Grabación en Estudio',                credits: 2, semester: 4, prerequisites: ['TSO-005'],                 corequisites: ['TSO-300-L'] },
          { code: 'TSO-300-L', name: 'Lab. Grabación en Estudio',           credits: 1, semester: 4, prerequisites: ['TSO-005'],                 corequisites: ['TSO-300']   },
          { code: 'TSO-301',   name: 'MIDI',                                credits: 3, semester: 4, prerequisites: ['TSO-002', 'TSO-102'],      corequisites: []            },
          { code: 'TSO-302',   name: 'DAW Avanzado',                        credits: 3, semester: 4, prerequisites: ['TSO-002'],                 corequisites: []            },
          // C5
          { code: 'ING-004',   name: 'Inglés Nivel 10-12',                 credits: 0, semester: 5, prerequisites: ['ING-003'],                 corequisites: []            },
          { code: 'TMMP-001',  name: 'Marketing',                           credits: 3, semester: 5, prerequisites: ['ESP-101'],                 corequisites: []            },
          { code: 'TSO-108',   name: 'Apreciación Musical',                 credits: 3, semester: 5, prerequisites: ['TSO-103'],                 corequisites: []            },
          { code: 'TSO-202',   name: 'Sonido para Radio y TV',              credits: 3, semester: 5, prerequisites: ['TSO-201', 'TSO-300'],      corequisites: []            },
          { code: 'TSO-303',   name: 'Mesa de Mezcla II',                   credits: 3, semester: 5, prerequisites: ['TSO-005'],                 corequisites: []            },
          { code: 'TSO-304',   name: 'Psicoacústica',                       credits: 3, semester: 5, prerequisites: ['TSO-106'],                 corequisites: []            },
          { code: 'TSO-305',   name: 'Síntesis de Sonido',                  credits: 3, semester: 5, prerequisites: ['TSO-301', 'TSO-302'],      corequisites: []            },
          // C6
          { code: 'TSO-203',   name: 'Sonido para Cine',                    credits: 3, semester: 6, prerequisites: ['TSO-202'],                 corequisites: []            },
          { code: 'TSO-306',   name: 'Acústica Arquitectónica',             credits: 3, semester: 6, prerequisites: ['TSO-304'],                 corequisites: []            },
          { code: 'TSO-307',   name: 'Masterización de Sonido',             credits: 3, semester: 6, prerequisites: ['TSO-303'],                 corequisites: []            },
          { code: 'TSO-308',   name: 'Sonido en Vivo',                      credits: 3, semester: 6, prerequisites: ['TSO-303'],                 corequisites: []            },
          // C7
          { code: 'ADM-110',   name: 'Desarrollo de Emprendedores',         credits: 3, semester: 7, prerequisites: ['TMMP-001'],                corequisites: []            },
          { code: 'CBG-130',   name: 'Ética Profesional',                   credits: 2, semester: 7, prerequisites: ['TSO-303'],                 corequisites: []            },
          { code: 'TSO-309',   name: 'Locución Comercial',                  credits: 3, semester: 7, prerequisites: ['TSO-202'],                 corequisites: []            },
          { code: 'TSO-310',   name: 'Industria de la Música',              credits: 3, semester: 7, prerequisites: ['TMMP-001'],                corequisites: []            },
          { code: 'TSO-311',   name: 'Proyecto Final TSO',                  credits: 4, semester: 7, prerequisites: ['TSO-302', 'TSO-307'],      corequisites: []            },
        ],
      },
    },
  })
  console.log(`✓ ${sonido.name} — ${sonido.totalCredits} cr, ${sonido.durationSemesters} cuatrimestres`)

  // ─── ITLA: Tecnólogo en Desarrollo de Software (Res. 34-2019) — 150 cr, 7 C
  const tds = await prisma.career.create({
    data: {
      id: 'itla-tds',
      name: 'Tecnólogo en Desarrollo de Software',
      universityId: itla.id,
      totalCredits: 150,
      durationSemesters: 7,
      subjects: {
        create: [
          // C1
          { code: 'TI-101',    name: 'Fundamentos del Computador',                     credits: 4, semester: 1, prerequisites: [],                                   corequisites: []             },
          { code: 'TDS-001',   name: 'Introducción a la Elaboración de Algoritmos',    credits: 4, semester: 1, prerequisites: [],                                   corequisites: []             },
          { code: 'HIS-101',   name: 'Historia Universal',                             credits: 3, semester: 1, prerequisites: [],                                   corequisites: []             },
          { code: 'ESP-101',   name: 'Redacción Castellana',                           credits: 4, semester: 1, prerequisites: [],                                   corequisites: []             },
          { code: 'MAT-001',   name: 'Pre-Cálculo',                                   credits: 5, semester: 1, prerequisites: [],                                   corequisites: []             },
          { code: 'OAI-001',   name: 'Orientación Institucional',                      credits: 1, semester: 1, prerequisites: [],                                   corequisites: []             },
          { code: 'CBG-110',   name: 'Ética 1',                                        credits: 3, semester: 1, prerequisites: [],                                   corequisites: []             },
          { code: 'ING-001',   name: 'Inglés Nivel 1-3',                              credits: 0, semester: 1, prerequisites: [],                                   corequisites: []             },
          // C2
          { code: 'HIS-102',   name: 'Historia Dominicana',                            credits: 3, semester: 2, prerequisites: ['HIS-101'],                         corequisites: []             },
          { code: 'MAT-101',   name: 'Cálculo Diferencial',                           credits: 5, semester: 2, prerequisites: ['MAT-001'],                          corequisites: []             },
          { code: 'TI-115',    name: 'Contabilidad Financiera',                        credits: 4, semester: 2, prerequisites: ['MAT-001'],                          corequisites: []             },
          { code: 'ING-002',   name: 'Inglés Nivel 4-6',                              credits: 0, semester: 2, prerequisites: ['ING-001'],                          corequisites: []             },
          { code: 'TDS-002',   name: 'Fundamentos de Programación',                   credits: 4, semester: 2, prerequisites: ['TI-101', 'TDS-001'],                corequisites: []             },
          { code: 'CBG-115',   name: 'Ética 2',                                        credits: 3, semester: 2, prerequisites: ['CBG-110'],                          corequisites: []             },
          { code: 'TDS-101',   name: 'Introducción a las Bases de Datos',             credits: 4, semester: 2, prerequisites: ['TDS-001'],                          corequisites: []             },
          // C3
          { code: 'CBG-210',   name: 'Probabilidad y Estadística',                    credits: 3, semester: 3, prerequisites: ['MAT-101'],                          corequisites: []             },
          { code: 'TDS-003',   name: 'Programación I',                                credits: 4, semester: 3, prerequisites: ['TDS-002', 'TDS-101'],               corequisites: []             },
          { code: 'TDS-004',   name: 'Análisis y Diseño de Sistemas',                 credits: 4, semester: 3, prerequisites: ['TDS-002'],                          corequisites: []             },
          { code: 'MAT-102',   name: 'Cálculo Integral',                              credits: 5, semester: 3, prerequisites: ['MAT-101'],                          corequisites: []             },
          { code: 'FIS-110',   name: 'Física General',                                credits: 4, semester: 3, prerequisites: ['MAT-101'],                          corequisites: ['FIS-110-L']  },
          { code: 'FIS-110-L', name: 'Lab. Física General',                           credits: 1, semester: 3, prerequisites: ['MAT-101'],                          corequisites: ['FIS-110']    },
          { code: 'ING-003',   name: 'Inglés Nivel 7-9',                              credits: 0, semester: 3, prerequisites: ['ING-002'],                          corequisites: []             },
          { code: 'CBG-120',   name: 'Ética 3',                                        credits: 3, semester: 3, prerequisites: ['CBG-115'],                          corequisites: []             },
          // C4
          { code: 'TDS-005',   name: 'Diseño Centrado en el Usuario',                 credits: 4, semester: 4, prerequisites: ['TDS-003', 'TDS-004'],               corequisites: []             },
          { code: 'CBG-215',   name: 'Metodología de la Investigación',               credits: 3, semester: 4, prerequisites: ['CBG-210'],                          corequisites: []             },
          { code: 'TDS-102',   name: 'Base de Datos Avanzada',                        credits: 4, semester: 4, prerequisites: ['TDS-101', 'TDS-002'],               corequisites: []             },
          { code: 'TDS-006',   name: 'Programación II',                               credits: 4, semester: 4, prerequisites: ['TDS-003', 'TDS-004'],               corequisites: []             },
          { code: 'TDS-201',   name: 'Inteligencia Artificial',                       credits: 4, semester: 4, prerequisites: ['TDS-003', 'TDS-004', 'CBG-210'],    corequisites: []             },
          { code: 'ING-004',   name: 'Inglés Nivel 10-12',                            credits: 0, semester: 4, prerequisites: ['ING-003'],                          corequisites: []             },
          // C5
          { code: 'TDS-301',   name: 'Auditoría Informática',                         credits: 4, semester: 5, prerequisites: ['TDS-102', 'TDS-006'],               corequisites: []             },
          { code: 'TDS-007',   name: 'Programación III',                              credits: 4, semester: 5, prerequisites: ['TDS-005', 'TDS-006', 'TDS-102'],    corequisites: []             },
          { code: 'TDS-103',   name: 'Minería de Datos e Inteligencia de Negocios',   credits: 4, semester: 5, prerequisites: ['TDS-102', 'TDS-006'],               corequisites: []             },
          { code: 'TME-001',   name: 'Fundamentos de Electrónica',                    credits: 4, semester: 5, prerequisites: ['MAT-001'],                          corequisites: ['TME-001-L']  },
          { code: 'TME-001-L', name: 'Lab. Fundamentos de Electrónica',               credits: 1, semester: 5, prerequisites: ['MAT-001'],                          corequisites: ['TME-001']    },
          { code: 'TDS-008',   name: 'Programación Web',                              credits: 4, semester: 5, prerequisites: ['TDS-102', 'TDS-003'],               corequisites: []             },
          { code: 'TDS-EL1',   name: 'Electiva I',                                   credits: 3, semester: 5, prerequisites: [],                                   corequisites: []             },
          // C6
          { code: 'TDS-009',   name: 'Programación Paralela',                         credits: 4, semester: 6, prerequisites: ['TDS-102', 'TDS-006'],               corequisites: []             },
          { code: 'TDS-303',   name: 'Introducción a la Ingeniería de Software',      credits: 4, semester: 6, prerequisites: ['TDS-007', 'TDS-103', 'TDS-301'],    corequisites: []             },
          { code: 'TDS-EL2',   name: 'Electiva II',                                  credits: 3, semester: 6, prerequisites: [],                                   corequisites: []             },
          { code: 'DEP-101',   name: 'Educación Física',                              credits: 0, semester: 6, prerequisites: [],                                   corequisites: []             },
          { code: 'ADM-110',   name: 'Desarrollo de Emprendedores',                   credits: 3, semester: 6, prerequisites: ['CBG-215'],                          corequisites: []             },
          { code: 'ING-110',   name: 'Inglés Técnico',                                credits: 4, semester: 6, prerequisites: ['ING-004'],                          corequisites: []             },
          // C7
          { code: 'TDS-010',   name: 'Estructura de Datos',                           credits: 4, semester: 7, prerequisites: ['TDS-007'],                          corequisites: []             },
          { code: 'TDS-302',   name: 'Administración de Proyectos de Software',       credits: 4, semester: 7, prerequisites: ['TDS-007'],                          corequisites: []             },
          { code: 'TDS-011',   name: 'Introducción al Desarrollo de Aplicaciones Móviles', credits: 4, semester: 7, prerequisites: ['TDS-007'],                    corequisites: []             },
          { code: 'ADM-111',   name: 'Plan de Negocios',                              credits: 3, semester: 7, prerequisites: ['ADM-110'],                          corequisites: []             },
          { code: 'TDS-601',   name: 'Proyecto Final TDS',                            credits: 3, semester: 7, prerequisites: ['TDS-009', 'TDS-303'],               corequisites: []             },
        ],
      },
    },
  })
  console.log(`✓ ${tds.name} — ${tds.totalCredits} cr, ${tds.durationSemesters} cuatrimestres`)

  // ─── ITLA: Tecnólogo en Inteligencia Artificial (Res. 23-2020) — 105 cr, 6 C
  const tia = await prisma.career.create({
    data: {
      id: 'itla-tia',
      name: 'Tecnólogo en Inteligencia Artificial',
      universityId: itla.id,
      totalCredits: 105,
      durationSemesters: 6,
      subjects: {
        create: [
          // C1
          { code: 'TIA-100',   name: 'Introducción a la Inteligencia Artificial',     credits: 3, semester: 1, prerequisites: [],                                   corequisites: []  },
          { code: 'TI-101',    name: 'Fundamentos del Computador',                    credits: 4, semester: 1, prerequisites: [],                                   corequisites: []  },
          { code: 'ESP-101',   name: 'Redacción Castellana',                          credits: 4, semester: 1, prerequisites: [],                                   corequisites: []  },
          { code: 'MAT-001',   name: 'Pre-Cálculo',                                  credits: 5, semester: 1, prerequisites: [],                                   corequisites: []  },
          { code: 'CBG-110',   name: 'Ética',                                         credits: 3, semester: 1, prerequisites: [],                                   corequisites: []  },
          { code: 'OAI-001',   name: 'Orientación Institucional',                     credits: 1, semester: 1, prerequisites: [],                                   corequisites: []  },
          { code: 'ING-001',   name: 'Inglés Nivel 1-3',                             credits: 0, semester: 1, prerequisites: [],                                   corequisites: []  },
          // C2
          { code: 'TIA-200',   name: 'Bases de Datos: Diseño e Implementación',      credits: 3, semester: 2, prerequisites: ['TIA-100'],                          corequisites: []  },
          { code: 'TIA-110',   name: 'Álgebra Matricial',                            credits: 3, semester: 2, prerequisites: ['MAT-001'],                          corequisites: []  },
          { code: 'ING-002',   name: 'Inglés Nivel 4-6',                             credits: 0, semester: 2, prerequisites: ['ING-001'],                          corequisites: []  },
          { code: 'TDS-002',   name: 'Fundamentos de Programación',                  credits: 4, semester: 2, prerequisites: ['TI-101'],                           corequisites: []  },
          { code: 'TIA-202',   name: 'Lógica Matemática',                            credits: 3, semester: 2, prerequisites: ['MAT-001'],                          corequisites: []  },
          { code: 'CBG-210',   name: 'Probabilidad y Estadística',                   credits: 3, semester: 2, prerequisites: ['MAT-001'],                          corequisites: []  },
          // C3
          { code: 'TIA-301',   name: 'Python',                                        credits: 4, semester: 3, prerequisites: ['TDS-002'],                          corequisites: []  },
          { code: 'TIA-300',   name: 'Estadística Avanzada',                         credits: 3, semester: 3, prerequisites: ['CBG-210'],                          corequisites: []  },
          { code: 'TIA-310',   name: 'Lenguajes de Programación para IA',            credits: 4, semester: 3, prerequisites: ['TIA-100', 'TDS-002'],               corequisites: []  },
          { code: 'TIA-303',   name: 'Matemáticas Discretas',                        credits: 3, semester: 3, prerequisites: ['TIA-202'],                          corequisites: []  },
          { code: 'TIA-311',   name: 'Modelado de Agentes Inteligentes',             credits: 4, semester: 3, prerequisites: ['TIA-100'],                          corequisites: []  },
          { code: 'ING-003',   name: 'Inglés Nivel 7-9',                             credits: 0, semester: 3, prerequisites: ['ING-002'],                          corequisites: []  },
          // C4
          { code: 'CBG-215',   name: 'Metodología de la Investigación',              credits: 3, semester: 4, prerequisites: ['CBG-210'],                          corequisites: []  },
          { code: 'TIA-401',   name: 'Procesamiento del Lenguaje Natural',           credits: 3, semester: 4, prerequisites: ['TIA-310'],                          corequisites: []  },
          { code: 'TIA-410',   name: 'Modelos de Representación del Conocimiento',   credits: 3, semester: 4, prerequisites: ['TIA-303', 'TIA-311'],               corequisites: []  },
          { code: 'ING-004',   name: 'Inglés Nivel 10-12',                           credits: 0, semester: 4, prerequisites: ['ING-003'],                          corequisites: []  },
          { code: 'DEP-101',   name: 'Educación Física',                             credits: 0, semester: 4, prerequisites: [],                                   corequisites: []  },
          { code: 'TIA-430',   name: 'Seminario I',                                  credits: 2, semester: 4, prerequisites: ['CBG-215'],                          corequisites: []  },
          // C5
          { code: 'TIA-501',   name: 'Aprendizaje Automático',                       credits: 3, semester: 5, prerequisites: ['TIA-401'],                          corequisites: []  },
          { code: 'TIA-502',   name: 'Planificación Inteligente',                    credits: 3, semester: 5, prerequisites: ['TIA-410'],                          corequisites: []  },
          { code: 'TIA-503',   name: 'Reconocimiento de Escenas',                    credits: 3, semester: 5, prerequisites: ['TIA-311'],                          corequisites: []  },
          { code: 'TIA-504',   name: 'Inteligencia Artificial Distribuida',          credits: 3, semester: 5, prerequisites: ['TIA-311'],                          corequisites: []  },
          { code: 'ADM-110',   name: 'Desarrollo de Emprendedores',                  credits: 3, semester: 5, prerequisites: ['CBG-215'],                          corequisites: []  },
          { code: 'ING-110',   name: 'Inglés Técnico',                               credits: 4, semester: 5, prerequisites: ['ING-004'],                          corequisites: []  },
          { code: 'TIA-530',   name: 'Seminario II',                                 credits: 2, semester: 5, prerequisites: ['TIA-430'],                          corequisites: []  },
          // C6
          { code: 'TIA-601',   name: 'Aprendizaje Profundo',                         credits: 3, semester: 6, prerequisites: ['TIA-501'],                          corequisites: []  },
          { code: 'TIA-602',   name: 'IA e IoT',                                     credits: 3, semester: 6, prerequisites: ['TIA-504'],                          corequisites: []  },
          { code: 'TIA-603',   name: 'Juegos Inteligentes',                          credits: 3, semester: 6, prerequisites: ['TIA-504'],                          corequisites: []  },
          { code: 'TIA-604',   name: 'Robótica Inteligente',                         credits: 3, semester: 6, prerequisites: ['TIA-502'],                          corequisites: []  },
          { code: 'ADM-111',   name: 'Plan de Negocios',                             credits: 3, semester: 6, prerequisites: ['ADM-110'],                          corequisites: []  },
          { code: 'TIA-800',   name: 'Proyecto Final TIA',                           credits: 4, semester: 6, prerequisites: [],                                   corequisites: []  },
        ],
      },
    },
  })
  console.log(`✓ ${tia.name} — ${tia.totalCredits} cr, ${tia.durationSemesters} cuatrimestres`)

  // ─── ITLA: Tecnólogo en Multimedia (Res. 40-2018) — 151 cr, 7 cuatrimestres ─
  const tmm = await prisma.career.create({
    data: {
      id: 'itla-tmm',
      name: 'Tecnólogo en Multimedia',
      universityId: itla.id,
      totalCredits: 151,
      durationSemesters: 7,
      subjects: {
        create: [
          // C1
          { code: 'CBG-110',    name: 'Ética 1',                                       credits: 3, semester: 1, prerequisites: [],                                        corequisites: []             },
          { code: 'ESP-101',    name: 'Redacción Castellana',                          credits: 4, semester: 1, prerequisites: [],                                        corequisites: []             },
          { code: 'HIS-101',    name: 'Historia Universal',                            credits: 3, semester: 1, prerequisites: [],                                        corequisites: []             },
          { code: 'ING-001',    name: 'Inglés Nivel 1-3',                             credits: 0, semester: 1, prerequisites: [],                                        corequisites: []             },
          { code: 'OAI-001',    name: 'Orientación Institucional',                     credits: 1, semester: 1, prerequisites: [],                                        corequisites: []             },
          { code: 'TMM-001',    name: 'Introducción a la Multimedia',                  credits: 3, semester: 1, prerequisites: [],                                        corequisites: []             },
          { code: 'TMM-002',    name: 'Dibujo e Ilustración',                          credits: 3, semester: 1, prerequisites: [],                                        corequisites: []             },
          { code: 'TI-101',     name: 'Fundamentos del Computador',                   credits: 4, semester: 1, prerequisites: [],                                        corequisites: []             },
          // C2
          { code: 'DEP-101',    name: 'Educación Física',                              credits: 0, semester: 2, prerequisites: [],                                        corequisites: []             },
          { code: 'HIS-102',    name: 'Historia Dominicana',                           credits: 3, semester: 2, prerequisites: ['HIS-101'],                              corequisites: []             },
          { code: 'ING-002',    name: 'Inglés Nivel 4-6',                             credits: 0, semester: 2, prerequisites: ['ING-001'],                              corequisites: []             },
          { code: 'MAT-010',    name: 'Matemática Aplicada para Multimedia',          credits: 5, semester: 2, prerequisites: [],                                        corequisites: []             },
          { code: 'TMM-003',    name: 'Razonamiento Crítico',                         credits: 3, semester: 2, prerequisites: ['TMM-001', 'TMM-002'],                    corequisites: []             },
          { code: 'TMM-004',    name: 'Introducción a la Comunicación Visual',        credits: 3, semester: 2, prerequisites: ['TMM-001'],                              corequisites: []             },
          { code: 'TMM-005',    name: 'Gráficos de Mapa de Bits',                     credits: 3, semester: 2, prerequisites: ['TMM-001'],                              corequisites: []             },
          // C3
          { code: 'CBG-115',    name: 'Ética 2',                                       credits: 3, semester: 3, prerequisites: ['CBG-110'],                              corequisites: []             },
          { code: 'ING-003',    name: 'Inglés Nivel 7-9',                             credits: 0, semester: 3, prerequisites: ['ING-002'],                              corequisites: []             },
          { code: 'MTE-006',    name: 'Estadística Básica',                           credits: 3, semester: 3, prerequisites: ['MAT-010'],                              corequisites: []             },
          { code: 'TDS-001',    name: 'Introducción a la Elaboración de Algoritmos',  credits: 4, semester: 3, prerequisites: ['TMM-002', 'TMM-004'],                    corequisites: []             },
          { code: 'TMM-006',    name: 'Gráficos Vectoriales',                         credits: 3, semester: 3, prerequisites: ['TMM-005', 'TMM-004', 'MAT-010'],        corequisites: []             },
          { code: 'TMM-007',    name: 'Comunicación Visual Avanzada',                 credits: 3, semester: 3, prerequisites: ['TMM-004'],                              corequisites: []             },
          { code: 'TMM-008',    name: 'Fotografía',                                   credits: 3, semester: 3, prerequisites: ['TMM-001', 'TMM-005'],                    corequisites: []             },
          { code: 'TMMP-001',   name: 'Marketing',                                    credits: 3, semester: 3, prerequisites: ['TMM-001', 'TMM-003'],                    corequisites: []             },
          // C4
          { code: 'CBG-215',    name: 'Metodología de la Investigación',              credits: 3, semester: 4, prerequisites: ['MTE-006'],                              corequisites: []             },
          { code: 'TMM-009',    name: 'Introducción a Desktop Publishing',            credits: 3, semester: 4, prerequisites: ['TMM-004', 'TMM-006', 'TMM-007'],        corequisites: []             },
          { code: 'TMM-010',    name: 'Ilustración Digital',                          credits: 3, semester: 4, prerequisites: ['TMM-006', 'TMM-007'],                    corequisites: []             },
          { code: 'TMM-101',    name: 'Animación 2D',                                 credits: 3, semester: 4, prerequisites: ['TMM-006', 'TMM-007'],                    corequisites: ['TMM-101-L']  },
          { code: 'TMM-101-L',  name: 'Lab. Animación 2D',                            credits: 1, semester: 4, prerequisites: ['TMM-006', 'TMM-007'],                    corequisites: ['TMM-101']    },
          { code: 'TMM-102',    name: '3D Modelado y Renderizado',                    credits: 3, semester: 4, prerequisites: ['TMM-006', 'TMM-007'],                    corequisites: []             },
          { code: 'TMM-201',    name: 'HTML y Creación de Web Sites',                 credits: 3, semester: 4, prerequisites: ['TDS-001'],                              corequisites: []             },
          { code: 'TMM-301',    name: 'Audio Digital',                                credits: 3, semester: 4, prerequisites: ['TMM-007'],                              corequisites: []             },
          { code: 'TMM-401',    name: 'Producción Audiovisual',                       credits: 3, semester: 4, prerequisites: ['TMM-006', 'TMM-007', 'TMM-008'],        corequisites: []             },
          // C5
          { code: 'ADM-110',    name: 'Desarrollo de Emprendedores',                  credits: 3, semester: 5, prerequisites: ['CBG-215'],                              corequisites: []             },
          { code: 'ING-004',    name: 'Inglés Nivel 10-12',                           credits: 0, semester: 5, prerequisites: ['ING-003'],                              corequisites: []             },
          { code: 'TMM-011',    name: 'Desktop Publishing Avanzado',                  credits: 3, semester: 5, prerequisites: ['TMM-009'],                              corequisites: []             },
          { code: 'TMM-103',    name: 'Interactividad',                               credits: 3, semester: 5, prerequisites: ['TMM-101', 'TDS-001'],                    corequisites: []             },
          { code: 'TMM-104',    name: '3D Luces y Texturas',                          credits: 3, semester: 5, prerequisites: ['TMM-102'],                              corequisites: ['TMM-104-L']  },
          { code: 'TMM-104-L',  name: 'Lab. 3D Luces y Texturas',                    credits: 1, semester: 5, prerequisites: ['TMM-102'],                              corequisites: ['TMM-104']    },
          { code: 'TMM-202',    name: 'Programación Web',                             credits: 3, semester: 5, prerequisites: ['TMM-201'],                              corequisites: []             },
          { code: 'TMM-302',    name: 'Audio Digital Avanzado',                       credits: 3, semester: 5, prerequisites: ['TMM-301'],                              corequisites: []             },
          { code: 'TMM-402',    name: 'Edición y Post-Producción de Video',           credits: 3, semester: 5, prerequisites: ['TMM-401'],                              corequisites: []             },
          // C6
          { code: 'ING-110',    name: 'Inglés Técnico',                               credits: 4, semester: 6, prerequisites: ['ING-004'],                              corequisites: []             },
          { code: 'TMM-105',    name: '3D Creación de Personajes y Animación',        credits: 3, semester: 6, prerequisites: ['TMM-010', 'TMM-101', 'TMM-104'],        corequisites: ['TMM-105-L']  },
          { code: 'TMM-105-L',  name: 'Lab. 3D Creación de Personajes y Animación',  credits: 1, semester: 6, prerequisites: ['TMM-010', 'TMM-101', 'TMM-104'],        corequisites: ['TMM-105']    },
          { code: 'TMM-203',    name: 'Diseño y Maquetación de Interfaz',             credits: 3, semester: 6, prerequisites: ['TMM-011', 'TMM-202'],                    corequisites: []             },
          { code: 'TMM-403',    name: 'Motion Graphics y Efectos Visuales',          credits: 3, semester: 6, prerequisites: ['TMM-402'],                              corequisites: []             },
          { code: 'TMMP-002',   name: 'Publicidad',                                   credits: 3, semester: 6, prerequisites: ['TMMP-001', 'TMM-011', 'TMM-402'],       corequisites: []             },
          { code: 'TMMP-003',   name: 'Gestión Empresarial Publicitaria',             credits: 3, semester: 6, prerequisites: ['TMMP-001'],                             corequisites: []             },
          { code: 'TMM-EL1',    name: 'Electiva 1',                                   credits: 3, semester: 6, prerequisites: [],                                        corequisites: []             },
          // C7
          { code: 'ADM-111',    name: 'Plan de Negocios',                             credits: 3, semester: 7, prerequisites: ['ADM-110'],                              corequisites: []             },
          { code: 'CBG-120',    name: 'Ética 3',                                       credits: 3, semester: 7, prerequisites: ['CBG-115'],                              corequisites: []             },
          { code: 'TMM-012',    name: 'Diseño de Empaques',                           credits: 3, semester: 7, prerequisites: ['TMM-011', 'TMM-104', 'TMMP-002'],       corequisites: []             },
          { code: 'TMM-013',    name: 'Identidad Corporativa',                        credits: 3, semester: 7, prerequisites: ['TMM-011', 'TMMP-002', 'TMMP-003'],      corequisites: []             },
          { code: 'TMM-014',    name: 'Redacción de Textos Publicitarios',            credits: 3, semester: 7, prerequisites: ['TMMP-002', 'TMM-302'],                   corequisites: []             },
          { code: 'TMM-015',    name: 'Proyecto Final TMM',                           credits: 3, semester: 7, prerequisites: ['TMM-105', 'TMM-203', 'TMM-302', 'TMMP-002'], corequisites: []        },
          { code: 'TMM-EL2',    name: 'Electiva 2',                                   credits: 3, semester: 7, prerequisites: [],                                        corequisites: []             },
        ],
      },
    },
  })
  console.log(`✓ ${tmm.name} — ${tmm.totalCredits} cr, ${tmm.durationSemesters} cuatrimestres`)

  // ─── UNICARIBE: Ingeniería de Software — 185 cr, 12 cuatrimestres ─────────
  const isw = await prisma.career.create({
    data: {
      id: 'unicaribe-isw',
      name: 'Ingeniería de Software',
      universityId: unicaribe.id,
      totalCredits: 185,
      durationSemesters: 12,
      subjects: {
        create: [
          // C1
          { code: 'FGC-101',  name: 'Orientación Académica Institucional',             credits: 2, semester: 1,  prerequisites: [],                                  corequisites: [] },
          { code: 'FGC-102',  name: 'Método del Trabajo Académico',                   credits: 2, semester: 1,  prerequisites: [],                                  corequisites: [] },
          { code: 'FGC-103',  name: 'Metodología de la Investigación',                credits: 3, semester: 1,  prerequisites: [],                                  corequisites: [] },
          { code: 'ADE-101',  name: 'Administración I',                               credits: 3, semester: 1,  prerequisites: [],                                  corequisites: [] },
          // C2
          { code: 'FGC-104',  name: 'Lengua Española I',                              credits: 3, semester: 2,  prerequisites: ['FGC-102'],                         corequisites: [] },
          { code: 'FGC-105',  name: 'Matemática Básica I',                            credits: 3, semester: 2,  prerequisites: ['FGC-102'],                         corequisites: [] },
          { code: 'FGC-106',  name: 'Tecnología de la Información y Comunicación I',  credits: 3, semester: 2,  prerequisites: ['FGC-102'],                         corequisites: [] },
          { code: 'ING-101',  name: 'Introducción a la Ingeniería',                   credits: 3, semester: 2,  prerequisites: [],                                  corequisites: [] },
          // C3
          { code: 'FGC-107',  name: 'Historia Social Dominicana',                     credits: 3, semester: 3,  prerequisites: ['FGC-102'],                         corequisites: [] },
          { code: 'FGC-108',  name: 'Inglés I',                                       credits: 3, semester: 3,  prerequisites: ['FGC-102'],                         corequisites: [] },
          { code: 'DMF-209',  name: 'Física I',                                       credits: 4, semester: 3,  prerequisites: ['FGC-105'],                         corequisites: [] },
          { code: 'INF-221',  name: 'Introducción a la Programación',                 credits: 3, semester: 3,  prerequisites: ['FGC-106'],                         corequisites: [] },
          { code: 'MTI-200',  name: 'Matemática II',                                  credits: 4, semester: 3,  prerequisites: ['FGC-105'],                         corequisites: [] },
          // C4
          { code: 'FGC-109',  name: 'Filosofía',                                      credits: 2, semester: 4,  prerequisites: ['FGC-102'],                         corequisites: [] },
          { code: 'FGC-110',  name: 'Desarrollo Sostenible y Gestión de Riesgos',     credits: 2, semester: 4,  prerequisites: ['FGC-102'],                         corequisites: [] },
          { code: 'MTI-300',  name: 'Matemática III',                                 credits: 4, semester: 4,  prerequisites: ['MTI-200'],                         corequisites: [] },
          { code: 'DMF-210',  name: 'Física II',                                      credits: 4, semester: 4,  prerequisites: ['DMF-209'],                         corequisites: [] },
          // C5
          { code: 'MAT-241',  name: 'Estadística I',                                  credits: 3, semester: 5,  prerequisites: ['FGC-105'],                         corequisites: [] },
          { code: 'QUI-400',  name: 'Química I',                                      credits: 3, semester: 5,  prerequisites: ['FGC-105'],                         corequisites: [] },
          { code: 'INF-215',  name: 'Ingeniería Económica',                           credits: 3, semester: 5,  prerequisites: ['MTI-200'],                         corequisites: [] },
          { code: 'ING-103',  name: 'Cálculo Integral',                               credits: 4, semester: 5,  prerequisites: ['MTI-300'],                         corequisites: [] },
          // C6
          { code: 'MAT-242',  name: 'Estadística II',                                 credits: 3, semester: 6,  prerequisites: ['MAT-241'],                         corequisites: [] },
          { code: 'ING-105',  name: 'Taller de Mecánica de Hardware',                 credits: 3, semester: 6,  prerequisites: ['FGC-106'],                         corequisites: [] },
          { code: 'ING-104',  name: 'Cálculo Vectorial',                              credits: 4, semester: 6,  prerequisites: ['ING-103'],                         corequisites: [] },
          { code: 'INF-222',  name: 'Sistema Operativo I',                            credits: 3, semester: 6,  prerequisites: ['FGC-106'],                         corequisites: [] },
          { code: 'ING-102',  name: 'Ciencia e Ingeniería de Materiales',             credits: 4, semester: 6,  prerequisites: ['QUI-400'],                         corequisites: [] },
          // C7
          { code: 'TIC-408',  name: 'Seguridad de la Información',                    credits: 3, semester: 7,  prerequisites: ['FGC-106'],                         corequisites: [] },
          { code: 'ISW-301',  name: 'Taller de Programación I',                       credits: 5, semester: 7,  prerequisites: ['INF-221'],                         corequisites: [] },
          { code: 'INF-437',  name: 'Redes Informáticas',                             credits: 3, semester: 7,  prerequisites: ['INF-222'],                         corequisites: [] },
          { code: 'ISW-311',  name: 'Análisis y Diseño de Sistemas',                  credits: 4, semester: 7,  prerequisites: ['INF-221'],                         corequisites: [] },
          // C8
          { code: 'ISW-221',  name: 'Estructura de Datos',                            credits: 4, semester: 8,  prerequisites: ['ISW-301'],                         corequisites: [] },
          { code: 'TIC-402',  name: 'Ética en Tecnología',                            credits: 2, semester: 8,  prerequisites: ['FGC-110'],                         corequisites: [] },
          { code: 'ISW-404',  name: 'Electiva I',                                     credits: 3, semester: 8,  prerequisites: [],                                  corequisites: [] },
          { code: 'ISW-321',  name: 'Taller de Bases de Datos I',                     credits: 4, semester: 8,  prerequisites: ['ISW-311'],                         corequisites: [] },
          // C9
          { code: 'ISW-302',  name: 'Taller de Programación II',                      credits: 5, semester: 9,  prerequisites: ['ISW-301'],                         corequisites: [] },
          { code: 'ISW-312',  name: 'Ingeniería de Software I',                       credits: 4, semester: 9,  prerequisites: ['ISW-301'],                         corequisites: [] },
          { code: 'ISW-314',  name: 'Ingeniería de Requisitos y Modelado',            credits: 4, semester: 9,  prerequisites: ['ISW-311'],                         corequisites: [] },
          { code: 'ISW-322',  name: 'Taller de Bases de Datos II',                    credits: 4, semester: 9,  prerequisites: ['ISW-321'],                         corequisites: [] },
          { code: 'ISW-324',  name: 'Sistemas de Información Geográfica',             credits: 3, semester: 9,  prerequisites: ['ISW-321'],                         corequisites: [] },
          // C10
          { code: 'ISW-313',  name: 'Ingeniería de Software II',                      credits: 4, semester: 10, prerequisites: ['ISW-312'],                         corequisites: [] },
          { code: 'ISW-303',  name: 'Taller de Programación III',                     credits: 5, semester: 10, prerequisites: ['ISW-302'],                         corequisites: [] },
          { code: 'ISW-405',  name: 'Electiva II',                                    credits: 3, semester: 10, prerequisites: [],                                  corequisites: [] },
          { code: 'ISW-401',  name: 'Proyecto de Software I',                         credits: 5, semester: 10, prerequisites: ['ISW-312'],                         corequisites: [] },
          { code: 'ISW-403',  name: 'Pasantía — Práctica de Ingeniería de Software',  credits: 8, semester: 10, prerequisites: ['ISW-302'],                         corequisites: [] },
          // C11
          { code: 'ISW-304',  name: 'Taller de Programación IV',                      credits: 5, semester: 11, prerequisites: ['ISW-303'],                         corequisites: [] },
          { code: 'ISW-305',  name: 'Diseño y Construcción de Interfaces',            credits: 4, semester: 11, prerequisites: ['ISW-302'],                         corequisites: [] },
          { code: 'ISW-402',  name: 'Proyecto de Software II',                        credits: 5, semester: 11, prerequisites: ['ISW-401'],                         corequisites: [] },
          { code: 'FGC-111',  name: 'Seminario de Grado',                             credits: 3, semester: 11, prerequisites: ['FGC-103'],                         corequisites: [] },
          // C12
          { code: 'ISW-323',  name: 'Taller de Base de Datos III',                    credits: 4, semester: 12, prerequisites: ['ISW-322'],                         corequisites: [] },
          { code: 'ISW-400',  name: 'Inteligencia Artificial',                        credits: 4, semester: 12, prerequisites: ['ISW-303'],                         corequisites: [] },
          { code: 'ISW-600',  name: 'Proyecto Integrador de Software: Trabajo de Grado', credits: 6, semester: 12, prerequisites: [],                               corequisites: [] },
        ],
      },
    },
  })
  console.log(`✓ ${isw.name} — ${isw.totalCredits} cr, ${isw.durationSemesters} cuatrimestres`)

  // ─── UNPHU: Licenciatura en Farmacia — 215 cr, 13 períodos ───────────────
  const farmacia = await prisma.career.create({
    data: {
      id: 'unphu-farmacia',
      name: 'Licenciatura en Farmacia',
      universityId: unphu.id,
      totalCredits: 215,
      durationSemesters: 13,
      subjects: {
        create: [
          // Período 1
          { code: 'BIO-101',    name: 'Biología General',                                          credits: 3, semester: 1,  prerequisites: [],                                                                                   corequisites: ['BIO-101-L']  },
          { code: 'BIO-101-L',  name: 'Lab. Biología General',                                     credits: 0, semester: 1,  prerequisites: [],                                                                                   corequisites: ['BIO-101']    },
          { code: 'ELT-001',    name: 'Electiva I (Artes y Deportes)',                             credits: 1, semester: 1,  prerequisites: [],                                                                                   corequisites: []             },
          { code: 'HUM-150',    name: 'Historia de la Cultura Universal',                          credits: 3, semester: 1,  prerequisites: [],                                                                                   corequisites: []             },
          { code: 'HUM-160',    name: 'Historia Dominicana',                                       credits: 3, semester: 1,  prerequisites: [],                                                                                   corequisites: []             },
          { code: 'LET-101',    name: 'Lengua Española y Técnica de la Expresión I',               credits: 3, semester: 1,  prerequisites: [],                                                                                   corequisites: []             },
          { code: 'MAT-060',    name: 'Matemática Básica',                                         credits: 4, semester: 1,  prerequisites: [],                                                                                   corequisites: []             },
          { code: 'ORI-100',    name: 'Orientación Universitaria',                                 credits: 1, semester: 1,  prerequisites: [],                                                                                   corequisites: []             },
          { code: 'QUI-111',    name: 'Química General I',                                         credits: 3, semester: 1,  prerequisites: [],                                                                                   corequisites: ['QUI-111-L']  },
          { code: 'QUI-111-L',  name: 'Lab. Química General I',                                    credits: 0, semester: 1,  prerequisites: [],                                                                                   corequisites: ['QUI-111']    },
          // Período 2
          { code: 'MAT-333',    name: 'Bioestadística y Demografía',                               credits: 3, semester: 2,  prerequisites: ['MAT-060'],                                                                          corequisites: []             },
          { code: 'BIO-102',    name: 'Biología General II',                                       credits: 3, semester: 2,  prerequisites: ['BIO-101', 'BIO-101-L'],                                                             corequisites: ['BIO-102-L']  },
          { code: 'BIO-102-L',  name: 'Lab. Biología General II',                                  credits: 0, semester: 2,  prerequisites: ['BIO-101', 'BIO-101-L'],                                                             corequisites: ['BIO-102']    },
          { code: 'FIS-011',    name: 'Física Básica I',                                           credits: 3, semester: 2,  prerequisites: [],                                                                                   corequisites: ['FIS-011-L']  },
          { code: 'FIS-011-L',  name: 'Lab. Física Básica I',                                      credits: 0, semester: 2,  prerequisites: [],                                                                                   corequisites: ['FIS-011']    },
          { code: 'INF-200',    name: 'Informática Básica y Cultural',                             credits: 3, semester: 2,  prerequisites: [],                                                                                   corequisites: []             },
          { code: 'LEX-113',    name: 'Inglés Introductorio de Cs. de la Salud',                   credits: 3, semester: 2,  prerequisites: [],                                                                                   corequisites: []             },
          { code: 'LET-102',    name: 'Lengua Española y Técnica de la Expresión II',              credits: 3, semester: 2,  prerequisites: ['LET-101'],                                                                          corequisites: []             },
          { code: 'QUI-112',    name: 'Química General II',                                        credits: 3, semester: 2,  prerequisites: ['QUI-111', 'QUI-111-L'],                                                             corequisites: ['QUI-112-L']  },
          { code: 'QUI-112-L',  name: 'Lab. Química General II',                                   credits: 0, semester: 2,  prerequisites: ['QUI-111', 'QUI-111-L'],                                                             corequisites: ['QUI-112']    },
          // Período 3
          { code: 'FIS-012',    name: 'Física Básica II',                                          credits: 3, semester: 3,  prerequisites: ['FIS-011', 'FIS-011-L'],                                                             corequisites: ['FIS-012-L']  },
          { code: 'FIS-012-L',  name: 'Lab. Física Básica II',                                     credits: 0, semester: 3,  prerequisites: ['FIS-011', 'FIS-011-L'],                                                             corequisites: ['FIS-012']    },
          { code: 'BIO-250',    name: 'Genética General',                                          credits: 3, semester: 3,  prerequisites: ['BIO-101', 'BIO-101-L'],                                                             corequisites: ['BIO-250-L']  },
          { code: 'BIO-250-L',  name: 'Lab. Genética General',                                     credits: 0, semester: 3,  prerequisites: ['BIO-101', 'BIO-101-L'],                                                             corequisites: ['BIO-250']    },
          { code: 'LEX-128',    name: 'Inglés Técnico de Ciencias de la Salud',                    credits: 3, semester: 3,  prerequisites: ['LEX-113'],                                                                          corequisites: []             },
          { code: 'PSI-100',    name: 'Psicología General',                                        credits: 3, semester: 3,  prerequisites: [],                                                                                   corequisites: []             },
          { code: 'QUI-220',    name: 'Química Inorgánica',                                        credits: 3, semester: 3,  prerequisites: ['QUI-112', 'QUI-112-L'],                                                             corequisites: ['QUI-220-L']  },
          { code: 'QUI-220-L',  name: 'Lab. Química Inorgánica',                                   credits: 0, semester: 3,  prerequisites: ['QUI-112', 'QUI-112-L'],                                                             corequisites: ['QUI-220']    },
          { code: 'LET-211',    name: 'Raíces Griegas y Latinas',                                  credits: 3, semester: 3,  prerequisites: ['LET-102'],                                                                          corequisites: []             },
          // Período 4
          { code: 'MED-074',    name: 'Anatomía General Humana',                                   credits: 3, semester: 4,  prerequisites: ['BIO-102', 'BIO-102-L'],                                                             corequisites: ['MED-074-L']  },
          { code: 'MED-074-L',  name: 'Lab. Anatomía General Humana',                              credits: 0, semester: 4,  prerequisites: ['BIO-102', 'BIO-102-L'],                                                             corequisites: ['MED-074']    },
          { code: 'BIO-265',    name: 'Biofísica',                                                 credits: 3, semester: 4,  prerequisites: ['FIS-012', 'FIS-012-L'],                                                             corequisites: ['BIO-265-L']  },
          { code: 'BIO-265-L',  name: 'Lab. Biofísica',                                            credits: 0, semester: 4,  prerequisites: ['FIS-012', 'FIS-012-L'],                                                             corequisites: ['BIO-265']    },
          { code: 'FAR-241',    name: 'Fisicoquímica Farmacéutica',                                credits: 3, semester: 4,  prerequisites: ['FIS-012', 'FIS-012-L', 'QUI-112', 'QUI-112-L'],                                     corequisites: ['FAR-241-L']  },
          { code: 'FAR-241-L',  name: 'Lab. Fisicoquímica Farmacéutica',                           credits: 0, semester: 4,  prerequisites: ['FIS-012', 'FIS-012-L', 'QUI-112', 'QUI-112-L'],                                     corequisites: ['FAR-241']    },
          { code: 'MED-103',    name: 'Informática para Ciencias de la Salud',                     credits: 2, semester: 4,  prerequisites: ['INF-200'],                                                                          corequisites: ['MED-103-L']  },
          { code: 'MED-103-L',  name: 'Lab. Informática para Ciencias de la Salud',               credits: 0, semester: 4,  prerequisites: ['INF-200'],                                                                          corequisites: ['MED-103']    },
          { code: 'PSI-105',    name: 'Psicología Aplicada',                                       credits: 3, semester: 4,  prerequisites: ['PSI-100'],                                                                          corequisites: []             },
          { code: 'QUI-241',    name: 'Química Orgánica I',                                        credits: 3, semester: 4,  prerequisites: ['QUI-112', 'QUI-112-L'],                                                             corequisites: ['QUI-241-L']  },
          { code: 'QUI-241-L',  name: 'Lab. Química Orgánica I',                                   credits: 0, semester: 4,  prerequisites: ['QUI-112', 'QUI-112-L'],                                                             corequisites: ['QUI-241']    },
          // Período 5
          { code: 'MED-075',    name: 'Fisiología General Humana',                                 credits: 3, semester: 5,  prerequisites: ['MED-074', 'MED-074-L'],                                                             corequisites: ['MED-075-L']  },
          { code: 'MED-075-L',  name: 'Lab. Fisiología General Humana',                            credits: 0, semester: 5,  prerequisites: ['MED-074', 'MED-074-L'],                                                             corequisites: ['MED-075']    },
          { code: 'FAR-250',    name: 'Historia de la Farmacia e Intro. a las Cs. Farmacéuticas',  credits: 3, semester: 5,  prerequisites: [],                                                                                   corequisites: []             },
          { code: 'MED-021',    name: 'Introducción a la Investigación Científica',                credits: 3, semester: 5,  prerequisites: [],                                                                                   corequisites: []             },
          { code: 'MED-070',    name: 'Medicina Social y Preventiva',                              credits: 4, semester: 5,  prerequisites: ['MAT-333'],                                                                          corequisites: ['MED-070-L']  },
          { code: 'MED-070-L',  name: 'Lab. Medicina Social y Preventiva',                         credits: 0, semester: 5,  prerequisites: ['MAT-333'],                                                                          corequisites: ['MED-070']    },
          { code: 'BIO-225',    name: 'Parasitología',                                             credits: 3, semester: 5,  prerequisites: ['BIO-102', 'BIO-102-L'],                                                             corequisites: ['BIO-225-L']  },
          { code: 'BIO-225-L',  name: 'Lab. Parasitología',                                        credits: 0, semester: 5,  prerequisites: ['BIO-102', 'BIO-102-L'],                                                             corequisites: ['BIO-225']    },
          { code: 'QUI-242',    name: 'Química Orgánica II',                                       credits: 4, semester: 5,  prerequisites: ['QUI-241', 'QUI-241-L'],                                                             corequisites: ['QUI-242-L']  },
          { code: 'QUI-242-L',  name: 'Lab. Química Orgánica II',                                  credits: 0, semester: 5,  prerequisites: ['QUI-241', 'QUI-241-L'],                                                             corequisites: ['QUI-242']    },
          // Período 6
          { code: 'MED-145',    name: 'Bioética Médica',                                           credits: 4, semester: 6,  prerequisites: [],                                                                                   corequisites: []             },
          { code: 'QUI-367',    name: 'Bioquímica Molecular',                                      credits: 3, semester: 6,  prerequisites: ['QUI-242', 'QUI-242-L'],                                                             corequisites: ['QUI-367-L']  },
          { code: 'QUI-367-L',  name: 'Lab. Bioquímica Molecular',                                 credits: 0, semester: 6,  prerequisites: ['QUI-242', 'QUI-242-L'],                                                             corequisites: ['QUI-367']    },
          { code: 'FAR-260',    name: 'Dermofarmacia y Cosmetología',                              credits: 3, semester: 6,  prerequisites: ['BIO-102', 'BIO-102-L', 'FAR-241', 'FAR-241-L', 'MAT-060', 'QUI-112', 'QUI-112-L'], corequisites: ['FAR-260-L']  },
          { code: 'FAR-260-L',  name: 'Lab. Dermofarmacia y Cosmetología',                         credits: 0, semester: 6,  prerequisites: ['BIO-102', 'BIO-102-L', 'FAR-241', 'FAR-241-L', 'MAT-060', 'QUI-112', 'QUI-112-L'], corequisites: ['FAR-260']    },
          { code: 'FAR-240',    name: 'Farmacobotánica',                                           credits: 2, semester: 6,  prerequisites: ['BIO-102', 'BIO-102-L'],                                                             corequisites: ['FAR-240-L']  },
          { code: 'FAR-240-L',  name: 'Lab. Farmacobotánica',                                      credits: 0, semester: 6,  prerequisites: ['BIO-102', 'BIO-102-L'],                                                             corequisites: ['FAR-240']    },
          { code: 'CON-116',    name: 'Fundamentos de Contabilidad',                               credits: 4, semester: 6,  prerequisites: [],                                                                                   corequisites: []             },
          { code: 'BIO-333',    name: 'Microbiología Médica',                                      credits: 4, semester: 6,  prerequisites: ['BIO-102', 'BIO-102-L'],                                                             corequisites: ['BIO-333-L']  },
          { code: 'BIO-333-L',  name: 'Lab. Microbiología Médica',                                 credits: 0, semester: 6,  prerequisites: ['BIO-102', 'BIO-102-L'],                                                             corequisites: ['BIO-333']    },
          // Período 7
          { code: 'QUI-250',    name: 'Análisis Químico Cuantitativo',                             credits: 3, semester: 7,  prerequisites: ['MAT-060', 'QUI-112', 'QUI-112-L'],                                                  corequisites: ['QUI-250-L']  },
          { code: 'QUI-250-L',  name: 'Lab. Análisis Químico Cuantitativo',                        credits: 0, semester: 7,  prerequisites: ['MAT-060', 'QUI-112', 'QUI-112-L'],                                                  corequisites: ['QUI-250']    },
          { code: 'FAR-231',    name: 'Farmacognosia',                                             credits: 3, semester: 7,  prerequisites: ['FAR-240', 'FAR-240-L'],                                                             corequisites: ['FAR-231-L']  },
          { code: 'FAR-231-L',  name: 'Lab. Farmacognosia',                                        credits: 0, semester: 7,  prerequisites: ['FAR-240', 'FAR-240-L'],                                                             corequisites: ['FAR-231']    },
          { code: 'MED-040',    name: 'Patología General',                                         credits: 3, semester: 7,  prerequisites: ['BIO-225', 'BIO-225-L'],                                                             corequisites: []             },
          { code: 'ADM-105',    name: 'Principios de Administración',                              credits: 3, semester: 7,  prerequisites: [],                                                                                   corequisites: []             },
          { code: 'FAR-370',    name: 'Química Farmacéutica',                                      credits: 3, semester: 7,  prerequisites: ['QUI-367', 'QUI-367-L'],                                                             corequisites: []             },
          { code: 'FAR-321',    name: 'Tecnología Farmacéutica I',                                 credits: 3, semester: 7,  prerequisites: ['FAR-241', 'FAR-241-L', 'MAT-060', 'QUI-112', 'QUI-112-L'],                          corequisites: ['FAR-321-L']  },
          { code: 'FAR-321-L',  name: 'Lab. Tecnología Farmacéutica I',                            credits: 0, semester: 7,  prerequisites: ['FAR-241', 'FAR-241-L', 'MAT-060', 'QUI-112', 'QUI-112-L'],                          corequisites: ['FAR-321']    },
          // Período 8
          { code: 'QUI-350',    name: 'Análisis Químico Instrumental',                             credits: 3, semester: 8,  prerequisites: ['QUI-241', 'QUI-241-L', 'QUI-250', 'QUI-250-L'],                                     corequisites: ['QUI-350-L']  },
          { code: 'QUI-350-L',  name: 'Lab. Análisis Químico Instrumental',                        credits: 0, semester: 8,  prerequisites: ['QUI-241', 'QUI-241-L', 'QUI-250', 'QUI-250-L'],                                     corequisites: ['QUI-350']    },
          { code: 'FAR-333',    name: 'Deontología y Legislación Farmacéutica',                    credits: 3, semester: 8,  prerequisites: ['FAR-250', 'MED-145'],                                                               corequisites: []             },
          { code: 'FAR-261',    name: 'Farmacología I',                                            credits: 3, semester: 8,  prerequisites: ['BIO-333', 'BIO-333-L', 'FAR-231', 'FAR-231-L', 'FAR-370', 'MED-040', 'MED-075', 'MED-075-L', 'QUI-367', 'QUI-367-L'], corequisites: ['FAR-261-L'] },
          { code: 'FAR-261-L',  name: 'Lab. Farmacología I',                                       credits: 0, semester: 8,  prerequisites: ['BIO-333', 'BIO-333-L', 'FAR-231', 'FAR-231-L', 'FAR-370', 'MED-040', 'MED-075', 'MED-075-L', 'QUI-367', 'QUI-367-L'], corequisites: ['FAR-261']   },
          { code: 'FAR-380',    name: 'Microbiología Industrial Farmacéutica',                     credits: 3, semester: 8,  prerequisites: ['BIO-333', 'BIO-333-L'],                                                             corequisites: ['FAR-380-L']  },
          { code: 'FAR-380-L',  name: 'Lab. Microbiología Industrial Farmacéutica',                credits: 0, semester: 8,  prerequisites: ['BIO-333', 'BIO-333-L'],                                                             corequisites: ['FAR-380']    },
          { code: 'FAR-322',    name: 'Tecnología Farmacéutica II',                                credits: 3, semester: 8,  prerequisites: ['FAR-321', 'FAR-321-L'],                                                             corequisites: ['FAR-322-L']  },
          { code: 'FAR-322-L',  name: 'Lab. Tecnología Farmacéutica II',                           credits: 0, semester: 8,  prerequisites: ['FAR-321', 'FAR-321-L'],                                                             corequisites: ['FAR-322']    },
          // Período 9
          { code: 'ELT-002',    name: 'Electiva II',                                               credits: 3, semester: 9,  prerequisites: ['BIO-102', 'BIO-102-L', 'MED-075', 'MED-075-L'],                                     corequisites: []             },
          { code: 'FAR-390',    name: 'Evaluación y Análisis de Productos Farmacéuticos',          credits: 4, semester: 9,  prerequisites: ['FAR-241', 'FAR-241-L', 'FAR-261', 'FAR-261-L', 'FAR-322', 'FAR-322-L', 'QUI-350', 'QUI-350-L'], corequisites: ['FAR-390-L'] },
          { code: 'FAR-390-L',  name: 'Lab. Evaluación y Análisis de Productos Farmacéuticos',    credits: 0, semester: 9,  prerequisites: ['FAR-241', 'FAR-241-L', 'FAR-261', 'FAR-261-L', 'FAR-322', 'FAR-322-L', 'QUI-350', 'QUI-350-L'], corequisites: ['FAR-390']   },
          { code: 'FAR-424',    name: 'Farmacia Industrial',                                       credits: 2, semester: 9,  prerequisites: ['FAR-322', 'FAR-322-L', 'FAR-333', 'QUI-241', 'QUI-241-L', 'QUI-350', 'QUI-350-L'], corequisites: ['FAR-424-L']  },
          { code: 'FAR-424-L',  name: 'Lab. Farmacia Industrial',                                  credits: 0, semester: 9,  prerequisites: ['FAR-322', 'FAR-322-L', 'FAR-333', 'QUI-241', 'QUI-241-L', 'QUI-350', 'QUI-350-L'], corequisites: ['FAR-424']    },
          { code: 'FAR-262',    name: 'Farmacología II',                                           credits: 3, semester: 9,  prerequisites: ['FAR-261', 'FAR-261-L'],                                                             corequisites: ['FAR-262-L']  },
          { code: 'FAR-262-L',  name: 'Lab. Farmacología II',                                      credits: 0, semester: 9,  prerequisites: ['FAR-261', 'FAR-261-L'],                                                             corequisites: ['FAR-262']    },
          { code: 'FAR-391',    name: 'Marketing Farmacéutico',                                    credits: 4, semester: 9,  prerequisites: ['ADM-105'],                                                                          corequisites: []             },
          // Período 10
          { code: 'FAR-501',    name: 'Aseguramiento de la Calidad Farmacéutica',                  credits: 4, semester: 10, prerequisites: ['FAR-424', 'FAR-424-L', 'QUI-350', 'QUI-350-L'],                                     corequisites: []             },
          { code: 'FAR-411',    name: 'Biofarmacia y Farmacocinética',                             credits: 3, semester: 10, prerequisites: ['FAR-262', 'FAR-262-L', 'FAR-322', 'FAR-322-L'],                                     corequisites: []             },
          { code: 'FAR-440',    name: 'Bromatología',                                              credits: 2, semester: 10, prerequisites: ['QUI-241', 'QUI-241-L', 'QUI-250', 'QUI-250-L'],                                     corequisites: ['FAR-440-L']  },
          { code: 'FAR-440-L',  name: 'Lab. Bromatología',                                         credits: 0, semester: 10, prerequisites: ['QUI-241', 'QUI-241-L', 'QUI-250', 'QUI-250-L'],                                     corequisites: ['FAR-440']    },
          { code: 'ELT-003',    name: 'Electiva III',                                              credits: 3, semester: 10, prerequisites: ['FAR-261', 'FAR-261-L', 'FAR-262', 'FAR-262-L', 'FAR-322', 'FAR-322-L', 'MAT-333'], corequisites: []             },
          { code: 'FAR-410',    name: 'Farmacia Clínica y Farmacoterapéutica',                     credits: 3, semester: 10, prerequisites: ['FAR-262', 'FAR-262-L', 'FAR-322', 'FAR-322-L', 'FAR-390', 'FAR-390-L'],             corequisites: []             },
          { code: 'FAR-450',    name: 'Toxicología',                                               credits: 3, semester: 10, prerequisites: ['QUI-241', 'QUI-241-L', 'QUI-250', 'QUI-250-L'],                                     corequisites: ['FAR-450-L']  },
          { code: 'FAR-450-L',  name: 'Lab. Toxicología',                                          credits: 0, semester: 10, prerequisites: ['QUI-241', 'QUI-241-L', 'QUI-250', 'QUI-250-L'],                                     corequisites: ['FAR-450']    },
          // Período 11
          { code: 'ELT-004',    name: 'Electiva IV',                                               credits: 3, semester: 11, prerequisites: ['FAR-261', 'FAR-261-L', 'FAR-322', 'FAR-322-L', 'FAR-450', 'FAR-450-L', 'MAT-333'], corequisites: ['ELT-104-L']  },
          { code: 'ELT-104-L',  name: 'Lab. Electiva IV',                                          credits: 0, semester: 11, prerequisites: ['FAR-261', 'FAR-261-L', 'FAR-322', 'FAR-322-L', 'FAR-450', 'FAR-450-L', 'MAT-333'], corequisites: ['ELT-004']    },
          { code: 'FAR-471',    name: 'Farmacia Comunitaria',                                      credits: 2, semester: 11, prerequisites: ['FAR-262', 'FAR-262-L', 'FAR-322', 'FAR-322-L', 'FAR-333', 'FAR-410'],               corequisites: ['FAR-471-L']  },
          { code: 'FAR-471-L',  name: 'Lab. Farmacia Comunitaria',                                 credits: 0, semester: 11, prerequisites: ['FAR-262', 'FAR-262-L', 'FAR-322', 'FAR-322-L', 'FAR-333', 'FAR-410'],               corequisites: ['FAR-471']    },
          { code: 'FAR-472',    name: 'Farmacia Hospitalaria',                                     credits: 2, semester: 11, prerequisites: ['FAR-262', 'FAR-262-L', 'FAR-333', 'FAR-410'],                                       corequisites: ['FAR-472-L']  },
          { code: 'FAR-472-L',  name: 'Lab. Farmacia Hospitalaria',                                credits: 0, semester: 11, prerequisites: ['FAR-262', 'FAR-262-L', 'FAR-333', 'FAR-410'],                                       corequisites: ['FAR-472']    },
          { code: 'FAR-412',    name: 'Farmacoeconomía y Gestión en Salud',                        credits: 4, semester: 11, prerequisites: ['FAR-262', 'FAR-262-L', 'FAR-410'],                                                  corequisites: []             },
          { code: 'FAR-413',    name: 'Gestión Regulatoria de Productos y Servicios Farmacéuticos', credits: 4, semester: 11, prerequisites: ['FAR-333', 'FAR-424', 'FAR-424-L'],                                                 corequisites: []             },
          { code: 'FAR-414',    name: 'Seminario de Trabajo de Grado',                             credits: 4, semester: 11, prerequisites: ['FAR-262', 'FAR-262-L', 'FAR-424', 'FAR-424-L', 'FAR-501', 'MED-021'],               corequisites: []             },
          // Período 12
          { code: 'FAR-490',    name: 'Pasantía Farmacia Industrial',                              credits: 6, semester: 12, prerequisites: [],                                                                                   corequisites: []             },
          // Período 13
          { code: 'FAR-903',    name: 'Trabajo de Grado',                                         credits: 6, semester: 13, prerequisites: [],                                                                                   corequisites: []             },
        ],
      },
    },
  })
  console.log(`✓ ${farmacia.name} — ${farmacia.totalCredits} cr, ${farmacia.durationSemesters} períodos`)

  console.log('\n✅ Seed completo.')
  console.log(`   Universidades: 3 (ITLA, UNPHU, UNICARIBE)`)
  console.log(`   Carreras: 5 (Sonido, TDS, TIA, Multimedia, ISW, Farmacia)`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
