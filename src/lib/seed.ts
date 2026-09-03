import bcrypt from 'bcryptjs';
import config from '../config/index';
import { prisma } from './prisma';

const ADMIN_EMAIL = config.admin_email || 'admin@example.com';
const ADMIN_NAME = config.admin_name || 'Admin';
const ADMIN_PASSWORD = config.admin_password || '11111111';

export const seedAdmin = async (): Promise<void> => {
  const existing = await prisma.user.findUnique({
    where: { email: ADMIN_EMAIL },
  });

  if (existing) {
    return;
  }

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);

  await prisma.user.create({
    data: {
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      password: passwordHash,
      role: 'ADMIN',
      emailVerified: true,
      status: 'ACTIVE',
    },
  });

  console.log(`[Seed] Admin created successfully: ${ADMIN_EMAIL}`);
};
