import UserModel from '../models/users.model';
import { NotificationService } from '../services/notification.service';
import { generateVerificationToken, hashToken } from '../utils/crypto.util';

const notifier = new NotificationService();

const VERIF_MINUTES = Number(process.env.EMAIL_VERIFY_TTL_MIN || 60); // 60m default

/**
 * Kicks off a verification for a new email on a given username.
 * - Stores a hashed token & expiry on the user doc (server-only)
 * - Sends the email with a one-time link
 */
export async function startEmailVerification(username: string, newEmail: string) {
  // 1) create token (plaintext only used to email the user)
  const token = generateVerificationToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + VERIF_MINUTES * 60_000);

  // 2) write to the user doc (pendingEmail so the current email remains intact until verification)
  const updated = await UserModel.findOneAndUpdate(
    { username },
    {
      $set: {
        emailVerified: false,
        emailVerification: { pendingEmail: newEmail, tokenHash, expiresAt },
      },
    },
    { new: true, projection: { username: 1, email: 1 } },
  );

  if (!updated) {
    return { error: 'User not found' as const };
  }

  // 3) build verification link and send
  const site = process.env.SITE_URL || 'http://localhost:4530';
  const verifyUrl = `${site}/verify-email?token=${encodeURIComponent(token)}`;
  await notifier.sendEmailVerification({
    toEmail: newEmail,
    username,
    token, // sent only via email; never stored plaintext
    verifyUrl, // used to build the nice button
    expiresAt,
  });

  return { ok: true as const };
}

/**
 * Confirms verification using a token from the email link.
 * - Looks up the user by hashed token
 * - If valid & not expired, commits pendingEmail -> email, sets emailVerified:true and clears the verification block
 */
export async function confirmEmailVerification(token: string) {
  const tokenHash = hashToken(token);

  // Find a user whose emailVerification matches the token and is not expired
  const user = await UserModel.findOne({
    'emailVerification.tokenHash': tokenHash,
    'emailVerification.expiresAt': { $gt: new Date() },
  });

  if (!user?.emailVerification?.pendingEmail) {
    return { error: 'Invalid or expired token' as const };
  }

  const newEmail = user.emailVerification.pendingEmail;

  // Commit the new email & mark verified; clear the verification object
  user.email = newEmail;
  user.emailVerified = true;
  user.emailVerification = undefined;

  await user.save();
  return { ok: true as const, email: newEmail };
}
