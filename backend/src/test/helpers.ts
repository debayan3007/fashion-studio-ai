import { FastifyInstance } from 'fastify';
import prisma from '../lib/prisma';
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

/**
 * Create a test user in the database with retry logic for SQLite locking issues
 */
export async function createTestUser(email: string, password: string, retries = 3): Promise<any> {
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  
  for (let i = 0; i < retries; i++) {
    try {
      return await prisma.user.create({
        data: {
          email,
          passwordHash,
        },
      });
    } catch (error: any) {
      // If it's a disk I/O error and we have retries left, wait and retry
      if (error?.message?.includes('disk I/O error') && i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, 100 * (i + 1)));
        continue;
      }
      throw error;
    }
  }
  throw new Error('Failed to create user after retries');
}

/**
 * Get an authentication token for a user
 */
export async function getAuthToken(app: FastifyInstance, email: string, password: string): Promise<string> {
  const response = await app.inject({
    method: 'POST',
    url: '/auth/login',
    payload: {
      email,
      password,
    },
  });

  const body = JSON.parse(response.body);
  return body.token;
}

/**
 * Create a test generation with retry logic for SQLite locking issues
 */
export async function createTestGeneration(userId: string, prompt: string, style: string, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await prisma.generation.create({
        data: {
          userId,
          prompt,
          style,
          imageUrl: '/static/test.png',
          status: 'succeeded',
        },
      });
    } catch (error: any) {
      // If it's a disk I/O error and we have retries left, wait and retry
      if (error?.message?.includes('disk I/O error') && i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, 100 * (i + 1)));
        continue;
      }
      throw error;
    }
  }
  throw new Error('Failed to create generation after retries');
}

/**
 * Create multipart form data Buffer for testing with Fastify
 * Fastify's multipart plugin expects at least one file field for request.file() to work
 */
export function createMultipartFormData(fields: Record<string, string>): { payload: Buffer; boundary: string; contentType: string } {
  const boundary = `----WebKitFormBoundary${Date.now()}`;
  const parts: Buffer[] = [];

  // Add form fields first
  for (const [key, value] of Object.entries(fields)) {
    parts.push(Buffer.from(`--${boundary}\r\n`, 'utf-8'));
    parts.push(Buffer.from(`Content-Disposition: form-data; name="${key}"\r\n`, 'utf-8'));
    parts.push(Buffer.from('\r\n', 'utf-8'));
    parts.push(Buffer.from(value, 'utf-8'));
    parts.push(Buffer.from('\r\n', 'utf-8'));
  }

  // Add a dummy file field (required for request.file() to work)
  // The file can be empty, but the field must exist
  parts.push(Buffer.from(`--${boundary}\r\n`, 'utf-8'));
  parts.push(Buffer.from(`Content-Disposition: form-data; name="file"; filename=""\r\n`, 'utf-8'));
  parts.push(Buffer.from('Content-Type: application/octet-stream\r\n', 'utf-8'));
  parts.push(Buffer.from('\r\n', 'utf-8'));
  parts.push(Buffer.from('', 'utf-8')); // Empty file content
  parts.push(Buffer.from('\r\n', 'utf-8'));

  parts.push(Buffer.from(`--${boundary}--\r\n`, 'utf-8'));

  const payload = Buffer.concat(parts);
  const contentType = `multipart/form-data; boundary=${boundary}`;

  return { payload, boundary, contentType };
}

