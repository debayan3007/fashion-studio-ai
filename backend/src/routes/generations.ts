import { FastifyInstance } from 'fastify';
import { authGuard } from '../lib/jwt';

export default async function generationsRoutes(app: FastifyInstance) {
  // All routes in this file require authentication
  app.addHook('preHandler', authGuard);

  // Placeholder for generation routes
  app.get('/', async (_request, reply) => {
    // Access authenticated user via _request.user.id
    return reply.code(200).send({ message: 'Generations route - protected' });
  });
}

