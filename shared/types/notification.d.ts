/**
 * Payload when notifying about a new chat message or mention.
 */
export interface ChatNotificationPayload {
  toEmail: string[];
  toName?: string;
  fromName?: string;
  chatId?: string | number;
  messagePreview: string;
  groupName?: string; // might be useful in group chats and community chats
  isMention?: boolean; // could allow for extra customization in the future
}

/**
 * Payload when notifying about a new answer or activity on an answer.
 */
export interface AnswerNotificationPayload {
  toEmail: string[];
  authorName?: string;
  questionTitle?: string;
  answerPreview: string;
  questionId: string;
  extra?: {
    voteCount?: number;
    commentPreview?: string;
  };
}

export interface EmailVerificationPayload{
  toEmail: string;
  username: string;
  token: string;
  verifyUrl: string;
  expiresAt: Date;
}

export interface PasswordResetPayload {
  toEmail: string;
  username: string;
  resetUrl: string;
  expiresAt: Date;
}
