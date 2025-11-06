import bcrypt from 'bcrypt';
import prisma from './prisma';

const SALT_ROUNDS = 10;

/**
 * Create a new user with hashed password
 * @throws Error if user already exists
 */
export async function createUser(email: string, password: string) {
  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new Error('User already exists');
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  // Create user
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
    },
  });

  return user;
}

/**
 * Verify user credentials
 * @returns User if credentials are valid
 * @throws Error if user not found or password is invalid
 */
export async function verifyUser(email: string, password: string) {
  // Find user
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new Error('Invalid email or password');
  }

  // Verify password
  const isValid = await bcrypt.compare(password, user.passwordHash);

  if (!isValid) {
    throw new Error('Invalid email or password');
  }

  return user;
}

