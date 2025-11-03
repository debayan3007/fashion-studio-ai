import fastify from 'fastify';
import cors from '@fastify/cors';

async function buildApp() {
  const app = fastify({
    bodyLimit: 5 * 1024 * 1024, // 5MB
    logger: true,
  });

  // Register CORS plugin
  await app.register(cors, {
    origin: '*',
  });

  // Health check route
  app.get('/healthz', async (_request, reply) => {
    return reply.code(200).send({ status: 'ok' });
  });

  // Placeholder for auth routes
  app.register(async () => {
    // Auth routes will be registered here
  }, { prefix: '/auth' });

  // Placeholder for generation routes
  app.register(async () => {
    // Generation routes will be registered here
  }, { prefix: '/generations' });

  return app;
}

export default buildApp;

