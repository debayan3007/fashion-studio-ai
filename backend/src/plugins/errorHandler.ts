import type { FastifyError, FastifyInstance, ValidationResult } from 'fastify';

function isValidationError(error: FastifyError): error is FastifyError & { validation: ValidationResult[] } {
  return Array.isArray((error as { validation?: unknown }).validation);
}

export default async function errorHandler(app: FastifyInstance) {
  app.setErrorHandler((error, req, reply) => {
    req.log.error(error);

    if (isValidationError(error)) {
      return reply
        .code(400)
        .send({ message: 'Validation error', details: error.validation });
    }

    return reply.code(500).send({ message: 'Internal server error' });
  });
}


