import UserModel from '../../models/users.model';
const sendEmailVerificationMock = jest.fn();

jest.mock('../../models/users.model', () => ({
  __esModule: true,
  default: {
    findOneAndUpdate: jest.fn(),
    findOne: jest.fn(),
  },
}));

jest.mock('../../services/notification.service', () => ({
  NotificationService: jest.fn().mockImplementation(() => ({
    sendEmailVerification: sendEmailVerificationMock,
  })),
}));

jest.mock('../../utils/crypto.util', () => ({
  generateVerificationToken: jest.fn(),
  hashToken: jest.fn(),
}));

import { generateVerificationToken, hashToken } from '../../utils/crypto.util';
import {
  startEmailVerification,
  confirmEmailVerification,
} from '../../services/emailVerification.service';

type MockedFn = jest.Mock<any, any>;

describe('emailVerification.service', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    delete process.env.SITE_URL;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('startEmailVerification', () => {
    it('returns error when user is not found', async () => {
      (generateVerificationToken as MockedFn).mockReturnValue('test-token');
      (hashToken as MockedFn).mockReturnValue('hashed-test-token');
      (UserModel.findOneAndUpdate as MockedFn).mockResolvedValue(null);

      const result = await startEmailVerification('alice', 'new@example.com');

      expect(generateVerificationToken).toHaveBeenCalledTimes(1);
      expect(hashToken).toHaveBeenCalledWith('test-token');

      expect(UserModel.findOneAndUpdate).toHaveBeenCalledWith(
        { username: 'alice' },
        {
          $set: {
            emailVerified: false,
            emailVerification: {
              pendingEmail: 'new@example.com',
              tokenHash: 'hashed-test-token',
              expiresAt: expect.any(Date),
            },
          },
        },
        { new: true, projection: { username: 1, email: 1 } },
      );

      expect(result).toEqual({ error: 'User not found' });
    });

    it('sends verification email and returns ok (default SITE_URL)', async () => {
      (generateVerificationToken as MockedFn).mockReturnValue('test-token');
      (hashToken as MockedFn).mockReturnValue('hashed-test-token');

      (UserModel.findOneAndUpdate as MockedFn).mockResolvedValue({
        username: 'alice',
        email: 'old@example.com',
      });

      const result = await startEmailVerification('alice', 'new@example.com');

      expect(result).toEqual({ ok: true });

      // Assert the notifier was used correctly
      expect(sendEmailVerificationMock).toHaveBeenCalledTimes(1);

      const callArg = sendEmailVerificationMock.mock.calls[0][0];

      expect(callArg).toMatchObject({
        toEmail: 'new@example.com',
        username: 'alice',
        token: 'test-token',
        verifyUrl: 'http://localhost:4530/verify-email?token=' + encodeURIComponent('test-token'),
      });
      expect(callArg.expiresAt).toBeInstanceOf(Date);
    });

    it('uses SITE_URL env var when provided', async () => {
      process.env.SITE_URL = 'https://myapp.example.com';

      (generateVerificationToken as MockedFn).mockReturnValue('token-xyz');
      (hashToken as MockedFn).mockReturnValue('hash-xyz');

      (UserModel.findOneAndUpdate as MockedFn).mockResolvedValue({
        username: 'bob',
        email: 'bob@old.com',
      });

      const result = await startEmailVerification('bob', 'bob@new.com');

      expect(result).toEqual({ ok: true });

      expect(sendEmailVerificationMock).toHaveBeenCalledTimes(1);
      const { verifyUrl } = sendEmailVerificationMock.mock.calls[0][0];

      expect(verifyUrl).toBe(
        'https://myapp.example.com/verify-email?token=' + encodeURIComponent('token-xyz'),
      );
    });
  });

  describe('confirmEmailVerification', () => {
    it('returns error when no matching user or pendingEmail (invalid/expired token branch)', async () => {
      (hashToken as MockedFn).mockReturnValue('hashed-bad-token');
      (UserModel.findOne as MockedFn).mockResolvedValue(null);

      const result = await confirmEmailVerification('bad-token');

      expect(hashToken).toHaveBeenCalledWith('bad-token');
      expect(UserModel.findOne).toHaveBeenCalledWith({
        'emailVerification.tokenHash': 'hashed-bad-token',
        'emailVerification.expiresAt': { $gt: expect.any(Date) },
      });

      expect(result).toEqual({ error: 'Invalid or expired token' });
    });

    it('commits new email, marks verified, clears verification and returns ok', async () => {
      (hashToken as MockedFn).mockReturnValue('hashed-good-token');

      const fakeUser: any = {
        username: 'charlie',
        email: 'charlie@old.com',
        emailVerified: false,
        emailVerification: {
          pendingEmail: 'charlie@new.com',
          tokenHash: 'hashed-good-token',
          expiresAt: new Date(Date.now() + 60_000),
        },
        save: jest.fn().mockResolvedValue(undefined),
      };

      (UserModel.findOne as MockedFn).mockResolvedValue(fakeUser);

      const result = await confirmEmailVerification('good-token');

      expect(hashToken).toHaveBeenCalledWith('good-token');
      expect(UserModel.findOne).toHaveBeenCalledWith({
        'emailVerification.tokenHash': 'hashed-good-token',
        'emailVerification.expiresAt': { $gt: expect.any(Date) },
      });

      expect(fakeUser.email).toBe('charlie@new.com');
      expect(fakeUser.emailVerified).toBe(true);
      expect(fakeUser.emailVerification).toBeUndefined();
      expect(fakeUser.save).toHaveBeenCalled();

      expect(result).toEqual({
        ok: true,
        email: 'charlie@new.com',
        username: 'charlie',
      });
    });
  });
});
