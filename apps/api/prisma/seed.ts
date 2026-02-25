import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // ─── Limpieza ──────────────────────────────────────────────────────────────
  console.log('🧹 Limpiando datos de currículum...')
  await prisma.preselection.deleteMany()
  await prisma.studentSubject.deleteMany()
  await prisma.studentProfile.deleteMany()
  await prisma.subject.deleteMany()
  await prisma.career.deleteMany()
  await prisma.university.deleteMany()
  console.log('✓ DB limpia\n')

  // ─── Universidades ─────────────────────────────────────────────────────────
  const itla = await prisma.university.create({
    data: {
      id: 'university-itla',
      name: 'Instituto Tecnológico de Las Américas',
      shortName: 'ITLA',
      country: 'DO',
    },
  })
  console.log(`✓ ${itla.shortName} — ${itla.name}`)

  const unphu = await prisma.university.create({
    data: {
      id: 'university-unphu',
      name: 'Universidad Nacional Pedro Henríquez Ureña',
      shortName: 'UNPHU',
      country: 'DO',
    },
  })
  console.log(`✓ ${unphu.shortName} — ${unphu.name}\n`)

  // ─── ITLA: Tecnólogo en Sonido (Resolución 58-2022) ───────────────────────
  // Nota: el documento tiene dos materias con código TSO-104 en C3.
  // La segunda ("Introducción al Piano") se corrige a TSO-105,
  // ya que el propio documento la referencia así en los prerrequisitos de C4.

  const sonido = await prisma.career.create({
    data: {
      id: 'itla-sonido',
      name: 'Tecnólogo en Sonido',
      universityId: itla.id,
      totalCredits: 109,
      durationSemesters: 7,
      subjects: {
        create: [
          // ── C1 ─────────────────────────────────────────────────────────────
          { code: 'TI-101',    name: 'Fundamentos del Computador',         credits: 3, semester: 1, prerequisites: [],                          corequisites: []           },
          { code: 'TSO-101',   name: 'Introducción a la Música',           credits: 2, semester: 1, prerequisites: [],                          corequisites: []           },
          { code: 'ESP-101',   name: 'Redacción Castellana',               credits: 4, semester: 1, prerequisites: [],                          corequisites: []           },
          { code: 'TSO-001',   name: 'Teoría del Sonido',                  credits: 3, semester: 1, prerequisites: [],                          corequisites: []           },
          { code: 'OAI-001',   name: 'Orientación Institucional',          credits: 1, semester: 1, prerequisites: [],                          corequisites: []           },
          { code: 'TSO-002',   name: 'Introducción al DAW',                credits: 2, semester: 1, prerequisites: [],                          corequisites: ['TSO-002-L']},
          { code: 'TSO-002-L', name: 'Lab. Introducción al DAW',           credits: 1, semester: 1, prerequisites: [],                          corequisites: ['TSO-002']  },
          // ── C2 ─────────────────────────────────────────────────────────────
          { code: 'ING-001',   name: 'Inglés Nivel 1-3',                   credits: 0, semester: 2, prerequisites: [],                          corequisites: []           },
          { code: 'MAT-010',   name: 'Matemática Aplicada para Multimedia',credits: 5, semester: 2, prerequisites: [],                          corequisites: []           },
          { code: 'DEP-101',   name: 'Educación Física',                   credits: 0, semester: 2, prerequisites: [],                          corequisites: []           },
          { code: 'TSO-003',   name: 'Electrónica del Audio',              credits: 3, semester: 2, prerequisites: ['TSO-001'],                 corequisites: []           },
          { code: 'TSO-004',   name: 'Procesamiento de Señal',             credits: 3, semester: 2, prerequisites: ['TSO-001','TSO-002'],       corequisites: []           },
          { code: 'TSO-102',   name: 'Teoría Musical I',                   credits: 3, semester: 2, prerequisites: ['TSO-001'],                 corequisites: []           },
          // ── C3 ─────────────────────────────────────────────────────────────
          { code: 'ING-002',   name: 'Inglés Nivel 4-6',                   credits: 0, semester: 3, prerequisites: ['ING-001'],                 corequisites: []           },
          { code: 'TSO-005',   name: 'Mesa de Mezcla 1',                   credits: 3, semester: 3, prerequisites: ['TSO-004'],                 corequisites: []           },
          { code: 'TSO-006',   name: 'Microfonía',                         credits: 3, semester: 3, prerequisites: ['TSO-003'],                 corequisites: []           },
          { code: 'TSO-103',   name: 'Teoría Musical II',                  credits: 3, semester: 3, prerequisites: ['TSO-102'],                 corequisites: []           },
          { code: 'TSO-104',   name: 'Entrenamiento Auditivo Musical',     credits: 3, semester: 3, prerequisites: ['TSO-102'],                 corequisites: []           },
          { code: 'TSO-105',   name: 'Introducción al Piano',              credits: 3, semester: 3, prerequisites: ['TSO-102'],                 corequisites: []           },
          { code: 'TSO-201',   name: 'Sonido para Audiovisuales',          credits: 3, semester: 3, prerequisites: ['TSO-002'],                 corequisites: []           },
          // ── C4 ─────────────────────────────────────────────────────────────
          { code: 'ING-003',   name: 'Inglés Nivel 7-9',                   credits: 0, semester: 4, prerequisites: ['ING-002'],                 corequisites: []           },
          { code: 'TSO-106',   name: 'Entrenamiento Auditivo Frecuencial', credits: 3, semester: 4, prerequisites: ['TSO-104'],                 corequisites: []           },
          { code: 'TSO-107',   name: 'Producción Musical',                 credits: 3, semester: 4, prerequisites: ['TSO-004','TSO-105'],       corequisites: []           },
          { code: 'TSO-300',   name: 'Grabación en Estudio',               credits: 2, semester: 4, prerequisites: ['TSO-005'],                 corequisites: ['TSO-300-L']},
          { code: 'TSO-300-L', name: 'Lab. Grabación en Estudio',          credits: 1, semester: 4, prerequisites: ['TSO-005'],                 corequisites: ['TSO-300']  },
          { code: 'TSO-301',   name: 'MIDI',                               credits: 3, semester: 4, prerequisites: ['TSO-002','TSO-102'],       corequisites: []           },
          { code: 'TSO-302',   name: 'DAW Avanzado',                       credits: 3, semester: 4, prerequisites: ['TSO-002'],                 corequisites: []           },
          // ── C5 ─────────────────────────────────────────────────────────────
          { code: 'ING-004',   name: 'Inglés Nivel 10-12',                 credits: 0, semester: 5, prerequisites: ['ING-003'],                 corequisites: []           },
          { code: 'TMMP-001',  name: 'Marketing',                          credits: 3, semester: 5, prerequisites: ['ESP-101'],                 corequisites: []           },
          { code: 'TSO-108',   name: 'Apreciación Musical',                credits: 3, semester: 5, prerequisites: ['TSO-103'],                 corequisites: []           },
          { code: 'TSO-202',   name: 'Sonido para Radio y TV',             credits: 3, semester: 5, prerequisites: ['TSO-201','TSO-300'],       corequisites: []           },
          { code: 'TSO-303',   name: 'Mesa de Mezcla II',                  credits: 3, semester: 5, prerequisites: ['TSO-005'],                 corequisites: []           },
          { code: 'TSO-304',   name: 'Psicoacústica',                      credits: 3, semester: 5, prerequisites: ['TSO-106'],                 corequisites: []           },
          { code: 'TSO-305',   name: 'Síntesis de Sonido',                 credits: 3, semester: 5, prerequisites: ['TSO-301','TSO-302'],       corequisites: []           },
          // ── C6 ─────────────────────────────────────────────────────────────
          { code: 'TSO-203',   name: 'Sonido para Cine',                   credits: 3, semester: 6, prerequisites: ['TSO-202'],                 corequisites: []           },
          { code: 'TSO-306',   name: 'Acústica Arquitectónica',            credits: 3, semester: 6, prerequisites: ['TSO-304'],                 corequisites: []           },
          { code: 'TSO-307',   name: 'Masterización de Sonido',            credits: 3, semester: 6, prerequisites: ['TSO-303'],                 corequisites: []           },
          { code: 'TSO-308',   name: 'Sonido en Vivo',                     credits: 3, semester: 6, prerequisites: ['TSO-303'],                 corequisites: []           },
          // ── C7 ─────────────────────────────────────────────────────────────
          { code: 'ADM-110',   name: 'Desarrollo de Emprendedores',        credits: 3, semester: 7, prerequisites: ['TMMP-001'],               corequisites: []           },
          { code: 'CBG-130',   name: 'Ética Profesional',                  credits: 2, semester: 7, prerequisites: ['TSO-303'],                 corequisites: []           },
          { code: 'TSO-309',   name: 'Locución Comercial',                 credits: 3, semester: 7, prerequisites: ['TSO-202'],                 corequisites: []           },
          { code: 'TSO-310',   name: 'Industria de la Música',             credits: 3, semester: 7, prerequisites: ['TMMP-001'],               corequisites: []           },
          { code: 'TSO-311',   name: 'Proyecto Final TSO',                 credits: 4, semester: 7, prerequisites: ['TSO-302','TSO-307'],       corequisites: []           },
        ],
      },
    },
  })
  console.log(`✓ ${sonido.name} — ${sonido.totalCredits} créditos, ${sonido.durationSemesters} cuatrimestres`)

  // ─── UNPHU: Licenciatura en Farmacia ──────────────────────────────────────
  // Los laboratorios (sufijo -L) se incluyen como asignaturas de 0 créditos,
  // co-requisitos de su materia teórica, para mantener las cadenas de prereqs.
  // El campo minCredits (103/115/244/250) no tiene soporte en el schema actual
  // y se omite en este seed.

  const farmacia = await prisma.career.create({
    data: {
      id: 'unphu-farmacia',
      name: 'Licenciatura en Farmacia',
      universityId: unphu.id,
      totalCredits: 215,
      durationSemesters: 13,
      subjects: {
        create: [
          // ── Período 1 — 21 créditos ─────────────────────────────────────────
          { code: 'BIO-101',   name: 'Biología General',                                      credits: 3, semester: 1,  prerequisites: [],                                                                                  corequisites: ['BIO-101-L'] },
          { code: 'BIO-101-L', name: 'Lab. Biología General',                                 credits: 0, semester: 1,  prerequisites: [],                                                                                  corequisites: ['BIO-101']   },
          { code: 'ELT-001',   name: 'Electiva I (Artes y Deportes)',                         credits: 1, semester: 1,  prerequisites: [],                                                                                  corequisites: []            },
          { code: 'HUM-150',   name: 'Historia de la Cultura Universal',                      credits: 3, semester: 1,  prerequisites: [],                                                                                  corequisites: []            },
          { code: 'HUM-160',   name: 'Historia Dominicana',                                   credits: 3, semester: 1,  prerequisites: [],                                                                                  corequisites: []            },
          { code: 'LET-101',   name: 'Lengua Española y Técnica de la Expresión I',           credits: 3, semester: 1,  prerequisites: [],                                                                                  corequisites: []            },
          { code: 'MAT-060',   name: 'Matemática Básica',                                     credits: 4, semester: 1,  prerequisites: [],                                                                                  corequisites: []            },
          { code: 'ORI-100',   name: 'Orientación Universitaria',                             credits: 1, semester: 1,  prerequisites: [],                                                                                  corequisites: []            },
          { code: 'QUI-111',   name: 'Química General I',                                     credits: 3, semester: 1,  prerequisites: [],                                                                                  corequisites: ['QUI-111-L'] },
          { code: 'QUI-111-L', name: 'Lab. Química General I',                                credits: 0, semester: 1,  prerequisites: [],                                                                                  corequisites: ['QUI-111']   },
          // ── Período 2 — 21 créditos ─────────────────────────────────────────
          { code: 'MAT-333',   name: 'Bioestadística y Demografía',                          credits: 3, semester: 2,  prerequisites: ['MAT-060'],                                                                         corequisites: []            },
          { code: 'BIO-102',   name: 'Biología General II',                                   credits: 3, semester: 2,  prerequisites: ['BIO-101','BIO-101-L'],                                                            corequisites: ['BIO-102-L'] },
          { code: 'BIO-102-L', name: 'Lab. Biología General II',                              credits: 0, semester: 2,  prerequisites: ['BIO-101','BIO-101-L'],                                                            corequisites: ['BIO-102']   },
          { code: 'FIS-011',   name: 'Física Básica I',                                      credits: 3, semester: 2,  prerequisites: [],                                                                                  corequisites: ['FIS-011-L'] },
          { code: 'FIS-011-L', name: 'Lab. Física Básica I',                                  credits: 0, semester: 2,  prerequisites: [],                                                                                  corequisites: ['FIS-011']   },
          { code: 'INF-200',   name: 'Informática Básica y Cultural',                        credits: 3, semester: 2,  prerequisites: [],                                                                                  corequisites: []            },
          { code: 'LEX-113',   name: 'Inglés Introductorio de Cs. de la Salud',              credits: 3, semester: 2,  prerequisites: [],                                                                                  corequisites: []            },
          { code: 'LET-102',   name: 'Lengua Española y Técnica de la Expresión II',         credits: 3, semester: 2,  prerequisites: ['LET-101'],                                                                         corequisites: []            },
          { code: 'QUI-112',   name: 'Química General II',                                   credits: 3, semester: 2,  prerequisites: ['QUI-111','QUI-111-L'],                                                            corequisites: ['QUI-112-L'] },
          { code: 'QUI-112-L', name: 'Lab. Química General II',                               credits: 0, semester: 2,  prerequisites: ['QUI-111','QUI-111-L'],                                                            corequisites: ['QUI-112']   },
          // ── Período 3 — 18 créditos ─────────────────────────────────────────
          { code: 'FIS-012',   name: 'Física Básica II',                                     credits: 3, semester: 3,  prerequisites: ['FIS-011','FIS-011-L'],                                                            corequisites: ['FIS-012-L'] },
          { code: 'FIS-012-L', name: 'Lab. Física Básica II',                                 credits: 0, semester: 3,  prerequisites: ['FIS-011','FIS-011-L'],                                                            corequisites: ['FIS-012']   },
          { code: 'BIO-250',   name: 'Genética General',                                     credits: 3, semester: 3,  prerequisites: ['BIO-101','BIO-101-L'],                                                            corequisites: ['BIO-250-L'] },
          { code: 'BIO-250-L', name: 'Lab. Genética General',                                 credits: 0, semester: 3,  prerequisites: ['BIO-101','BIO-101-L'],                                                            corequisites: ['BIO-250']   },
          { code: 'LEX-128',   name: 'Inglés Técnico de Ciencias de la Salud',               credits: 3, semester: 3,  prerequisites: ['LEX-113'],                                                                         corequisites: []            },
          { code: 'PSI-100',   name: 'Psicología General',                                   credits: 3, semester: 3,  prerequisites: [],                                                                                  corequisites: []            },
          { code: 'QUI-220',   name: 'Química Inorgánica',                                   credits: 3, semester: 3,  prerequisites: ['QUI-112','QUI-112-L'],                                                            corequisites: ['QUI-220-L'] },
          { code: 'QUI-220-L', name: 'Lab. Química Inorgánica',                               credits: 0, semester: 3,  prerequisites: ['QUI-112','QUI-112-L'],                                                            corequisites: ['QUI-220']   },
          { code: 'LET-211',   name: 'Raíces Griegas y Latinas',                             credits: 3, semester: 3,  prerequisites: ['LET-102'],                                                                         corequisites: []            },
          // ── Período 4 — 17 créditos ─────────────────────────────────────────
          { code: 'MED-074',   name: 'Anatomía General Humana',                              credits: 3, semester: 4,  prerequisites: ['BIO-102','BIO-102-L'],                                                            corequisites: ['MED-074-L'] },
          { code: 'MED-074-L', name: 'Lab. Anatomía General Humana',                          credits: 0, semester: 4,  prerequisites: ['BIO-102','BIO-102-L'],                                                            corequisites: ['MED-074']   },
          { code: 'BIO-265',   name: 'Biofísica',                                            credits: 3, semester: 4,  prerequisites: ['FIS-012','FIS-012-L'],                                                            corequisites: ['BIO-265-L'] },
          { code: 'BIO-265-L', name: 'Lab. Biofísica',                                        credits: 0, semester: 4,  prerequisites: ['FIS-012','FIS-012-L'],                                                            corequisites: ['BIO-265']   },
          { code: 'FAR-241',   name: 'Fisicoquímica Farmacéutica',                           credits: 3, semester: 4,  prerequisites: ['FIS-012','FIS-012-L','QUI-112','QUI-112-L'],                                      corequisites: ['FAR-241-L'] },
          { code: 'FAR-241-L', name: 'Lab. Fisicoquímica Farmacéutica',                       credits: 0, semester: 4,  prerequisites: ['FIS-012','FIS-012-L','QUI-112','QUI-112-L'],                                      corequisites: ['FAR-241']   },
          { code: 'MED-103',   name: 'Informática para Ciencias de la Salud',                credits: 2, semester: 4,  prerequisites: ['INF-200'],                                                                         corequisites: ['MED-103-L'] },
          { code: 'MED-103-L', name: 'Lab. Informática para Ciencias de la Salud',            credits: 0, semester: 4,  prerequisites: ['INF-200'],                                                                         corequisites: ['MED-103']   },
          { code: 'PSI-105',   name: 'Psicología Aplicada',                                  credits: 3, semester: 4,  prerequisites: ['PSI-100'],                                                                         corequisites: []            },
          { code: 'QUI-241',   name: 'Química Orgánica I',                                   credits: 3, semester: 4,  prerequisites: ['QUI-112','QUI-112-L'],                                                            corequisites: ['QUI-241-L'] },
          { code: 'QUI-241-L', name: 'Lab. Química Orgánica I',                               credits: 0, semester: 4,  prerequisites: ['QUI-112','QUI-112-L'],                                                            corequisites: ['QUI-241']   },
          // ── Período 5 — 20 créditos ─────────────────────────────────────────
          { code: 'MED-075',   name: 'Fisiología General Humana',                            credits: 3, semester: 5,  prerequisites: ['MED-074','MED-074-L'],                                                            corequisites: ['MED-075-L'] },
          { code: 'MED-075-L', name: 'Lab. Fisiología General Humana',                        credits: 0, semester: 5,  prerequisites: ['MED-074','MED-074-L'],                                                            corequisites: ['MED-075']   },
          { code: 'FAR-250',   name: 'Historia de la Farmacia e Intro. a las Cs. Farmacéuticas', credits: 3, semester: 5, prerequisites: [],                                                                               corequisites: []            },
          { code: 'MED-021',   name: 'Introducción a la Investigación Científica',           credits: 3, semester: 5,  prerequisites: [],                                                                                  corequisites: []            },
          { code: 'MED-070',   name: 'Medicina Social y Preventiva',                         credits: 4, semester: 5,  prerequisites: ['MAT-333'],                                                                         corequisites: ['MED-070-L'] },
          { code: 'MED-070-L', name: 'Lab. Medicina Social y Preventiva',                     credits: 0, semester: 5,  prerequisites: ['MAT-333'],                                                                         corequisites: ['MED-070']   },
          { code: 'BIO-225',   name: 'Parasitología',                                        credits: 3, semester: 5,  prerequisites: ['BIO-102','BIO-102-L'],                                                            corequisites: ['BIO-225-L'] },
          { code: 'BIO-225-L', name: 'Lab. Parasitología',                                    credits: 0, semester: 5,  prerequisites: ['BIO-102','BIO-102-L'],                                                            corequisites: ['BIO-225']   },
          { code: 'QUI-242',   name: 'Química Orgánica II',                                  credits: 4, semester: 5,  prerequisites: ['QUI-241','QUI-241-L'],                                                            corequisites: ['QUI-242-L'] },
          { code: 'QUI-242-L', name: 'Lab. Química Orgánica II',                              credits: 0, semester: 5,  prerequisites: ['QUI-241','QUI-241-L'],                                                            corequisites: ['QUI-242']   },
          // ── Período 6 — 20 créditos (requiere 103 cr. aprobados) ────────────
          { code: 'MED-145',   name: 'Bioética Médica',                                      credits: 4, semester: 6,  prerequisites: [],                                                                                  corequisites: []            },
          { code: 'QUI-367',   name: 'Bioquímica Molecular',                                 credits: 3, semester: 6,  prerequisites: ['QUI-242','QUI-242-L'],                                                            corequisites: ['QUI-367-L'] },
          { code: 'QUI-367-L', name: 'Lab. Bioquímica Molecular',                             credits: 0, semester: 6,  prerequisites: ['QUI-242','QUI-242-L'],                                                            corequisites: ['QUI-367']   },
          { code: 'FAR-260',   name: 'Dermofarmacia y Cosmetología',                         credits: 3, semester: 6,  prerequisites: ['BIO-102','BIO-102-L','FAR-241','FAR-241-L','MAT-060','QUI-112','QUI-112-L'],      corequisites: ['FAR-260-L'] },
          { code: 'FAR-260-L', name: 'Lab. Dermofarmacia y Cosmetología',                     credits: 0, semester: 6,  prerequisites: ['BIO-102','BIO-102-L','FAR-241','FAR-241-L','MAT-060','QUI-112','QUI-112-L'],      corequisites: ['FAR-260']   },
          { code: 'FAR-240',   name: 'Farmacobotánica',                                      credits: 2, semester: 6,  prerequisites: ['BIO-102','BIO-102-L'],                                                            corequisites: ['FAR-240-L'] },
          { code: 'FAR-240-L', name: 'Lab. Farmacobotánica',                                  credits: 0, semester: 6,  prerequisites: ['BIO-102','BIO-102-L'],                                                            corequisites: ['FAR-240']   },
          { code: 'CON-116',   name: 'Fundamentos de Contabilidad',                          credits: 4, semester: 6,  prerequisites: [],                                                                                  corequisites: []            },
          { code: 'BIO-333',   name: 'Microbiología Médica',                                 credits: 4, semester: 6,  prerequisites: ['BIO-102','BIO-102-L'],                                                            corequisites: ['BIO-333-L'] },
          { code: 'BIO-333-L', name: 'Lab. Microbiología Médica',                             credits: 0, semester: 6,  prerequisites: ['BIO-102','BIO-102-L'],                                                            corequisites: ['BIO-333']   },
          // ── Período 7 — 18 créditos ─────────────────────────────────────────
          { code: 'QUI-250',   name: 'Análisis Químico Cuantitativo',                        credits: 3, semester: 7,  prerequisites: ['MAT-060','QUI-112','QUI-112-L'],                                                  corequisites: ['QUI-250-L'] },
          { code: 'QUI-250-L', name: 'Lab. Análisis Químico Cuantitativo',                    credits: 0, semester: 7,  prerequisites: ['MAT-060','QUI-112','QUI-112-L'],                                                  corequisites: ['QUI-250']   },
          { code: 'FAR-231',   name: 'Farmacognosia',                                        credits: 3, semester: 7,  prerequisites: ['FAR-240','FAR-240-L'],                                                            corequisites: ['FAR-231-L'] },
          { code: 'FAR-231-L', name: 'Lab. Farmacognosia',                                    credits: 0, semester: 7,  prerequisites: ['FAR-240','FAR-240-L'],                                                            corequisites: ['FAR-231']   },
          { code: 'MED-040',   name: 'Patología General',                                    credits: 3, semester: 7,  prerequisites: ['BIO-225','BIO-225-L'],                                                            corequisites: []            },
          { code: 'ADM-105',   name: 'Principios de Administración',                         credits: 3, semester: 7,  prerequisites: [],                                                                                  corequisites: []            },
          { code: 'FAR-370',   name: 'Química Farmacéutica',                                 credits: 3, semester: 7,  prerequisites: ['QUI-367','QUI-367-L'],                                                            corequisites: []            },
          { code: 'FAR-321',   name: 'Tecnología Farmacéutica I',                            credits: 3, semester: 7,  prerequisites: ['FAR-241','FAR-241-L','MAT-060','QUI-112','QUI-112-L'],                            corequisites: ['FAR-321-L'] },
          { code: 'FAR-321-L', name: 'Lab. Tecnología Farmacéutica I',                        credits: 0, semester: 7,  prerequisites: ['FAR-241','FAR-241-L','MAT-060','QUI-112','QUI-112-L'],                            corequisites: ['FAR-321']   },
          // ── Período 8 — 15 créditos ─────────────────────────────────────────
          { code: 'QUI-350',   name: 'Análisis Químico Instrumental',                        credits: 3, semester: 8,  prerequisites: ['QUI-241','QUI-241-L','QUI-250','QUI-250-L'],                                      corequisites: ['QUI-350-L'] },
          { code: 'QUI-350-L', name: 'Lab. Análisis Químico Instrumental',                    credits: 0, semester: 8,  prerequisites: ['QUI-241','QUI-241-L','QUI-250','QUI-250-L'],                                      corequisites: ['QUI-350']   },
          { code: 'FAR-333',   name: 'Deontología y Legislación Farmacéutica',               credits: 3, semester: 8,  prerequisites: ['FAR-250','MED-145'],                                                              corequisites: []            },
          { code: 'FAR-261',   name: 'Farmacología I',                                       credits: 3, semester: 8,  prerequisites: ['BIO-333','BIO-333-L','FAR-231','FAR-231-L','FAR-370','MED-040','MED-075','MED-075-L','QUI-367','QUI-367-L'], corequisites: ['FAR-261-L'] },
          { code: 'FAR-261-L', name: 'Lab. Farmacología I',                                   credits: 0, semester: 8,  prerequisites: ['BIO-333','BIO-333-L','FAR-231','FAR-231-L','FAR-370','MED-040','MED-075','MED-075-L','QUI-367','QUI-367-L'], corequisites: ['FAR-261']   },
          { code: 'FAR-380',   name: 'Microbiología Industrial Farmacéutica',                credits: 3, semester: 8,  prerequisites: ['BIO-333','BIO-333-L'],                                                            corequisites: ['FAR-380-L'] },
          { code: 'FAR-380-L', name: 'Lab. Microbiología Industrial Farmacéutica',            credits: 0, semester: 8,  prerequisites: ['BIO-333','BIO-333-L'],                                                            corequisites: ['FAR-380']   },
          { code: 'FAR-322',   name: 'Tecnología Farmacéutica II',                           credits: 3, semester: 8,  prerequisites: ['FAR-321','FAR-321-L'],                                                            corequisites: ['FAR-322-L'] },
          { code: 'FAR-322-L', name: 'Lab. Tecnología Farmacéutica II',                       credits: 0, semester: 8,  prerequisites: ['FAR-321','FAR-321-L'],                                                            corequisites: ['FAR-322']   },
          // ── Período 9 — 16 créditos (requiere 115 cr. aprobados) ────────────
          { code: 'ELT-002',   name: 'Electiva II',                                          credits: 3, semester: 9,  prerequisites: ['BIO-102','BIO-102-L','MED-075','MED-075-L'],                                      corequisites: []            },
          { code: 'FAR-390',   name: 'Evaluación y Análisis de Productos Farmacéuticos',     credits: 4, semester: 9,  prerequisites: ['FAR-241','FAR-241-L','FAR-261','FAR-261-L','FAR-322','FAR-322-L','QUI-350','QUI-350-L'], corequisites: ['FAR-390-L'] },
          { code: 'FAR-390-L', name: 'Lab. Evaluación y Análisis de Productos Farmacéuticos',credits: 0, semester: 9,  prerequisites: ['FAR-241','FAR-241-L','FAR-261','FAR-261-L','FAR-322','FAR-322-L','QUI-350','QUI-350-L'], corequisites: ['FAR-390']   },
          { code: 'FAR-424',   name: 'Farmacia Industrial',                                  credits: 2, semester: 9,  prerequisites: ['FAR-322','FAR-322-L','FAR-333','QUI-241','QUI-241-L','QUI-350','QUI-350-L'],       corequisites: ['FAR-424-L'] },
          { code: 'FAR-424-L', name: 'Lab. Farmacia Industrial',                              credits: 0, semester: 9,  prerequisites: ['FAR-322','FAR-322-L','FAR-333','QUI-241','QUI-241-L','QUI-350','QUI-350-L'],       corequisites: ['FAR-424']   },
          { code: 'FAR-262',   name: 'Farmacología II',                                      credits: 3, semester: 9,  prerequisites: ['FAR-261','FAR-261-L'],                                                            corequisites: ['FAR-262-L'] },
          { code: 'FAR-262-L', name: 'Lab. Farmacología II',                                  credits: 0, semester: 9,  prerequisites: ['FAR-261','FAR-261-L'],                                                            corequisites: ['FAR-262']   },
          { code: 'FAR-391',   name: 'Marketing Farmacéutico',                               credits: 4, semester: 9,  prerequisites: ['ADM-105'],                                                                         corequisites: []            },
          // ── Período 10 — 18 créditos ────────────────────────────────────────
          { code: 'FAR-501',   name: 'Aseguramiento de la Calidad Farmacéutica',             credits: 4, semester: 10, prerequisites: ['FAR-424','FAR-424-L','QUI-350','QUI-350-L'],                                      corequisites: []            },
          { code: 'FAR-411',   name: 'Biofarmacia y Farmacocinética',                        credits: 3, semester: 10, prerequisites: ['FAR-262','FAR-262-L','FAR-322','FAR-322-L'],                                      corequisites: []            },
          { code: 'FAR-440',   name: 'Bromatología',                                         credits: 2, semester: 10, prerequisites: ['QUI-241','QUI-241-L','QUI-250','QUI-250-L'],                                      corequisites: ['FAR-440-L'] },
          { code: 'FAR-440-L', name: 'Lab. Bromatología',                                     credits: 0, semester: 10, prerequisites: ['QUI-241','QUI-241-L','QUI-250','QUI-250-L'],                                      corequisites: ['FAR-440']   },
          { code: 'ELT-003',   name: 'Electiva III',                                         credits: 3, semester: 10, prerequisites: ['FAR-261','FAR-261-L','FAR-262','FAR-262-L','FAR-322','FAR-322-L','MAT-333'],       corequisites: []            },
          { code: 'FAR-410',   name: 'Farmacia Clínica y Farmacoterapéutica',                credits: 3, semester: 10, prerequisites: ['FAR-262','FAR-262-L','FAR-322','FAR-322-L','FAR-390','FAR-390-L'],                 corequisites: []            },
          { code: 'FAR-450',   name: 'Toxicología',                                          credits: 3, semester: 10, prerequisites: ['QUI-241','QUI-241-L','QUI-250','QUI-250-L'],                                      corequisites: ['FAR-450-L'] },
          { code: 'FAR-450-L', name: 'Lab. Toxicología',                                      credits: 0, semester: 10, prerequisites: ['QUI-241','QUI-241-L','QUI-250','QUI-250-L'],                                      corequisites: ['FAR-450']   },
          // ── Período 11 — 19 créditos ────────────────────────────────────────
          { code: 'ELT-004',   name: 'Electiva IV',                                          credits: 3, semester: 11, prerequisites: ['FAR-261','FAR-261-L','FAR-322','FAR-322-L','FAR-450','FAR-450-L','MAT-333'],       corequisites: ['ELT-104-L'] },
          { code: 'ELT-104-L', name: 'Lab. Electiva IV',                                      credits: 0, semester: 11, prerequisites: ['FAR-261','FAR-261-L','FAR-322','FAR-322-L','FAR-450','FAR-450-L','MAT-333'],       corequisites: ['ELT-004']   },
          { code: 'FAR-471',   name: 'Farmacia Comunitaria',                                 credits: 2, semester: 11, prerequisites: ['FAR-262','FAR-262-L','FAR-322','FAR-322-L','FAR-333','FAR-410'],                   corequisites: ['FAR-471-L'] },
          { code: 'FAR-471-L', name: 'Lab. Farmacia Comunitaria',                             credits: 0, semester: 11, prerequisites: ['FAR-262','FAR-262-L','FAR-322','FAR-322-L','FAR-333','FAR-410'],                   corequisites: ['FAR-471']   },
          { code: 'FAR-472',   name: 'Farmacia Hospitalaria',                                credits: 2, semester: 11, prerequisites: ['FAR-262','FAR-262-L','FAR-333','FAR-410'],                                        corequisites: ['FAR-472-L'] },
          { code: 'FAR-472-L', name: 'Lab. Farmacia Hospitalaria',                            credits: 0, semester: 11, prerequisites: ['FAR-262','FAR-262-L','FAR-333','FAR-410'],                                        corequisites: ['FAR-472']   },
          { code: 'FAR-412',   name: 'Farmacoeconomía y Gestión en Salud',                   credits: 4, semester: 11, prerequisites: ['FAR-262','FAR-262-L','FAR-410'],                                                  corequisites: []            },
          { code: 'FAR-413',   name: 'Gestión Regulatoria de Productos y Servicios Farmacéuticos', credits: 4, semester: 11, prerequisites: ['FAR-333','FAR-424','FAR-424-L'],                                            corequisites: []            },
          { code: 'FAR-414',   name: 'Seminario de Trabajo de Grado',                        credits: 4, semester: 11, prerequisites: ['FAR-262','FAR-262-L','FAR-424','FAR-424-L','FAR-501','MED-021'],                  corequisites: []            },
          // ── Período 12 — 6 créditos (requiere 244 cr. aprobados) ────────────
          { code: 'FAR-490',   name: 'Pasantía Farmacia Industrial',                         credits: 6, semester: 12, prerequisites: [],                                                                                  corequisites: []            },
          // ── Período 13 — 6 créditos (requiere 250 cr. aprobados) ────────────
          { code: 'FAR-903',   name: 'Trabajo de Grado',                                     credits: 6, semester: 13, prerequisites: [],                                                                                  corequisites: []            },
        ],
      },
    },
  })
  console.log(`✓ ${farmacia.name} — ${farmacia.totalCredits} créditos, ${farmacia.durationSemesters} períodos`)
  console.log('\n✅ Seed completo.')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
