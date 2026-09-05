import { Router } from 'express';
import { Role } from '../../../generated/prisma/client';
import { auth } from '../../middlewares/auth';
import { auditController } from './audit.controller';

export const auditRouter = Router();

auditRouter.get('/', auth(Role.ADMIN), auditController.getAllAuditLogs);
