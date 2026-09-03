import path from 'node:path';
import ejs from 'ejs';
import nodemailer from 'nodemailer';
import config from '../config/index.js';

const isEmailConfigured = Boolean(config.smtp_host && config.smtp_user && config.smtp_password);

const transporter = isEmailConfigured
  ? nodemailer.createTransport({
      host: config.smtp_host,
      port: Number(config.smtp_port) || 587,
      secure: Number(config.smtp_port) === 465,
      auth: { user: config.smtp_user, pass: config.smtp_password },
    })
  : null;

export const sendVerificationEmail = async (
  email: string,
  otp: string,
  name: string = 'User',
): Promise<void> => {
  if (!transporter) {
    if (config.node_env === 'production') throw new Error('Email service is not configured');
    console.log(`\n========================================`);
    console.log(`[DEV EMAIL] Verification code for ${email}: ${otp}`);
    console.log(`========================================\n`);
    return;
  }

  const templatePath = path.join(process.cwd(), 'src/templates/registration-otp.ejs');
  const expirationMinutes = 5;

  const html = await ejs.renderFile(templatePath, {
    name,
    email,
    otp,
    expirationMinutes,
  });

  await transporter.sendMail({
    from: config.email_sender || 'Academic Portal <no-reply@example.com>',
    to: email,
    subject: 'Email Verification Code',
    text: `Your verification code is: ${otp}. Valid for ${expirationMinutes} minutes.`,
    html,
  });
};

export const sendPasswordResetEmail = async (
  email: string,
  otp: string,
  name: string = 'User',
): Promise<void> => {
  if (!transporter) {
    if (config.node_env === 'production') throw new Error('Email service is not configured');
    console.log(`\n========================================`);
    console.log(`[DEV EMAIL] Password reset code for ${email}: ${otp}`);
    console.log(`========================================\n`);
    return;
  }

  const templatePath = path.join(process.cwd(), 'src/templates/forgot-password-otp.ejs');
  const expirationMinutes = 5;

  const html = await ejs.renderFile(templatePath, {
    name,
    email,
    otp,
    expirationMinutes,
  });

  await transporter.sendMail({
    from: config.email_sender || 'Academic Portal <no-reply@example.com>',
    to: email,
    subject: 'Password Reset Code',
    text: `Your password reset code is: ${otp}. Valid for ${expirationMinutes} minutes.`,
    html,
  });
};
