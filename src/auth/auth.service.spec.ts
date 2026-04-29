import { Test, TestingModule } from '@nestjs/testing';

import { env } from '../config/env.config';
import { EmailService } from '../email/email.service';

import { AuthService } from './auth.service';

const betterAuthMock = jest.fn();

jest.mock('better-auth', () => ({
  betterAuth: (...args: unknown[]) => betterAuthMock(...args),
}));

jest.mock('../config/auth.config', () => ({
  authConfig: {
    basePath: '/api/auth',
    trustedOrigins: ['http://localhost:3000'],
    emailAndPassword: {
      enabled: false,
      revokeSessionsOnPasswordReset: true,
      requireEmailVerification: true,
      resetPasswordTokenExpiresIn: 3600,
    },
    emailVerification: {
      sendOnSignUp: true,
    },
  },
}));

jest.mock('../config/env.config', () => ({
  env: {
    RESEND_FROM_EMAIL: 'no-reply@example.com',
    CORS_ORIGIN: 'https://app.example.com',
    BETTER_AUTH_URL: 'https://api.example.com',
  },
}));

describe('AuthService', () => {
  let service: AuthService;
  const sendEmailMock = jest.fn();

  beforeEach(async () => {
    jest.clearAllMocks();
    betterAuthMock.mockReturnValue({ instance: 'auth' });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: EmailService,
          useValue: {
            sendEmail: sendEmailMock,
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should build better-auth instance with overridden callbacks', async () => {
    const authInstance = service.createAuth();

    expect(authInstance).toEqual({ instance: 'auth' });
    expect(betterAuthMock).toHaveBeenCalledTimes(1);

    const config = betterAuthMock.mock.calls[0][0] as {
      emailAndPassword: {
        enabled: boolean;
        onExistingUserSignUp: ({
          user,
        }: {
          user: { email: string };
        }) => Promise<void>;
        sendResetPassword: ({
          user,
          token,
        }: {
          user: { email: string };
          token: string;
        }) => Promise<void>;
      };
      emailVerification: {
        sendVerificationEmail: ({
          user,
          token,
        }: {
          user: { email: string };
          token: string;
        }) => Promise<void>;
      };
    };

    expect(config.emailAndPassword.enabled).toBe(true);
    expect(typeof config.emailAndPassword.onExistingUserSignUp).toBe(
      'function',
    );
    expect(typeof config.emailAndPassword.sendResetPassword).toBe('function');
    expect(typeof config.emailVerification.sendVerificationEmail).toBe(
      'function',
    );
  });

  it('should send email when sign-up happens for an existing user', async () => {
    service.createAuth();
    const config = betterAuthMock.mock.calls[0][0] as {
      emailAndPassword: {
        onExistingUserSignUp: ({
          user,
        }: {
          user: { email: string };
        }) => Promise<void>;
      };
    };

    await config.emailAndPassword.onExistingUserSignUp({
      user: { email: 'existing@example.com' },
    });

    expect(sendEmailMock).toHaveBeenCalledWith({
      from: env.RESEND_FROM_EMAIL,
      to: 'existing@example.com',
      subject: 'Sign-up attempt with your email',
      text: 'Someone tried to create an account using your email address. If this was you, try signing in instead. If not, you can safely ignore this email.',
    });
  });

  it('should send reset password email with frontend URL token', async () => {
    service.createAuth();
    const config = betterAuthMock.mock.calls[0][0] as {
      emailAndPassword: {
        sendResetPassword: ({
          user,
          token,
        }: {
          user: { email: string };
          token: string;
        }) => Promise<void>;
      };
    };

    await config.emailAndPassword.sendResetPassword({
      user: { email: 'reset@example.com' },
      token: 'reset token+123',
    });

    expect(sendEmailMock).toHaveBeenCalledWith({
      from: env.RESEND_FROM_EMAIL,
      to: 'reset@example.com',
      subject: 'Reset your password',
      text: 'Click the link to reset your password: https://app.example.com/auth/reset-password?token=reset%20token%2B123',
    });
  });

  it('should send verification email with frontend URL token', async () => {
    service.createAuth();
    const config = betterAuthMock.mock.calls[0][0] as {
      emailVerification: {
        sendVerificationEmail: ({
          user,
          token,
        }: {
          user: { email: string };
          token: string;
        }) => Promise<void>;
      };
    };

    await config.emailVerification.sendVerificationEmail({
      user: { email: 'verify@example.com' },
      token: 'verify token+456',
    });

    expect(sendEmailMock).toHaveBeenCalledWith({
      from: env.RESEND_FROM_EMAIL,
      to: 'verify@example.com',
      subject: 'Verify your email address',
      text: 'Click the link to verify your email: https://app.example.com/auth/verify-email?token=verify%20token%2B456',
    });
  });
});
