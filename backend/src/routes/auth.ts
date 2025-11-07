import { FastifyInstance } from 'fastify';
import { Prisma } from '@prisma/client';
import { createUser, verifyUser } from '../lib/auth';
import { signJwt } from '../lib/jwt';
import { signupSchema, loginSchema } from '../lib/validators';

export default async function authRoutes(app: FastifyInstance) {
  // POST /auth/signup
  app.post('/signup', async (request, reply) => {
    const parsed = signupSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({
        error: 'Invalid signup payload',
        details: parsed.error.flatten(),
      });
    }

    try {
      // Create user
      const user = await createUser(parsed.data.email, parsed.data.password);

      // Sign JWT
      const token = await signJwt(reply, user.id);

      return reply.code(201).send({ token });
    } catch (error) {
      // Handle Prisma unique constraint violation (P2002)
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return reply.code(409).send({ error: 'User already exists' });
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
    const parsed = loginSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({
        error: 'Invalid login payload',
        details: parsed.error.flatten(),
      });
    }

    try {
      // Verify user
      const user = await verifyUser(parsed.data.email, parsed.data.password);

      // Sign JWT
      const token = await signJwt(reply, user.id);

      return reply.code(200).send({ token });
    } catch (error) {
      // Handle verifyUser thrown errors
      if (error instanceof Error && error.message === 'Invalid email or password') {
        return reply.code(401).send({ error: error.message });
      }

      request.log.error(error);
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });
}

