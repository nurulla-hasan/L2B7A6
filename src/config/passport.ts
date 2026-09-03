import bcrypt from 'bcryptjs';
import httpStatus from 'http-status';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as LocalStrategy } from 'passport-local';
import { AuthProvider } from '../../generated/prisma/enums.js';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../utils/app-error.js';
import config from './index.js';

passport.use(
  new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password',
    },
    async (email, password, done) => {
      try {
        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user) {
          return done(new AppError(httpStatus.UNAUTHORIZED, 'Invalid email or password'), false, {
            message: 'Invalid email or password',
          });
        }

        if (user.status !== 'ACTIVE') {
          return done(new AppError(httpStatus.FORBIDDEN, 'Your account is disabled'), false, {
            message: 'Your account is disabled',
          });
        }

        if (!user.password) {
          return done(
            new AppError(httpStatus.UNAUTHORIZED, 'Please login with your Google account'),
            false,
            { message: 'Please login with your Google account' },
          );
        }

        if (!user.emailVerified) {
          return done(
            new AppError(httpStatus.UNAUTHORIZED, 'Please verify your email address'),
            false,
            {
              message: 'Please verify your email address',
            },
          );
        }

        const isPasswordMatch = await bcrypt.compare(password, user.password);

        if (!isPasswordMatch) {
          return done(new AppError(httpStatus.UNAUTHORIZED, 'Invalid email or password'), false, {
            message: 'Invalid email or password',
          });
        }

        return done(null, user);
      } catch (error) {
        return done(error, false);
      }
    },
  ),
);

export const isGoogleAuthConfigured = Boolean(
  config.google_client_id && config.google_client_secret && config.google_callback_url,
);

if (isGoogleAuthConfigured) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: config.google_client_id as string,
        clientSecret: config.google_client_secret as string,
        callbackURL: config.google_callback_url as string,
        passReqToCallback: true,
      },
      async (_req, _accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;

          if (!email) {
            return done(
              new AppError(httpStatus.BAD_REQUEST, 'Email address is required from Google'),
            );
          }

          const googleImage = profile.photos?.[0]?.value || '';

          let user = await prisma.user.findFirst({
            where: {
              OR: [{ googleId: profile.id }, { email }],
            },
          });

          if (user) {
            if (user.status !== 'ACTIVE') {
              return done(new AppError(httpStatus.FORBIDDEN, 'Your account is disabled'));
            }

            const updateData: Record<string, unknown> = {};
            let shouldUpdate = false;

            if (!user.googleId) {
              updateData.googleId = profile.id;
              shouldUpdate = true;
            }

            if (!user.imageUrl && googleImage) {
              updateData.imageUrl = googleImage;
              shouldUpdate = true;
            }

            if (!user.emailVerified) {
              updateData.emailVerified = true;
              shouldUpdate = true;
            }

            if (shouldUpdate) {
              user = await prisma.user.update({
                where: { id: user.id },
                data: updateData,
              });
            }

            return done(null, user);
          }

          // Register new user with STUDENT role as default
          user = await prisma.user.create({
            data: {
              name: profile.displayName || email.split('@')[0] || 'User',
              email,
              googleId: profile.id,
              authProvider: AuthProvider.GOOGLE,
              emailVerified: true,
              imageUrl: googleImage,
              role: 'STUDENT',
            },
          });

          return done(null, user);
        } catch (error) {
          return done(error as Error);
        }
      },
    ),
  );
}

export { passport };
