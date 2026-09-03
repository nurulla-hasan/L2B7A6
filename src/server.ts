import { createServer } from 'node:http';
import app from './app';
import config from './config/index';
import { prisma } from './lib/prisma';
import { ensureRedisConnected, redisClient } from './lib/redis';
import { seedAdmin } from './lib/seed';

const server = createServer(app);
let shuttingDown = false;

async function main() {
  try {
    await prisma.$connect();
    console.log('Database connected successfully');

    await seedAdmin();
    await ensureRedisConnected();

    const port = Number(config.port) || 5000;
    server.listen(port, () => {
      console.log(`Server started on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

const shutdown = (signal: string) => {
  if (shuttingDown) return;
  shuttingDown = true;
  const forceExit = setTimeout(() => process.exit(1), 10000);
  forceExit.unref();
  server.close(() => {
    clearTimeout(forceExit);
    prisma.$disconnect();
    if (redisClient.isOpen) redisClient.quit();
  });
  console.log(`Received ${signal}, graceful shutdown complete.`);
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

main();
