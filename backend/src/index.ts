import { buildApp } from './app';
import { config } from './config';

async function start() {
  const app = await buildApp();
  app
    .listen({ port: config.port, host: '0.0.0.0' })
    .then(() => {
      app.log.info(`Server listening on ${config.port}`);
    })
    .catch((err) => {
      app.log.error(err);
      process.exit(1);
    });
}

start();

