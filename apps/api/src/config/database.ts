import { PrismaNeon } from '@prisma/adapter-neon'
import { neonConfig, Pool } from '@neondatabase/serverless'
import { PrismaClient } from '../generated/prisma/index.js'

if (process.env.NODE_ENV !== 'production') {
  const { default: ws } = await import('ws')
  neonConfig.webSocketConstructor = ws
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaNeon(pool)

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
