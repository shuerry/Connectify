import UserModel from '../models/users.model';
import { NotificationService } from '../services/notification.service';
import { generateVerificationToken, hashToken } from '../utils/crypto.util';

const notifier = new NotificationService();

const RESET_MINUTES = Number(process.env.PASSWORD_RESET_TTL_MIN || 30); // 30 minutes default

/**
 * Initiates a password reset request by generating a token and sending an email.
 */
export async function requestPasswordReset(usernameOrEmail: string) {
  // Find user by username or email
  const user = await UserModel.findOne({
    $or: [{ username: usernameOrEmail }, { email: usernameOrEmail }],
  });

  if (!user || !user.email) {
    // For security, don't reveal if user exists or has no email
    return { ok: true as const };
  }

  // Generate reset token
  const token = generateVerificationToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + RESET_MINUTES * 60_000);

  // Store reset token on user document
  await UserModel.findOneAndUpdate(
    { _id: user._id },
    {
      $set: {
        passwordReset: { tokenHash, expiresAt },
      },
    },
  );

  // Build reset link and send email
  const site = process.env.SITE_URL || 'http://localhost:4530';
  const resetUrl = `${site}/reset-password?token=${encodeURIComponent(token)}`;

  await notifier.sendPasswordReset({
    toEmail: user.email as string, // We've already checked it exists above
    username: user.username,
    resetUrl,
    expiresAt,
  });

  return { ok: true as const };
}

/**
 * Confirms password reset using a token and sets the new password.
 */
export async function confirmPasswordReset(token: string, newPassword: string) {
  const tokenHash = hashToken(token);

  // Find user with valid reset token
  const user = await UserModel.findOne({
    'passwordReset.tokenHash': tokenHash,
    'passwordReset.expiresAt': { $gt: new Date() },
  });

  if (!user) {
    return { error: 'Invalid or expired reset token' as const };
  }

  // Update password and clear reset token
  user.password = newPassword; // This will be hashed by the pre-save middleware
  user.passwordReset = undefined;

  await user.save();

  return { ok: true as const };
}
