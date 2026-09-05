import { Router } from 'express';
import { auditRouter } from '../modules/audit/audit.routes';
import { authRouter } from '../modules/auth/auth.routes';
import { CourseRoutes } from '../modules/course/course.routes';
import { semesterRouter } from '../modules/semester/semester.routes';
import { userRouter } from '../modules/user/user.routes';

export const apiRouter = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/users', userRouter);
apiRouter.use('/semesters', semesterRouter);
apiRouter.use('/courses', CourseRoutes);
apiRouter.use('/audit-logs', auditRouter);
