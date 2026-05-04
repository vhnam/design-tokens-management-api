import { Injectable } from '@nestjs/common';
import { betterAuth } from 'better-auth';
import { organization } from 'better-auth/plugins/organization';

import { authConfig } from '../config/auth.config';
import { env } from '../config/env.config';
import { EmailService } from '../email/email.service';

const frontendOrigin = new URL(env.CORS_ORIGIN).origin;

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
          const encodedToken = encodeURIComponent(token);
          await this.emailService.sendEmail({
            from: env.RESEND_FROM_EMAIL,
            to: user.email,
            subject: 'Reset your password',
            text: `Click the link to reset your password: ${frontendOrigin}/auth/reset-password?token=${encodedToken}`,
          });
        },
      },
      emailVerification: {
        ...authConfig.emailVerification,
        sendVerificationEmail: async ({ user, token }) => {
          const encodedToken = encodeURIComponent(token);
          await this.emailService.sendEmail({
            from: env.RESEND_FROM_EMAIL,
            to: user.email,
            subject: 'Verify your email address',
            text: `Click the link to verify your email: ${frontendOrigin}/auth/verify-email?token=${encodedToken}`,
          });
        },
      },
      plugins: [
        organization({
          allowUserToCreateOrganization: (user) => user.emailVerified === true,
          organizationLimit: 10,
          membershipLimit: 100,
          disableOrganizationDeletion: true,
          invitationExpiresIn: 60 * 60 * 24 * 7,
          invitationLimit: 50,
          sendInvitationEmail: async (data) => {
            const invitationId = encodeURIComponent(data.invitation.id);
            await this.emailService.sendEmail({
              from: env.RESEND_FROM_EMAIL,
              to: data.email,
              subject: `Join ${data.organization.name}`,
              text: `${data.inviter.user.name} invited you to join ${data.organization.name}. Accept invitation: ${frontendOrigin}/auth/accept-invitation?id=${invitationId}`,
            });
          },
        }),
      ],
    });
  }
}
