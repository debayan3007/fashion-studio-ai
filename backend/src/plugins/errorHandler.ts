import { FastifyInstance } from 'fastify';

export default async function errorHandler(app: FastifyInstance) {
  app.setErrorHandler((err, req, reply) => {
    req.log.error(err);

    const anyErr = err as any;
    if (anyErr && anyErr.validation) {
      return reply
        .code(400)
        .send({ message: 'Validation error', details: anyErr.validation });
    }

    return reply.code(500).send({ message: 'Internal server error' });
  });
}


