import path from 'node:path';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(process.cwd(), '.env') });

export default {
  node_env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 5000,
  database_url: process.env.DATABASE_URL,
  frontend_url: process.env.FRONTEND_URL || 'http://localhost:3000',
  bcrypt_salt_rounds: process.env.BCRYPT_SALT_ROUNDS || 12,
  jwt_access_secret:
    process.env.JWT_ACCESS_SECRET || 'super-secret-access-token-key-must-be-at-least-32-chars-long',
  jwt_refresh_secret:
    process.env.JWT_REFRESH_SECRET ||
    'super-secret-refresh-token-key-must-be-at-least-32-chars-long',
  jwt_access_expires_in: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  jwt_refresh_expires_in: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  google_client_id: process.env.GOOGLE_CLIENT_ID,
  google_client_secret: process.env.GOOGLE_CLIENT_SECRET,
  google_callback_url:
    process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/v1/auth/google/callback',
  admin_name: process.env.ADMIN_NAME || 'Super Admin',
  admin_email: process.env.ADMIN_EMAIL || 'admin@example.com',
  admin_password: process.env.ADMIN_PASSWORD || '11111111',
  redis_url: process.env.REDIS_URL || 'redis://localhost:6379',
  smtp_host: process.env.SMTP_HOST,
  smtp_port: process.env.SMTP_PORT || 587,
  smtp_user: process.env.SMTP_USER,
  smtp_password: process.env.SMTP_PASSWORD,
  email_sender: process.env.EMAIL_SENDER || 'Academic Portal <no-reply@example.com>',
  cloudinary_cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  cloudinary_api_key: process.env.CLOUDINARY_API_KEY,
  cloudinary_api_secret: process.env.CLOUDINARY_API_SECRET,
};
