import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import type { MultipartFile } from '@fastify/multipart';

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }

  interface FastifyRequest {
    file?: () => Promise<MultipartFile | undefined>;
    files?: () => AsyncIterableIterator<MultipartFile>;
    user?: {
      id: string;
    };
  }
}

