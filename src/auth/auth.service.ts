import { Injectable } from '@nestjs/common';
import { betterAuth } from 'better-auth';

import { authConfig } from '../config/auth.config';
import { env } from '../config/env.config';
import { EmailService } from '../email/email.service';

@Injectable()
export class AuthService {
  constructor(private readonly emailService: EmailService) {}

  createAuth() {
    return betterAuth({
      ...authConfig,
      emailAndPassword: {
        ...authConfig.emailAndPassword,
        enabled: true,
        onExistingUserSignUp: async ({ user }) => {
          await this.emailService.sendEmail({
            from: env.RESEND_FROM_EMAIL,
            to: user.email,
            subject: 'Sign-up attempt with your email',
            text: 'Someone tried to create an account using your email address. If this was you, try signing in instead. If not, you can safely ignore this email.',
          });
        },
        sendResetPassword: async ({ user, token }) => {
          await this.emailService.sendEmail({
            from: env.RESEND_FROM_EMAIL,
            to: user.email,
            subject: 'Reset your password',
            text: `Click the link to reset your password: ${env.CORS_ORIGIN}/auth/reset-password?token=${token}`,
          });
        },
      },
      emailVerification: {
        ...authConfig.emailVerification,
        sendVerificationEmail: async ({ user, token }) => {
          await this.emailService.sendEmail({
            from: env.RESEND_FROM_EMAIL,
            to: user.email,
            subject: 'Verify your email address',
            text: `Click the link to verify your email: ${env.CORS_ORIGIN}/auth/verify-email?token=${token}`,
          });
        },
      },
    });
  }
}
