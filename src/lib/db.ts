import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import type { Config } from '@libsql/client'
import path from 'path'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Get absolute path to database
const dbPath = path.join(process.cwd(), 'prisma', 'data', 'app.db')

// Config for libSQL adapter - use absolute path for file URL
const config: Config = {
  url: `file:${dbPath}`,
}

// Create Prisma adapter
const adapter = new PrismaLibSql(config)

// Create Prisma client with adapter
export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
