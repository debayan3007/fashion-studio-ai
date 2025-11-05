import { FastifyInstance } from 'fastify';
import { authGuard } from '../lib/jwt';
import { createGenerationBody } from '../schemas/generations';
import prisma from '../lib/prisma';

export default async function generationsRoutes(app: FastifyInstance) {
  // POST /generations
  app.post('/', { preHandler: [authGuard] }, async (request: any, reply) => {
    const file = await (request as any).file?.();
    if (!file) {
      return reply.code(400).send({ message: 'Multipart form-data required' });
    }

    const prompt = file.fields?.prompt?.value as string | undefined;
    const style = file.fields?.style?.value as string | undefined;

    const parsed = createGenerationBody.safeParse({ prompt, style });
    if (!parsed.success) {
      return reply.code(400).send({
        message: 'Invalid payload',
        errors: parsed.error.flatten(),
      });
    }

    if (Math.random() < 0.2) {
      return reply.code(429).send({ message: 'Model overloaded, please retry' });
    }

    await new Promise((r) => setTimeout(r, 1000 + Math.random() * 1000));

    // @ts-ignore - added by @fastify/jwt
    const userId = request.user.sub || request.user.id;

    const gen = await prisma.generation.create({
      data: {
        userId,
        prompt: parsed.data.prompt,
        style: parsed.data.style,
        imageUrl: '/static/mock.png',
        status: 'succeeded',
      },
    });

    return {
      id: gen.id,
      prompt: gen.prompt,
      style: gen.style,
      imageUrl: gen.imageUrl,
      status: gen.status,
      createdAt: gen.createdAt,
    };
  });

  // GET /generations
  app.get('/', { preHandler: [authGuard] }, async (request: any) => {
    // @ts-ignore
    const userId = request.user.sub || request.user.id;
    const gens = await prisma.generation.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });
    return gens;
  });
}

