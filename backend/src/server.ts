import buildApp from './app';

const PORT = Number(process.env.PORT) || 4000;

// Catch unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Catch uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

async function startServer() {
  try {
    const app = await buildApp();
    
    await app.listen({ port: PORT, host: '0.0.0.0' });
    console.log(`🚀 Server started on http://localhost:${PORT}`);
    
    // Graceful shutdown
    const shutdown = async (signal: string) => {
      console.log(`\n${signal} received, shutting down gracefully...`);
      await app.close();
      console.log('Server stopped');
      process.exit(0);
    };
    
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
}

startServer();

