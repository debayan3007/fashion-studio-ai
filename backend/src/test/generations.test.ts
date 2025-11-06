import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { buildApp } from '../app';
import { createTestUser, getAuthToken, createTestGeneration, createMultipartFormData } from './helpers';
import prisma from '../lib/prisma';
import type { FastifyInstance } from 'fastify';

describe('Generations Routes', () => {
  let app: FastifyInstance;
  let userToken: string;
  let userId: string;
  let createdUserIds: string[] = [];

  beforeEach(async () => {
    // Build app first
    app = await buildApp();
    await app.ready();

    // Create test user and get token
    // Use a unique email to avoid conflicts
    const uniqueEmail = `generations-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`;
    
    // Retry user creation if we get database locking errors
    let user;
    let retries = 3;
    while (retries > 0) {
      try {
        user = await createTestUser(uniqueEmail, 'password123');
        break;
      } catch (error: any) {
        if (error?.message?.includes('disk I/O error') && retries > 1) {
          retries--;
          await new Promise(resolve => setTimeout(resolve, 200));
          continue;
        }
        throw error;
      }
    }
    
    if (!user) {
      throw new Error('Failed to create user');
    }
    
    userId = user.id;
    createdUserIds.push(userId);
    
    userToken = await getAuthToken(app, uniqueEmail, 'password123');
    
    // Verify token is valid
    if (!userToken) {
      throw new Error('Failed to get auth token');
    }
  });

  afterEach(async () => {
    // Clean up only the users and generations created in this suite
    // Add retry logic for database locking issues
    try {
      if (createdUserIds.length > 0) {
        // Retry cleanup operations
        let retries = 3;
        while (retries > 0) {
          try {
            await prisma.generation.deleteMany({
              where: { userId: { in: createdUserIds } }
            });
            await prisma.user.deleteMany({
              where: { id: { in: createdUserIds } }
            });
            createdUserIds = [];
            break;
          } catch (error: any) {
            if (error?.message?.includes('disk I/O error') && retries > 1) {
              retries--;
              await new Promise(resolve => setTimeout(resolve, 100));
              continue;
            }
            // If it's not a locking error or we're out of retries, ignore it
            break;
          }
        }
      }
    } catch (error) {
      // Ignore cleanup errors - they're not critical for test correctness
    }
  });

  describe('POST /generations', () => {
    it('should create a generation with valid data', async () => {
      // Mock Math.random to avoid 429 errors in tests
      const originalRandom = Math.random;
      vi.spyOn(Math, 'random').mockReturnValue(0.5); // Always return 0.5 (> 0.2, so no 429)

      const { payload, contentType } = createMultipartFormData({
        prompt: 'A beautiful summer dress',
        style: 'casual',
      });

      const response = await app.inject({
        method: 'POST',
        url: '/generations',
        headers: {
          authorization: `Bearer ${userToken}`,
          'content-type': contentType,
        },
        payload,
      });

      // Restore Math.random
      Math.random = originalRandom;

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('id');
      expect(body).toHaveProperty('prompt', 'A beautiful summer dress');
      expect(body).toHaveProperty('style', 'casual');
      expect(body).toHaveProperty('imageUrl');
      expect(body).toHaveProperty('status');
    }, 10000); // Increase timeout for this test

    it('should return 406 if multipart form-data is missing', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/generations',
        headers: {
          authorization: `Bearer ${userToken}`,
          'content-type': 'application/json',
        },
        payload: {
          prompt: 'test',
          style: 'test',
        },
      });

      // Fastify multipart returns 406 when content-type is not multipart
      expect(response.statusCode).toBe(406);
    });

    it('should return 400 if prompt is missing', async () => {
      const { payload, contentType } = createMultipartFormData({
        style: 'casual',
      });

      const response = await app.inject({
        method: 'POST',
        url: '/generations',
        headers: {
          authorization: `Bearer ${userToken}`,
          'content-type': contentType,
        },
        payload,
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('message', 'Invalid payload');
    });

    it('should return 400 if style is missing', async () => {
      const { payload, contentType } = createMultipartFormData({
        prompt: 'A beautiful dress',
      });

      const response = await app.inject({
        method: 'POST',
        url: '/generations',
        headers: {
          authorization: `Bearer ${userToken}`,
          'content-type': contentType,
        },
        payload,
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('message', 'Invalid payload');
    });

    it('should return 400 if prompt is too short', async () => {
      const { payload, contentType } = createMultipartFormData({
        prompt: 'ab',
        style: 'casual',
      });

      const response = await app.inject({
        method: 'POST',
        url: '/generations',
        headers: {
          authorization: `Bearer ${userToken}`,
          'content-type': contentType,
        },
        payload,
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('message', 'Invalid payload');
    });

    it('should return 401 if no token is provided', async () => {
      const { payload, contentType } = createMultipartFormData({
        prompt: 'A beautiful dress',
        style: 'casual',
      });

      const response = await app.inject({
        method: 'POST',
        url: '/generations',
        headers: {
          'content-type': contentType,
        },
        payload,
      });

      expect(response.statusCode).toBe(401);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Unauthorized');
    });

    it('should return 401 if invalid token is provided', async () => {
      const { payload, contentType } = createMultipartFormData({
        prompt: 'A beautiful dress',
        style: 'casual',
      });

      const response = await app.inject({
        method: 'POST',
        url: '/generations',
        headers: {
          authorization: 'Bearer invalid-token',
          'content-type': contentType,
        },
        payload,
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('GET /generations', () => {
    beforeEach(async () => {
      // Create some test generations
      await createTestGeneration(userId, 'Prompt 1', 'Style 1');
      await createTestGeneration(userId, 'Prompt 2', 'Style 2');
      await createTestGeneration(userId, 'Prompt 3', 'Style 3');
    });

    it('should return generations for authenticated user', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/generations',
        headers: {
          authorization: `Bearer ${userToken}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(Array.isArray(body)).toBe(true);
      expect(body.length).toBeGreaterThan(0);
      expect(body[0]).toHaveProperty('id');
      expect(body[0]).toHaveProperty('prompt');
      expect(body[0]).toHaveProperty('style');
      expect(body[0]).toHaveProperty('imageUrl');
    });

    it('should return only the last 5 generations', async () => {
      // Create more than 5 generations
      for (let i = 4; i <= 10; i++) {
        await createTestGeneration(userId, `Prompt ${i}`, `Style ${i}`);
      }

      const response = await app.inject({
        method: 'GET',
        url: '/generations',
        headers: {
          authorization: `Bearer ${userToken}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.length).toBeLessThanOrEqual(5);
    });

    it('should return generations ordered by createdAt desc', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/generations',
        headers: {
          authorization: `Bearer ${userToken}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      if (body.length > 1) {
        const firstDate = new Date(body[0].createdAt).getTime();
        const secondDate = new Date(body[1].createdAt).getTime();
        expect(firstDate).toBeGreaterThanOrEqual(secondDate);
      }
    });

    it('should only return generations for the authenticated user', async () => {
      // Create another user and their generation
      const otherUser = await createTestUser('other@example.com', 'password123');
      createdUserIds.push(otherUser.id); // Track for cleanup
      await createTestGeneration(otherUser.id, 'Other user prompt', 'Other style');

      const response = await app.inject({
        method: 'GET',
        url: '/generations',
        headers: {
          authorization: `Bearer ${userToken}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      // Should not include the other user's generation
      const otherUserGeneration = body.find((g: any) => g.prompt === 'Other user prompt');
      expect(otherUserGeneration).toBeUndefined();
    });

    it('should return 401 if no token is provided', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/generations',
      });

      expect(response.statusCode).toBe(401);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Unauthorized');
    });

    it('should return 401 if invalid token is provided', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/generations',
        headers: {
          authorization: 'Bearer invalid-token',
        },
      });

      expect(response.statusCode).toBe(401);
    });

    it('should return empty array if user has no generations', async () => {
      // Create a new user with no generations
      const uniqueEmail = `newuser-${Date.now()}@example.com`;
      const newUser = await createTestUser(uniqueEmail, 'password123');
      createdUserIds.push(newUser.id); // Track for cleanup
      const newUserToken = await getAuthToken(app, uniqueEmail, 'password123');

      const response = await app.inject({
        method: 'GET',
        url: '/generations',
        headers: {
          authorization: `Bearer ${newUserToken}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(Array.isArray(body)).toBe(true);
      expect(body.length).toBe(0);
    });
  });
});

