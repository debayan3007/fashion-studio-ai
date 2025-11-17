import { PrismaClient } from '@prisma/client';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get the directory of the current module (ES modules)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Resolve database path relative to the backend directory
const getDatabaseUrl = () => {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }
  // Resolve path relative to backend directory (two levels up from lib)
  const backendDir = resolve(__dirname, '..', '..');
  const dbPath = resolve(backendDir, 'prisma', 'dev.db');
  // Use absolute path for Windows compatibility, normalize path separators for SQLite
  return `file:${dbPath.replace(/\\/g, '/')}`;
};

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  // Add connection pool settings for SQLite to handle concurrent access better
  datasources: {
    db: {
      url: getDatabaseUrl(),
    },
  },
});

// Handle graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

export default prisma;

