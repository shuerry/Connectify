import UserModel from '../../models/users.model';
import { NotificationService } from '../../services/notification.service';
import { generateVerificationToken, hashToken } from '../../utils/crypto.util';
import { requestPasswordReset, confirmPasswordReset } from '../../services/passwordReset.service';

jest.mock('../../models/users.model', () => ({
  __esModule: true,
  default: {
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
  },
}));

jest.mock('../../utils/crypto.util', () => ({
  generateVerificationToken: jest.fn(),
  hashToken: jest.fn(),
}));

const sendPasswordResetMock = jest.fn();

(NotificationService as any).prototype.sendPasswordReset = sendPasswordResetMock;

const MockedUserModel = UserModel as unknown as {
  findOne: jest.Mock;
  findOneAndUpdate: jest.Mock;
};

const mockedGenerateVerificationToken = generateVerificationToken as jest.MockedFunction<
  typeof generateVerificationToken
>;

const mockedHashToken = hashToken as jest.MockedFunction<typeof hashToken>;

const originalDateNow = Date.now;
const originalEnv = { ...process.env };

describe('passwordReset.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    (Date.now as unknown as jest.Mock) = jest.fn(originalDateNow);
  });

  afterAll(() => {
    Date.now = originalDateNow;
    process.env = originalEnv;
  });

  describe('requestPasswordReset', () => {
    it('returns ok when user is not found (security: no info leak)', async () => {
      MockedUserModel.findOne.mockResolvedValueOnce(null);

      const result = await requestPasswordReset('unknown-user');

      expect(result).toEqual({ ok: true });
      expect(MockedUserModel.findOne).toHaveBeenCalledTimes(1);
      expect(MockedUserModel.findOne).toHaveBeenCalledWith({
        $or: [{ username: 'unknown-user' }, { email: 'unknown-user' }],
      });
      expect(MockedUserModel.findOneAndUpdate).not.toHaveBeenCalled();
      expect(sendPasswordResetMock).not.toHaveBeenCalled();
    });

    it('returns ok when user has no email (security: no info leak)', async () => {
      MockedUserModel.findOne.mockResolvedValueOnce({
        _id: 'user-id-1',
        username: 'no-email-user',
        email: undefined,
      });

      const result = await requestPasswordReset('no-email-user');

      expect(result).toEqual({ ok: true });
      expect(MockedUserModel.findOne).toHaveBeenCalledTimes(1);
      expect(MockedUserModel.findOneAndUpdate).not.toHaveBeenCalled();
      expect(sendPasswordResetMock).not.toHaveBeenCalled();
    });

    it('stores reset token, uses default SITE_URL, and sends notification when user is found', async () => {
      delete process.env.SITE_URL;
      delete process.env.PASSWORD_RESET_TTL_MIN;

      const fixedNow = 1_700_000_000_000;
      (Date.now as unknown as jest.Mock).mockReturnValue(fixedNow);

      const user = {
        _id: 'user-id-2',
        username: 'john',
        email: 'john@example.com',
      };

      MockedUserModel.findOne.mockResolvedValueOnce(user);
      MockedUserModel.findOneAndUpdate.mockResolvedValueOnce(null);

      mockedGenerateVerificationToken.mockReturnValueOnce('raw-token');
      mockedHashToken.mockReturnValueOnce('hashed-token');

      const result = await requestPasswordReset('john');

      expect(result).toEqual({ ok: true });

      expect(mockedGenerateVerificationToken).toHaveBeenCalledTimes(1);
      expect(mockedHashToken).toHaveBeenCalledWith('raw-token');

      expect(MockedUserModel.findOneAndUpdate).toHaveBeenCalledTimes(1);
      const [query, update] = MockedUserModel.findOneAndUpdate.mock.calls[0];

      expect(query).toEqual({ _id: 'user-id-2' });
      expect(update.$set.passwordReset.tokenHash).toBe('hashed-token');

      const expiresAt = update.$set.passwordReset.expiresAt;
      expect(expiresAt).toBeInstanceOf(Date);
      expect(expiresAt.getTime()).toBe(fixedNow + 30 * 60_000);

      expect(sendPasswordResetMock).toHaveBeenCalledTimes(1);
      const payload = sendPasswordResetMock.mock.calls[0][0];

      expect(payload.toEmail).toBe('john@example.com');
      expect(payload.username).toBe('john');

      expect(payload.resetUrl).toBe('http://localhost:4530/reset-password?token=raw-token');

      expect(payload.expiresAt).toEqual(expiresAt);
    });

    it('uses SITE_URL from env when provided', async () => {
      process.env.SITE_URL = 'https://my-app.example.com';

      const user = {
        _id: 'user-id-3',
        username: 'alice',
        email: 'alice@example.com',
      };

      MockedUserModel.findOne.mockResolvedValueOnce(user);
      MockedUserModel.findOneAndUpdate.mockResolvedValueOnce(null);

      mockedGenerateVerificationToken.mockReturnValueOnce('abc123');
      mockedHashToken.mockReturnValueOnce('hash-abc123');

      await requestPasswordReset('alice');

      expect(sendPasswordResetMock).toHaveBeenCalledTimes(1);
      const payload = sendPasswordResetMock.mock.calls[0][0];

      expect(payload.resetUrl).toBe('https://my-app.example.com/reset-password?token=abc123');
    });
  });

  describe('confirmPasswordReset', () => {
    it('returns error when no matching user is found (invalid or expired token)', async () => {
      mockedHashToken.mockReturnValueOnce('hashed-token');
      MockedUserModel.findOne.mockResolvedValueOnce(null);

      const result = await confirmPasswordReset('raw-token', 'new-pass');

      expect(mockedHashToken).toHaveBeenCalledWith('raw-token');
      expect(MockedUserModel.findOne).toHaveBeenCalledTimes(1);

      const [query] = MockedUserModel.findOne.mock.calls[0];
      expect(query['passwordReset.tokenHash']).toBe('hashed-token');

      expect(query['passwordReset.expiresAt']).toBeDefined();
      expect(query['passwordReset.expiresAt'].$gt).toBeInstanceOf(Date);

      expect(result).toEqual({
        error: 'Invalid or expired reset token',
      });
    });

    it('updates password, clears reset token, and saves user when token is valid', async () => {
      const saveMock = jest.fn().mockResolvedValue(undefined);
      const user: any = {
        _id: 'user-id-4',
        username: 'bob',
        email: 'bob@example.com',
        password: 'old-hash',
        passwordReset: {
          tokenHash: 'hashed-token',
          expiresAt: new Date(Date.now() + 60_000),
        },
        save: saveMock,
      };

      mockedHashToken.mockReturnValueOnce('hashed-token');
      MockedUserModel.findOne.mockResolvedValueOnce(user);

      const result = await confirmPasswordReset('raw-token', 'new-password');

      expect(mockedHashToken).toHaveBeenCalledWith('raw-token');
      expect(MockedUserModel.findOne).toHaveBeenCalledTimes(1);

      expect(user.password).toBe('new-password');
      expect(user.passwordReset).toBeUndefined();

      expect(saveMock).toHaveBeenCalledTimes(1);

      expect(result).toEqual({ ok: true });
    });
  });
});
