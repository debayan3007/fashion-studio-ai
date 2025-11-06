import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  // Add connection pool settings for SQLite to handle concurrent access better
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'file:./prisma/dev.db',
    },
  },
});

// Handle graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

export default prisma;

