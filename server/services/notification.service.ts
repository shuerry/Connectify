import nodemailer from 'nodemailer';
import { ChatNotificationPayload, AnswerNotificationPayload } from '../types/types';

type Maybe<T> = T | undefined;

/**
 * Simple email notification service used by chat & answer modules.
 * - Reads SMTP config from .env
 * - Falls back to console logging when SMTP not configured (for now, useful for dev)
 *
 * Env:
 *  SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, FROM_EMAIL, SITE_URL
 */
export default class NotificationService {
    private transporter: Maybe<nodemailer.Transporter>;
    private fromEmail: string;
    private siteUrl: string;

    constructor() {
        const host = process.env.SMTP_HOST;
        const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined;
        const user = process.env.SMTP_USER;
        const pass = process.env.SMTP_PASS;
        this.fromEmail = process.env.FROM_EMAIL || "no-reply@example.com";
        this.siteUrl = process.env.SITE_URL || "http://localhost:4530";

        if (host && port && user && pass) {
            this.transporter = nodemailer.createTransport({
                host,
                port,
                secure: port === 465,
                auth: { user, pass },
            });
        } else {
            this.transporter = undefined;
            console.warn(
                "SMTP not configured, emails will be logged to console."
            );
        }
    }

    private async sendMail(to: string[], subject: string, html: string, text?: string) {
        if (!this.transporter) {
            console.log("Mock email: ", { to, subject, text, html });
            return { ok: true, mock: true };
        }

        const info = await this.transporter.sendMail({
            from: this.fromEmail,
            to,
            subject,
            text: text,
            html,
        });
        return { ok: true, info };
    }

    /**
     * Send a notification for a chat message.
     * Used when a user is mentioned or receives a DM.
     */
    async sendChatNotification(payload: ChatNotificationPayload) {
        const { toEmail, toName, fromName, messagePreview, groupName: groupName, isMention } = payload;
        const subject = isMention
            ? `${fromName ? fromName + " mentioned you" : "You were mentioned"} in ${groupName || "chat"}`
            : `${fromName ? fromName + " sent a message" : "New chat message"}${groupName ? ` in ${groupName}` : ""}`;

        const link = (payload.chatId ? `${this.siteUrl}/chat/${payload.chatId}` : this.siteUrl);

        const html = `simple for now`;

        const text = `${fromName ? fromName + " wrote: " : ""}${messagePreview}\n\nView message: ${link}`;
        return this.sendMail(toEmail, subject, html, text);
    }

    /**
     * Send a notification when a new answer is added to a question.
     */
    async sendAnswerNotification(payload: AnswerNotificationPayload) {
        const { toEmail, authorName, questionTitle, answerPreview, answerUrl, extra } = payload;

        let subject: string;
        subject = `New answer${questionTitle ? ` — ${questionTitle}` : ""}`;

        const link = answerUrl || (payload.answerId ? `${this.siteUrl}/questions/answers/${payload.answerId}` : this.siteUrl);

        const html = 'test email with minimal formatting';

        const text = (authorName ? authorName + ' posted an answer: ' : 'New answer: ') + answerPreview + '\n\nView: ' + link;

        return this.sendMail(toEmail, subject, html, text);
    }
}