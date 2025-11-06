import fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import { join } from 'node:path';
import { registerJwt } from './lib/jwt';
import errorHandler from './plugins/errorHandler';
import authRoutes from './routes/auth';
import generationsRoutes from './routes/generations';

export async function buildApp() {
  const app = fastify({
    bodyLimit: 5 * 1024 * 1024, // 5MB
    logger: true,
  });

  // Register error handler plugin
  app.register(errorHandler);

  // Register CORS plugin
  app.register(cors, {
    origin: '*',
  });

  // Register multipart plugin
  app.register(multipart, {
    limits: { fileSize: 10 * 1024 * 1024, files: 1 },
  });

  // Static files
  app.register(fastifyStatic, {
    root: join(process.cwd(), 'public'),
    prefix: '/static/',
  });

  // Register JWT at root scope so decorators are available to all routes
  await registerJwt(app);

  // Health check route
  app.get('/healthz', async (_request, reply) => {
    return reply.code(200).send({ status: 'ok' });
  });

  // Register auth routes
  app.register(authRoutes, { prefix: '/auth' });

  // Register generation routes
  app.register(generationsRoutes, { prefix: '/generations' });

  return app;
}

export default buildApp;

