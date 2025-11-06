import { afterAll } from 'vitest';
import prisma from '../lib/prisma';

// Close Prisma connection after all tests
afterAll(async () => {
  await prisma.$disconnect();
});

