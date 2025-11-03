import fastify from 'fastify';
import cors from '@fastify/cors';
import { registerJwt } from './lib/jwt';
import authRoutes from './routes/auth';
import generationsRoutes from './routes/generations';

async function buildApp() {
  const app = fastify({
    bodyLimit: 5 * 1024 * 1024, // 5MB
    logger: true,
  });

  // Register CORS plugin
  await app.register(cors, {
    origin: '*',
  });

  // Register JWT
  await registerJwt(app);

  // Health check route
  app.get('/healthz', async (_request, reply) => {
    return reply.code(200).send({ status: 'ok' });
  });

  // Register auth routes
  await app.register(authRoutes, { prefix: '/auth' });

  // Register generation routes
  await app.register(generationsRoutes, { prefix: '/generations' });

  return app;
}

export default buildApp;

