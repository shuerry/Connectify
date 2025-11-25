// tests/services/notification.service.spec.ts

// IMPORTANT: do NOT import the service or @sendgrid/mail at top level.
// We want to control module loading order with jest.resetModules + dynamic import().

jest.mock('@sendgrid/mail', () => {
  const setApiKey = jest.fn();
  const send = jest.fn();
  return {
    __esModule: true,
    default: { setApiKey, send },
  };
});

jest.mock('../../models/notification.model', () => ({
  __esModule: true,
  default: {
    create: jest.fn(),
    find: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    updateMany: jest.fn(),
    findByIdAndDelete: jest.fn(),
  },
}));

jest.mock('../../utils/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

// Service exports
let notificationService: any;
let setNotificationSocket: any;
let createNotification: any;
let listNotifications: any;
let markRead: any;
let markAllRead: any;
let deleteNotification: any;

// Mocks (same instances the service uses) –
// typed as `any` to avoid TS structural type conflicts with the real module types.
let mockedSgMail: any;
let MockedNotificationModel: any;
let mockedLogger: any;

beforeAll(async () => {
  // Ensure env is set before the service module runs.
  process.env.SENDGRID_API_KEY = 'test-sendgrid-key';
  process.env.FROM_EMAIL = 'no-reply@example.com';
  process.env.SITE_URL = 'https://example.com';

  // Clear Jest module registry so the service is loaded fresh with our mocks.
  jest.resetModules();

  // Import mocks AFTER resetModules so we get the same instances as the service.
  const mailMod = await import('@sendgrid/mail');
  mockedSgMail = mailMod.default;

  const modelMod = await import('../../models/notification.model');
  MockedNotificationModel = modelMod.default;

  const loggerMod = await import('../../utils/logger');
  mockedLogger = loggerMod.default;

  // Now load the service module. At this point, sgMail is mocked and
  // sgMail.setApiKey(process.env.SENDGRID_API_KEY || '') is called on mockedSgMail.
  const serviceMod = await import('../../services/notification.service');

  notificationService = serviceMod.NotificationService;
  setNotificationSocket = serviceMod.setNotificationSocket;
  createNotification = serviceMod.createNotification;
  listNotifications = serviceMod.listNotifications;
  markRead = serviceMod.markRead;
  markAllRead = serviceMod.markAllRead;
  deleteNotification = serviceMod.deleteNotification;
});

beforeEach(() => {
  jest.clearAllMocks();

  // Default sgMail.send behavior: return a thenable that invokes the success handler.
  mockedSgMail.send.mockImplementation(() => ({
    then: (onFulfilled?: () => void) => {
      if (onFulfilled) onFulfilled();
      return {
        catch: jest.fn(),
      };
    },
  }));
});

describe('NotificationService internals', () => {
  let service: any;

  beforeEach(() => {
    service = new notificationService();
  });

  describe('_sendMail', () => {
    it('sends mail and logs success', async () => {
      const thenSpy = jest.fn().mockImplementation((onFulfilled: () => void) => {
        onFulfilled();
        return { catch: jest.fn() };
      });
      mockedSgMail.send.mockReturnValue({ then: thenSpy } as any);

      await (service as any)._sendMail(['user@example.com'], 'Subject', '<p>HTML</p>', 'Text');

      expect(mockedSgMail.send).toHaveBeenCalledWith({
        to: ['user@example.com'],
        from: 'no-reply@example.com',
        subject: 'Subject',
        text: 'Text',
        html: '<p>HTML</p>',
      });
      expect(mockedLogger.info).toHaveBeenCalledWith('Email sent');
      expect(mockedLogger.error).not.toHaveBeenCalled();
    });

    it('logs error when sgMail.send rejects', async () => {
      const error = new Error('boom');
      const catchSpy = jest.fn().mockImplementation((onRejected: (err: Error) => void) => {
        onRejected(error);
      });

      mockedSgMail.send.mockReturnValue({
        then: () => ({ catch: catchSpy }),
      } as any);

      await (service as any)._sendMail(['user@example.com'], 'Subject', '<p>HTML</p>');

      expect(mockedLogger.error).toHaveBeenCalledWith(error);
    });
  });

  describe('_escape', () => {
    it('escapes &, <, >, " and handles undefined input', () => {
      const escaped = (service as any)._escape('&<>"');
      expect(escaped).toBe('&amp;&lt;&gt;&quot;');

      const escapedDefault = (service as any)._escape();
      expect(escapedDefault).toBe('');
    });
  });

  describe('_layout', () => {
    it('builds full layout with button and custom footer', () => {
      const html = (service as any)._layout({
        title: 'Title <Test>',
        intro: 'Intro',
        body: 'Body',
        ctaLabel: 'Click me',
        ctaHref: 'https://example.com/path?x=1&y=2',
        footerNote: 'Custom footer',
      });

      expect(html).toContain('&lt;Test&gt;'); // escaped title
      expect(html).toContain('Click me'); // button label
      expect(html).toContain('Custom footer'); // footer note
      expect(html).toContain('background:#3b82f6'); // button styling present
    });

    it('builds layout without button and uses default footer', () => {
      const html = (service as any)._layout({
        title: 'No button',
      });

      expect(html).not.toContain('background:#3b82f6'); // no button
      expect(html).toContain('Sent by https://example.com'); // default footer
    });
  });

  describe('sendChatNotification', () => {
    it('sends non-mention notification without groupName or chatId', async () => {
      await service.sendChatNotification({
        toEmail: ['user2@example.com'],
        toName: undefined,
        fromName: undefined,
        messagePreview: 'Hi',
        groupName: undefined,
        isMention: false,
        chatId: undefined,
      });

      const msg = mockedSgMail.send.mock.calls[0][0];
      expect(msg.subject).toContain('New chat message');
      expect(msg.subject).not.toContain('in ');
      expect(msg.text).toContain('Hi');
      expect(msg.text).toContain('https://example.com'); // falls back to site URL
    });

    it('sends mention notification with fromName and groupName', async () => {
      await service.sendChatNotification({
        toEmail: ['user@example.com'],
        toName: 'Alice',
        fromName: 'Bob',
        messagePreview: 'Hey there!',
        groupName: 'Team Chat',
        isMention: true,
        chatId: 'chat123',
      });

      const msg = mockedSgMail.send.mock.calls[0][0];
      expect(msg.subject).toBe('Bob mentioned you in Team Chat');
      expect(msg.text).toContain('Bob wrote: Hey there!');
      expect(msg.html).toContain('Hi Alice,');
      expect(msg.html).toContain('Team Chat');
      expect(msg.html).toContain('/messaging/direct-message');
    });

    it('sends mention notification without fromName but with groupName', async () => {
      await service.sendChatNotification({
        toEmail: ['user@example.com'],
        toName: undefined,
        fromName: undefined,
        messagePreview: 'Mentioned!',
        groupName: 'Group',
        isMention: true,
        chatId: undefined,
      });

      const msg = mockedSgMail.send.mock.calls[0][0];
      expect(msg.subject).toBe('You were mentioned in Group');
      expect(msg.text).toContain('Mentioned!');
      expect(msg.text).not.toContain('wrote:'); // fromName is undefined
      expect(msg.html).toContain('Hello,');
    });

    it('sends mention notification without groupName (falls back to "chat")', async () => {
      await service.sendChatNotification({
        toEmail: ['user@example.com'],
        toName: 'User',
        fromName: 'Sender',
        messagePreview: 'Test',
        groupName: undefined,
        isMention: true,
        chatId: 'chat456',
      });

      const msg = mockedSgMail.send.mock.calls[0][0];
      expect(msg.subject).toBe('Sender mentioned you in chat');
      expect(msg.html).toContain('Hi User,');
    });

    it('sends non-mention notification with groupName', async () => {
      await service.sendChatNotification({
        toEmail: ['user@example.com'],
        toName: 'Alice',
        fromName: 'Bob',
        messagePreview: 'Hello',
        groupName: 'Project Team',
        isMention: false,
        chatId: undefined,
      });

      const msg = mockedSgMail.send.mock.calls[0][0];
      expect(msg.subject).toBe('Bob sent a message in Project Team');
      expect(msg.html).toContain('Project Team');
      expect(msg.text).toContain('https://example.com');
    });

    it('handles empty messagePreview gracefully', async () => {
      await service.sendChatNotification({
        toEmail: ['user@example.com'],
        toName: 'User',
        fromName: 'Sender',
        messagePreview: '',
        groupName: 'Group',
        isMention: false,
        chatId: undefined,
      });

      const msg = mockedSgMail.send.mock.calls[0][0];
      expect(msg.html).toContain('Sender');
      expect(msg.text).toContain('Sender wrote:');
    });
  });

  describe('sendAnswerNotification', () => {
    it('sends answer notification with title and author', async () => {
      await service.sendAnswerNotification({
        toEmail: ['user@example.com'],
        authorName: 'Carol',
        questionTitle: 'Why?',
        answerPreview: 'Because...',
        questionId: 'q1',
      });

      const msg = mockedSgMail.send.mock.calls[0][0];
      expect(msg.subject).toContain('New answer — Why?');
      expect(msg.html).toContain('Carol');
      expect(msg.html).toContain('Because...');
      expect(msg.html).toContain('/question/q1');
      expect(msg.text).toContain('Carol posted an answer: Because...');
    });

    it('handles missing author and question title', async () => {
      await service.sendAnswerNotification({
        toEmail: ['user2@example.com'],
        authorName: undefined,
        questionTitle: undefined,
        answerPreview: 'Some answer',
        questionId: 'q2',
      });

      const msg = mockedSgMail.send.mock.calls[0][0];
      expect(msg.subject).toBe('New answer');
      expect(msg.text).toContain('New answer: Some answer');
    });

    it('handles missing answerPreview gracefully', async () => {
      await service.sendAnswerNotification({
        toEmail: ['user@example.com'],
        authorName: 'Author',
        questionTitle: 'Question',
        answerPreview: undefined,
        questionId: 'q3',
      });

      const msg = mockedSgMail.send.mock.calls[0][0];
      expect(msg.html).toContain('Author');
      expect(msg.html).toContain('Question');
      expect(msg.text).toContain('Author posted an answer:');
      expect(msg.text).not.toContain('undefined');
    });

    it('handles missing authorName in text when answerPreview is present', async () => {
      await service.sendAnswerNotification({
        toEmail: ['user@example.com'],
        authorName: undefined,
        questionTitle: 'Title',
        answerPreview: 'Answer text',
        questionId: 'q4',
      });

      const msg = mockedSgMail.send.mock.calls[0][0];
      expect(msg.text).toContain('New answer: Answer text');
      expect(msg.text).not.toContain('posted an answer');
    });
  });

  describe('sendEmailVerification', () => {
    it('uses explicit verifyUrl and no expiry', async () => {
      await service.sendEmailVerification({
        toEmail: 'single@example.com',
        username: 'alice',
        token: 'ignored',
        verifyUrl: 'https://verify.example.com/foo',
        expiresAt: undefined,
      });

      const msg = mockedSgMail.send.mock.calls[0][0];
      expect(msg.to).toEqual(['single@example.com']); // string -> [string]
      expect(msg.subject).toBe('Verify your email address');
      expect(msg.text).toContain('alice');
      expect(msg.text).toContain('https://verify.example.com/foo');
      expect(msg.text).not.toContain('expires on');
    });

    it('builds verifyUrl from token and includes expiry', async () => {
      const expiresAt = new Date().toISOString();

      await service.sendEmailVerification({
        toEmail: ['a@example.com', 'b@example.com'],
        username: undefined,
        token: 'token-123',
        verifyUrl: undefined,
        expiresAt,
      });

      const msg = mockedSgMail.send.mock.calls[0][0];
      expect(msg.to).toEqual(['a@example.com', 'b@example.com']); // already array
      expect(msg.text).toContain('token-123');
      expect(msg.text).toContain('expires on');
    });

    it('falls back to empty token value when not provided', async () => {
      await service.sendEmailVerification({
        toEmail: 'user@example.com',
        username: 'testuser',
        token: undefined,
        verifyUrl: undefined,
        expiresAt: undefined,
      });

      const msg = mockedSgMail.send.mock.calls[0][0];
      expect(msg.text).toContain('/verify-email?token=');
      expect(msg.text).not.toContain('token=undefined');
    });
  });

  describe('sendPasswordReset', () => {
    it('includes expiry when provided', async () => {
      const expiresAt = new Date().toISOString();

      await service.sendPasswordReset({
        toEmail: 'reset@example.com',
        username: 'bob',
        resetUrl: 'https://example.com/reset/abc',
        expiresAt,
      });

      const msg = mockedSgMail.send.mock.calls[0][0];
      expect(msg.to).toEqual(['reset@example.com']);
      expect(msg.subject).toBe('Reset your password');
      expect(msg.text).toContain('bob');
      expect(msg.text).toContain('https://example.com/reset/abc');
      expect(msg.text).toContain('expires on');
    });

    it('omits expiry text when not provided', async () => {
      await service.sendPasswordReset({
        toEmail: 'reset2@example.com',
        username: 'charlie',
        resetUrl: 'https://example.com/reset/def',
        expiresAt: undefined,
      });

      const msg = mockedSgMail.send.mock.calls[0][0];
      expect(msg.text).toContain('Reset your password, charlie');
      expect(msg.text).toContain('https://example.com/reset/def');
      expect(msg.text).not.toContain('expires on');
    });
  });
});

describe('socket wiring + exported CRUD helpers', () => {
  it('setNotificationSocket sets socket and createNotification emits when socket is set', async () => {
    const payload = {
      recipient: 'alice',
      kind: 'chat' as const,
      title: 'Hello',
      preview: 'Preview',
      link: '/link',
      actorUsername: 'bob',
      meta: { foo: 'bar' },
    };

    const docObj = { id: '1', recipient: 'alice' };
    const doc = { toObject: jest.fn(() => docObj) };
    MockedNotificationModel.create.mockResolvedValue(doc);

    const emit = jest.fn();
    const to = jest.fn().mockReturnValue({ emit });

    setNotificationSocket({ to } as any);

    const result = await createNotification(payload);

    expect(MockedNotificationModel.create).toHaveBeenCalledWith(payload);
    expect(doc.toObject).toHaveBeenCalled();
    expect(result).toEqual(docObj);
    expect(to).toHaveBeenCalledWith('user:alice');
    expect(emit).toHaveBeenCalledWith('notificationUpdate');
  });

  it('createNotification does not throw when socket is not set', async () => {
    const payload = {
      recipient: 'bob',
      kind: 'system' as const,
    };

    const docObj = { id: '2', recipient: 'bob' };
    const doc = { toObject: jest.fn(() => docObj) };
    MockedNotificationModel.create.mockResolvedValue(doc);

    // Intentionally NOT calling setNotificationSocket here
    const result = await createNotification(payload as any);

    expect(MockedNotificationModel.create).toHaveBeenCalledWith(payload);
    expect(result).toEqual(docObj);
  });

  describe('listNotifications', () => {
    it('lists notifications without cursor', async () => {
      const docs = [
        { toObject: jest.fn(() => ({ id: '1' })) },
        { toObject: jest.fn(() => ({ id: '2' })) },
      ];

      const limitMock = jest.fn().mockResolvedValue(docs);
      const sortMock = jest.fn().mockReturnValue({ limit: limitMock });
      MockedNotificationModel.find.mockReturnValue({ sort: sortMock });

      const result = await listNotifications('alice', 10);

      expect(MockedNotificationModel.find).toHaveBeenCalledWith({
        recipient: 'alice',
      });
      expect(sortMock).toHaveBeenCalledWith({ createdAt: -1 });
      expect(limitMock).toHaveBeenCalledWith(10);
      expect(result).toEqual([{ id: '1' }, { id: '2' }]);
    });

    it('lists notifications with cursor', async () => {
      const cursor = '2023-01-01T00:00:00.000Z';
      const docs = [{ toObject: jest.fn(() => ({ id: '3' })) }];

      const limitMock = jest.fn().mockResolvedValue(docs);
      const sortMock = jest.fn().mockReturnValue({ limit: limitMock });
      MockedNotificationModel.find.mockReturnValue({ sort: sortMock });

      const result = await listNotifications('bob', 5, cursor);

      const query = MockedNotificationModel.find.mock.calls[0][0];
      expect(query.recipient).toBe('bob');
      expect(query.createdAt.$lt).toBeInstanceOf(Date);
      expect(query.createdAt.$lt.toISOString()).toBe(cursor);

      expect(result).toEqual([{ id: '3' }]);
    });

    it('defaults the limit when not provided', async () => {
      const docs = [{ toObject: jest.fn(() => ({ id: '4' })) }];

      const limitMock = jest.fn().mockResolvedValue(docs);
      const sortMock = jest.fn().mockReturnValue({ limit: limitMock });
      MockedNotificationModel.find.mockReturnValue({ sort: sortMock });

      const result = await listNotifications('charlie');

      expect(MockedNotificationModel.find).toHaveBeenCalledWith({
        recipient: 'charlie',
      });
      expect(limitMock).toHaveBeenCalledWith(20); // default limit
      expect(result).toEqual([{ id: '4' }]);
    });
  });

  describe('markRead', () => {
    it('marks a notification as read and returns updated doc', async () => {
      const updated = { _id: 'n1', isRead: true };
      MockedNotificationModel.findByIdAndUpdate.mockResolvedValue(updated);

      const result = await markRead('n1');

      expect(MockedNotificationModel.findByIdAndUpdate).toHaveBeenCalledTimes(1);
      const [id, update, options] = MockedNotificationModel.findByIdAndUpdate.mock.calls[0];

      expect(id).toBe('n1');
      expect(update.isRead).toBe(true);
      expect(update.readAt).toBeInstanceOf(Date);
      expect(options).toEqual({ new: true });

      expect(result).toBe(updated); // correct return type: updated doc
    });
  });

  describe('markAllRead', () => {
    it('marks all notifications as read for a user and returns { ok: true }', async () => {
      MockedNotificationModel.updateMany.mockResolvedValue({ modifiedCount: 3 });

      const result = await markAllRead('carol');

      expect(MockedNotificationModel.updateMany).toHaveBeenCalledTimes(1);
      const [filter, update] = MockedNotificationModel.updateMany.mock.calls[0];

      expect(filter).toEqual({ recipient: 'carol', isRead: false });
      expect(update.isRead).toBe(true);
      expect(update.readAt).toBeInstanceOf(Date);

      expect(result).toEqual({ ok: true });
    });
  });

  describe('deleteNotification', () => {
    it('deletes a notification and returns { ok: true }', async () => {
      MockedNotificationModel.findByIdAndDelete.mockResolvedValue({});

      const result = await deleteNotification('del-1');

      expect(MockedNotificationModel.findByIdAndDelete).toHaveBeenCalledWith('del-1');
      expect(result).toEqual({ ok: true });
    });
  });
});
