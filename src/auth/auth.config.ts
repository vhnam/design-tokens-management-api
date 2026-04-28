import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { WorkspaceService } from 'src/workspace/workspace.service';

import { db } from '../config/db';
import { env } from '../config/env';
import { EmailService } from '../email/email.service';
import * as schema from '../schema/auth';

const emailService = new EmailService();
const workspaceService = new WorkspaceService();

export const auth = betterAuth({
  secret: env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, { provider: 'pg', schema }),
  baseURL: env.BETTER_AUTH_URL,
  basePath: '/api/auth',
  trustedOrigins: [env.CORS_ORIGIN],
  revokeSessionsOnPasswordReset: true,
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    requireEmailVerification: true,
    onExistingUserSignUp: async ({ user }) => {
      await emailService.sendEmail({
        from: env.RESEND_FROM_EMAIL,
        to: user.email,
        subject: 'Sign-up attempt with your email',
        text: 'Someone tried to create an account using your email address. If this was you, try signing in instead. If not, you can safely ignore this email.',
      });
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, token }) => {
      await emailService.sendEmail({
        from: env.RESEND_FROM_EMAIL,
        to: user.email,
        subject: 'Verify your email address',
        text: `Click the link to verify your email: ${env.CORS_ORIGIN}/auth/verify-email?token=${token}`,
      });
    },
    afterEmailVerification: async () => {
      await workspaceService.create({
        name: 'workspace-default',
        image: null,
      });
    },
  },
});
