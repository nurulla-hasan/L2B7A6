import { Router } from 'express';
import { auditRouter } from '../modules/audit/audit.routes';
import { authRouter } from '../modules/auth/auth.routes';
import { courseRouter } from '../modules/course/course.routes';
import { courseOfferingRouter } from '../modules/course-offering/course-offering.routes';
import { enrollmentRouter } from '../modules/enrollment/enrollment.routes';
import { paymentRouter } from '../modules/payment/payment.routes';
import { resultRouter } from '../modules/result/result.routes';
import { semesterRouter } from '../modules/semester/semester.routes';
import { userRouter } from '../modules/user/user.routes';

export const apiRouter = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/users', userRouter);
apiRouter.use('/semesters', semesterRouter);
apiRouter.use('/courses', courseRouter);
apiRouter.use('/course-offerings', courseOfferingRouter);
apiRouter.use('/enrollments', enrollmentRouter);
apiRouter.use('/payments', paymentRouter);
apiRouter.use('/results', resultRouter);
apiRouter.use('/audit-logs', auditRouter);
