import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
  });
  
  prisma.$connect()
    .then(() => console.log('Connected to the database'))
    .catch((error) => console.error('Failed to connect to the database', error));

export default prisma;
