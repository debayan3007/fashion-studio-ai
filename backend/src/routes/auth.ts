import { FastifyInstance } from 'fastify';
import { Prisma } from '@prisma/client';
import { createUser, verifyUser } from '../lib/auth';
import { signJwt } from '../lib/jwt';
import { signupSchema, loginSchema } from '../lib/validators';

export default async function authRoutes(app: FastifyInstance) {
  // POST /auth/signup
  app.post('/signup', async (request, reply) => {
    try {
      // Validate request body
      const body = signupSchema.parse(request.body);

      // Create user
      const user = await createUser(body.email, body.password);

      // Sign JWT
      const token = await signJwt(reply, user.id);

      return reply.code(201).send({ token });
    } catch (error) {
      // Handle Prisma unique constraint violation (P2002)
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return reply.code(409).send({ error: 'User already exists' });
      }

      // Handle Zod validation errors
      if (error instanceof Error && error.name === 'ZodError') {
        return reply.code(400).send({ error: error.message });
      }

      // Handle createUser thrown errors
      if (error instanceof Error) {
        if (error.message === 'User already exists') {
          return reply.code(409).send({ error: error.message });
        }
      }

      request.log.error(error);
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

  // POST /auth/login
  app.post('/login', async (request, reply) => {
    try {
      // Validate request body
      const body = loginSchema.parse(request.body);

      // Verify user
      const user = await verifyUser(body.email, body.password);

      // Sign JWT
      const token = await signJwt(reply, user.id);

      return reply.code(200).send({ token });
    } catch (error) {
      // Handle Zod validation errors
      if (error instanceof Error && error.name === 'ZodError') {
        return reply.code(400).send({ error: error.message });
      }

      // Handle verifyUser thrown errors
      if (error instanceof Error && error.message === 'Invalid email or password') {
        return reply.code(401).send({ error: error.message });
      }

      request.log.error(error);
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });
}

