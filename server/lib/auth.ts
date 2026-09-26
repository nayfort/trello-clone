import { betterAuth } from 'better-auth';
import { db } from './db';
import { sendMail } from './mail';
function createAuth() {
  const secret = process.env.BETTER_AUTH_SECRET;
  const baseURL = process.env.BETTER_AUTH_URL;
  if (!secret || secret.length < 32 || !baseURL)
    throw new Error(
      'Configure BETTER_AUTH_URL and a random BETTER_AUTH_SECRET (32+ characters)',
    );
  return betterAuth({
    appName: 'Trello Clone',
    database: db(),
    secret,
    baseURL,
    trustedOrigins: [baseURL],
    advanced: { ipAddress: { ipAddressHeaders: ['x-trello-client-ip'] } },
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 12,
      maxPasswordLength: 128,
      requireEmailVerification: true,
      revokeSessionsOnPasswordReset: true,
      sendResetPassword: async ({ user, url }) => {
        await sendMail(
          user.email,
          'Reset your password',
          `Reset your Trello Clone password using this link:\n\n${url}\n\nIf you did not request this, you can ignore this email.`,
        );
      },
    },
    emailVerification: {
      sendOnSignUp: true,
      sendOnSignIn: true,
      autoSignInAfterVerification: true,
      expiresIn: 3600,
      sendVerificationEmail: async ({ user, url }) => {
        await sendMail(
          user.email,
          'Verify your email',
          `Confirm your email to open your Trello Clone workspace:\n\n${url}`,
        );
      },
    },
    session: { expiresIn: 60 * 60 * 24 * 7, updateAge: 60 * 60 * 24 },
    rateLimit: {
      enabled: true,
      storage: 'database',
      window: 60,
      max: 100,
      customRules: {
        '/sign-in/email': { window: 60, max: 20 },
        '/sign-up/email': { window: 60, max: 20 },
        '/request-password-reset': { window: 60, max: 5 },
      },
    },
  });
}
let instance: ReturnType<typeof createAuth> | undefined;
export const getAuth = () => (instance ??= createAuth());
