import { Router } from 'express';
import { auth } from '../../middlewares/auth';
import { validate } from '../../middlewares/validate';
import { paymentController } from './payment.controller';
import { initiatePaymentSchema } from './payment.validation';

export const paymentRouter = Router();

// Student initiates bKash payment checkout
paymentRouter.post(
  '/bkash/initiate',
  auth('STUDENT'),
  validate(initiatePaymentSchema),
  paymentController.initiateBkashPayment,
);

// bKash gateway callback (redirected from bKash checkout)
paymentRouter.get('/bkash/callback', paymentController.handleBkashCallback);

// Student views their own payment history
paymentRouter.get('/my', auth('STUDENT'), paymentController.getMyPayments);

// Admin views all payments
paymentRouter.get('/', auth('ADMIN'), paymentController.getAllPayments);

// Authenticated user views a payment by ID
paymentRouter.get('/:id', auth('ADMIN', 'TEACHER', 'STUDENT'), paymentController.getPaymentById);

