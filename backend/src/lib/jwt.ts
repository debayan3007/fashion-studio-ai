import fastifyJwt from '@fastify/jwt';
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { config } from '../config';

export async function registerJwt(app: FastifyInstance) {
  await app.register(fastifyJwt, {
    secret: config.jwtSecret,
  });

  // Register authenticate method
  app.decorate('authenticate', async (request: FastifyRequest, reply: any) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.send(err);
    }
  });
}

export async function signJwt(reply: FastifyReply, userId: string): Promise<string> {
  const token = await reply.jwtSign({ sub: userId }, { expiresIn: '1d' });
  return token;
}

// Auth guard preHandler - verifies JWT and attaches user to request
export async function authGuard(request: FastifyRequest, reply: any) {
  try {
    const decoded = await request.jwtVerify();
    // Attach user object with id from JWT sub claim
    request.user = { id: (decoded as any).sub };
  } catch (err) {
    return reply.code(401).send({ error: 'Unauthorized' });
  }
}

