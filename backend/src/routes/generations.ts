import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import type { MultipartFile } from '@fastify/multipart';
import { randomUUID } from 'node:crypto';
import { mkdir } from 'node:fs/promises';
import { createWriteStream } from 'node:fs';
import { extname, join } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { authGuard } from '../lib/jwt';
import { createGenerationBody } from '../schemas/generations';
import prisma from '../lib/prisma';

function getFieldValue(file: MultipartFile | undefined, field: string): string | undefined {
  const fields = file?.fields as Record<string, { value?: unknown }> | undefined;
  const value = fields?.[field]?.value;
  return typeof value === 'string' ? value : undefined;
}

async function ensureFile(request: FastifyRequest, reply: FastifyReply): Promise<MultipartFile | undefined> {
  const file = request.file ? await request.file() : undefined;
  if (!file) {
    reply.code(400).send({ message: 'Multipart form-data required' });
    return undefined;
  }
  return file;
}

export default async function generationsRoutes(app: FastifyInstance) {
  // POST /generations
  app.post('/', { preHandler: [authGuard] }, async (request, reply) => {
    const file = await ensureFile(request, reply);
    if (!file) {
      return;
    }

    const prompt = getFieldValue(file, 'prompt');
    const style = getFieldValue(file, 'style');

    const parsed = createGenerationBody.safeParse({ prompt, style });
    if (!parsed.success) {
      return reply.code(400).send({
        message: 'Invalid payload',
        errors: parsed.error.flatten(),
      });
    }

    if (Math.random() < 0.2) {
      file.file?.resume();
      reply.code(429).send({ message: 'Model overloaded, please retry' });
      return;
    }

    await new Promise<void>((resolve) => setTimeout(resolve, 1000 + Math.random() * 1000));

    const userId = request.user?.id;

    if (!userId) {
      reply.code(401).send({ error: 'Invalid token: no user ID' });
      return;
    }

    // Verify user exists before creating generation
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      request.log.warn({ userId, requestUser: request.user }, 'User not found when creating generation');
      reply.code(404).send({ error: 'User not found', userId });
      return;
    }

    let storedImageUrl = '/static/mock.png';

    if (file.filename) {
      const uploadDir = join(process.cwd(), 'public', 'uploads');
      await mkdir(uploadDir, { recursive: true });

      const extension = extname(file.filename) || '.png';
      const targetFileName = `${randomUUID()}${extension}`;
      const filePath = join(uploadDir, targetFileName);

      try {
        await pipeline(file.file, createWriteStream(filePath));
        storedImageUrl = `/static/uploads/${targetFileName}`;
      } catch (error) {
        request.log.error({ err: error }, 'Failed to save uploaded image');
        reply.code(500).send({ message: 'Failed to process uploaded image' });
        return;
      }
    } else {
      file.file?.resume();
    }

    const gen = await prisma.generation.create({
      data: {
        userId,
        prompt: parsed.data.prompt,
        style: parsed.data.style,
        imageUrl: storedImageUrl,
        status: 'succeeded',
      },
    });

    reply.send({
      id: gen.id,
      prompt: gen.prompt,
      style: gen.style,
      imageUrl: gen.imageUrl,
      status: gen.status,
      createdAt: gen.createdAt,
    });
  });

  // GET /generations
  app.get('/', { preHandler: [authGuard] }, async (request) => {
    const userId = request.user?.id;
    if (!userId) {
      return [];
    }
    const gens = await prisma.generation.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });
    return gens;
  });
}

