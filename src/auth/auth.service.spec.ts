import { Test, TestingModule } from '@nestjs/testing';

import { env } from '../config/env.config';
import { EmailService } from '../email/email.service';

import { AuthService } from './auth.service';

type BetterAuthMergedConfig = {
  emailAndPassword?: {
    enabled?: boolean;
    onExistingUserSignUp?: (_args: {
      user: { email: string };
    }) => Promise<void>;
    sendResetPassword?: (_args: {
      user: { email: string };
      token: string;
    }) => Promise<void>;
  };
  emailVerification?: {
    sendVerificationEmail?: (_args: {
      user: { email: string };
      token: string;
    }) => Promise<void>;
  };
};

const betterAuthMock = jest.fn((): { instance: string } => ({
  instance: 'auth',
})) as jest.MockedFunction<
  (config: BetterAuthMergedConfig) => { instance: string }
>;

jest.mock('better-auth', () => ({
  betterAuth: (...args: [BetterAuthMergedConfig]): { instance: string } =>
    betterAuthMock(...args),
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

  it('should build better-auth instance with overridden callbacks', () => {
    const authInstance = service.createAuth();

    expect(authInstance).toEqual({ instance: 'auth' });
    expect(betterAuthMock).toHaveBeenCalledTimes(1);

    const cfg = betterAuthMock.mock.calls[0]?.[0];
    expect(cfg?.emailAndPassword?.enabled).toBe(true);
    expect(typeof cfg?.emailAndPassword?.onExistingUserSignUp).toBe('function');
    expect(typeof cfg?.emailAndPassword?.sendResetPassword).toBe('function');
    expect(typeof cfg?.emailVerification?.sendVerificationEmail).toBe(
      'function',
    );
  });

  it('should send email when sign-up happens for an existing user', async () => {
    service.createAuth();

    const onExisting =
      betterAuthMock.mock.calls[0]?.[0].emailAndPassword?.onExistingUserSignUp;
    expect(onExisting).toBeDefined();
    await onExisting?.({
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

    const sendReset =
      betterAuthMock.mock.calls[0]?.[0].emailAndPassword?.sendResetPassword;
    expect(sendReset).toBeDefined();
    await sendReset?.({
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

    const sendVerify =
      betterAuthMock.mock.calls[0]?.[0].emailVerification
        ?.sendVerificationEmail;
    expect(sendVerify).toBeDefined();
    await sendVerify?.({
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
