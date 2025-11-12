import nodemailer from 'nodemailer';
import { ChatNotificationPayload, AnswerNotificationPayload } from '../types/types';
import type { EmailVerificationPayload } from '../types/types';
import NotificationModel from '../models/notification.model';

type Maybe<T> = T | undefined;

export class NotificationService {
  private _transporter: Maybe<nodemailer.Transporter>;
  private _fromEmail: string;
  private _siteUrl: string;

  constructor() {
    const host = process.env.SMTP_HOST;
    const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    this._fromEmail = process.env.FROM_EMAIL || '';
    this._siteUrl = process.env.SITE_URL || 'http://localhost:4530';

    if (host && port && user && pass) {
      this._transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });
    } else {
      this._transporter = undefined;
      //console.warn('SMTP not configured, emails will be logged to console.');
    }
  }

  private async _sendMail(to: string[], subject: string, html: string, text?: string) {
    console.log('Preparing to send email to:', to);
    if (!this._transporter) {
      console.log('Mock email: ', { to, subject, text, html });
      return { ok: true, mock: true };
    }

    const info = await this._transporter.sendMail({
      from: this._fromEmail,
      to,
      subject,
      text,
      html,
    });
    console.log('Email sent: ', info.messageId);
    return { ok: true, info };
  }

  // HTML helpers
  private _escape(s: string = '') {
    return s.replace(
      /[&<>"]/g,
      c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!,
    );
  }

  private _layout({
    title,
    intro,
    body,
    ctaLabel,
    ctaHref,
    footerNote,
  }: {
    title: string;
    intro?: string;
    body?: string;
    ctaLabel?: string;
    ctaHref?: string;
    footerNote?: string;
  }) {
    const button =
      ctaHref && ctaLabel
        ? `
      <table role="presentation" cellspacing="0" cellpadding="0" style="margin:24px 0">
        <tr>
          <td style="background:#3b82f6;border-radius:8px;">
            <a href="${this._escape(ctaHref)}"
               style="display:inline-block;padding:12px 18px;font-size:14px;line-height:20px;color:#ffffff;text-decoration:none;font-weight:600;">
              ${this._escape(ctaLabel)}
            </a>
          </td>
        </tr>
      </table>`
        : '';

    return `
<!doctype html>
<html>
<head>
  <meta name="viewport" content="width=device-width"/>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <title>${this._escape(title)}</title>
</head>
<body style="margin:0;padding:0;background:#f6f8fb;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f6f8fb;">
    <tr>
      <td align="center" style="padding:24px;">
        <table role="presentation" width="100%" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
          <tr>
            <td style="padding:24px 24px 8px 24px;">
              <h1 style="margin:0;font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,'Helvetica Neue',sans-serif;font-size:18px;line-height:26px;color:#111827;">
                ${this._escape(title)}
              </h1>
            </td>
          </tr>
          ${
            intro
              ? `
          <tr>
            <td style="padding:0 24px;">
              <p style="margin:8px 0 0 0;font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,'Helvetica Neue',sans-serif;font-size:14px;line-height:22px;color:#374151;">
                ${intro}
              </p>
            </td>
          </tr>`
              : ''
          }
          ${
            body
              ? `
          <tr>
            <td style="padding:8px 24px 0 24px;">
              <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,'Helvetica Neue',sans-serif;font-size:14px;line-height:22px;color:#111827;">
                ${body}
              </div>
            </td>
          </tr>`
              : ''
          }
          ${
            button
              ? `
          <tr>
            <td style="padding:0 24px 8px 24px;">
              ${button}
            </td>
          </tr>`
              : ''
          }
          <tr>
            <td style="padding:12px 24px 20px 24px;border-top:1px solid #e5e7eb;">
              <p style="margin:0;font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,'Helvetica Neue',sans-serif;font-size:12px;line-height:18px;color:#6b7280;">
                ${footerNote ? this._escape(footerNote) : `Sent by ${this._escape(this._siteUrl)} • Please don’t reply to this automated email.`}
              </p>
            </td>
          </tr>
        </table>
        <div style="height:32px;"></div>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }

  async sendChatNotification(payload: ChatNotificationPayload) {
    const { toEmail, toName, fromName, messagePreview, groupName, isMention, chatId } = payload;
    const subject = isMention
      ? `${fromName ? fromName + ' mentioned you' : 'You were mentioned'} in ${groupName || 'chat'}`
      : `${fromName ? fromName + ' sent a message' : 'New chat message'}${groupName ? ` in ${groupName}` : ''}`;

    const link = chatId ? `${this._siteUrl}/chat/${chatId}` : this._siteUrl;

    const intro = toName ? `Hi ${this._escape(toName)},` : `Hello,`;

    const body = `
      <p style="margin:0 0 8px 0;"><strong>${this._escape(fromName || 'Someone')}</strong> wrote:</p>
      <blockquote style="margin:0;padding:8px 12px;border-left:3px solid #e5e7eb;background:#f9fafb;border-radius:6px;">
        ${this._escape(messagePreview || '')}
      </blockquote>
      ${groupName ? `<p style="margin:12px 0 0 0;">Conversation: <strong>${this._escape(groupName)}</strong></p>` : ''}
    `;

    const html = this._layout({
      title: subject,
      intro,
      body,
      ctaLabel: 'Open chat',
      ctaHref: link,
    });

    const text = `${fromName ? fromName + ' wrote: ' : ''}${messagePreview}\n\nView message: ${link}`;
    return this._sendMail(toEmail, subject, html, text);
  }

  async sendAnswerNotification(payload: AnswerNotificationPayload) {
    const { toEmail, authorName, questionTitle, answerPreview, questionId } = payload;
    const subject = `New answer${questionTitle ? ` — ${questionTitle}` : ''}`;
    const link = `${this._siteUrl}/question/${questionId}`;

    const intro = `Hi,`;
    const body = `
      <p style="margin:0 0 8px 0;">
        <strong>${this._escape(authorName || 'Someone')}</strong> posted a new answer${questionTitle ? ` on <em>${this._escape(questionTitle)}</em>` : ''}:
      </p>
      <blockquote style="margin:0;padding:8px 12px;border-left:3px solid #e5e7eb;background:#f9fafb;border-radius:6px;">
        ${this._escape(answerPreview || '')}
      </blockquote>
      <p style="margin:12px 0 0 0;">Click below to read the full answer and join the discussion.</p>
    `;

    const html = this._layout({
      title: subject,
      intro,
      body,
      ctaLabel: 'View question',
      ctaHref: link,
    });

    const text =
      (authorName ? `${authorName} posted an answer: ` : 'New answer: ') +
      (answerPreview || '') +
      '\n\nView Question: ' +
      link;

    return this._sendMail(toEmail, subject, html, text);
  }

  /**
   * Sends an email verification message.
   * Pass either a full verifyUrl, or a token (I'll build ${this.siteUrl}/verify-email?token=...).
   */
  async sendEmailVerification(payload: EmailVerificationPayload) {
    const { toEmail, username, token, verifyUrl, expiresAt } = payload;
    const link =
      verifyUrl || `${this._siteUrl}/verify-email?token=${encodeURIComponent(token || '')}`;
    const niceExpiry = expiresAt ? new Date(expiresAt).toLocaleString() : undefined;

    const subject = 'Verify your email address';
    const intro = username ? `Hi ${this._escape(username)},` : 'Hi,';
    const body = `
      <p style="margin:0 0 8px 0;">Please confirm that this email belongs to you by clicking the button below.</p>
      ${niceExpiry ? `<p style="margin:8px 0;">This link expires on <strong>${this._escape(niceExpiry)}</strong>.</p>` : ''}
      <p style="margin:8px 0 0 0;">If you didn’t request this, you can safely ignore this email.</p>
    `;

    const html = this._layout({
      title: subject,
      intro,
      body,
      ctaLabel: 'Verify email',
      ctaHref: link,
      footerNote: `Sent by ${this._siteUrl} • Need help? Reply to ${this._fromEmail}`,
    });

    const text =
      `Verify your email address` +
      (username ? `, ${username}` : '') +
      `\n\nClick the link: ${link}` +
      (niceExpiry ? `\nThis link expires on ${niceExpiry}.` : '') +
      `\n\nIf you didn’t request this, ignore this email.`;

    return this._sendMail(Array.isArray(toEmail) ? toEmail : [toEmail], subject, html, text);
  }
}

export const createNotification = async (payload: {
  recipient: string;
  kind: 'answer' | 'chat' | 'system';
  title?: string;
  preview?: string;
  link?: string;
  actorUsername?: string;
  meta?: Record<string, unknown>;
}) => {
  const n = await NotificationModel.create(payload);
  return n.toObject();
};

export const listNotifications = async (username: string, limit = 20, cursor?: string) => {
  const query: Record<string, unknown> = { recipient: username };
  if (cursor) query.createdAt = { $lt: new Date(cursor) };
  const docs = await NotificationModel.find(query).sort({ createdAt: -1 }).limit(limit);
  return docs.map(d => d.toObject());
};

export const markRead = async (id: string) => {
  return NotificationModel.findByIdAndUpdate(
    id,
    { isRead: true, readAt: new Date() },
    { new: true },
  );
};

export const markAllRead = async (username: string) => {
  await NotificationModel.updateMany(
    { recipient: username, isRead: false },
    { isRead: true, readAt: new Date() },
  );
  return { ok: true };
};

export const deleteNotification = async (id: string) => {
  await NotificationModel.findByIdAndDelete(id);
  return { ok: true };
};
