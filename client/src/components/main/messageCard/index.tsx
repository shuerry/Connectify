import { useEffect, useState } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useNavigate } from 'react-router-dom';
import './index.css';
import { DatabaseMessage } from '../../../types/types';
import { getMetaData } from '../../../tool';
import useUserContext from '../../../hooks/useUserContext';
import {
  respondToFriendRequest,
  respondToGameInvitation,
  editMessage,
  deleteMessage,
} from '../../../services/messageService';
import logger from '../../../utils/logger';

/**
 * MessageCard component displays a single message with its sender and timestamp.
 * For friend requests, it also shows accept/decline buttons.
 *
 * @param message: The message object to display.
 * @param onMessageUpdate: Callback function to refresh messages after friend request response.
 */
const MessageCard = ({
  message,
  onMessageUpdate,
  isLatestSentMessage = false,
  otherParticipant = null,
  allParticipants = null,
}: {
  message: DatabaseMessage;
  onMessageUpdate?: () => void;
  isLatestSentMessage?: boolean;
  otherParticipant?: string | null;
  allParticipants?: string[] | null;
}) => {
  const { user: currentUser } = useUserContext();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [draftMessage, setDraftMessage] = useState(message.msg);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    setDraftMessage(message.msg);
    setIsEditing(false);
    setActionError(null);
  }, [message._id, message.msg]);

  const messageId = message._id.toString();
  const isSentByCurrentUser = message.msgFrom === currentUser.username;
  const isCurrentUser = isSentByCurrentUser;
  const canModifyMessage =
    isCurrentUser && (message.type === 'direct' || message.type === 'global');

  const historyEntries = message.editHistory ?? [];
  const hasHistory = historyEntries.length > 0;
  const displayedBody = message.msg;

  let isRead = false;
  if (isLatestSentMessage && isSentByCurrentUser) {
    if (allParticipants && allParticipants.length > 2) {
      const participantsToRead = allParticipants.filter(p => p !== message.msgFrom);
      isRead =
        !!message.readBy &&
        participantsToRead.length > 0 &&
        participantsToRead.every(participant => message.readBy?.includes(participant));
    } else if (otherParticipant) {
      isRead = !!(message.readBy && message.readBy.includes(otherParticipant));
    }
  }

  const handleFriendRequestResponse = async (status: 'accepted' | 'declined') => {
    try {
      await respondToFriendRequest(messageId, status, currentUser.username);
      onMessageUpdate?.();
    } catch (error) {
      throw new Error('Failed to respond to friend request');
    }
  };

  const handleGameInvitationResponse = async (status: 'accepted' | 'declined') => {
    try {
      await respondToGameInvitation(messageId, status, currentUser.username);

      if (status === 'accepted' && message.gameInvitation) {
        try {
          if (message.gameInvitation.roomCode) {
            await navigator.clipboard.writeText(message.gameInvitation.roomCode);
            alert(
              `Room code "${message.gameInvitation.roomCode}" copied to clipboard! You can now join the game on the Connect Four page.`,
            );
          } else {
            alert('Redirecting to Connect Four page. Look for the room in the public games list.');
          }

          try {
            localStorage.setItem(
              'connectfour_pending_invitation',
              JSON.stringify({
                gameID: message.gameInvitation.gameID,
                roomCode: message.gameInvitation.roomCode,
                roomName: message.gameInvitation.roomName,
                inviterUsername: message.msgFrom,
              }),
            );
          } catch (storageError) {
            logger.error('Failed to save invitation details:', storageError);
          }

          navigate('/games/connectfour');
        } catch (error) {
          logger.error('Error handling game invitation:', error);
          navigate('/games/connectfour');
        }
      }

      onMessageUpdate?.();
    } catch (error) {
      logger.error('Error responding to game invitation:', error);
    }
  };

  const handleSaveEdit = async () => {
    if (!draftMessage.trim()) {
      setActionError('Message cannot be empty');
      return;
    }

    try {
      setIsSaving(true);
      await editMessage(messageId, currentUser.username, draftMessage);
      setIsEditing(false);
      setActionError(null);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to edit message';
      setActionError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteMessage = async () => {
    if (!canModifyMessage) return;
    const confirmed = window.confirm('Delete this message? This action cannot be undone.');
    if (!confirmed) {
      return;
    }

    try {
      setIsDeleting(true);
      await deleteMessage(messageId, currentUser.username);
      setActionError(null);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete message';
      setActionError(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className={`message ${isCurrentUser ? 'sender' : 'receiver'}`}>
      <div className='message-header'>
        <div className='message-sender'>{message.msgFrom}</div>
        <div className='message-time'>
          {getMetaData(new Date(message.msgDateTime))}
          {message.lastEditedAt && (
            <span
              className='message-edited-pill'
              title={`Edited ${getMetaData(new Date(message.lastEditedAt))}`}>
              Edited
            </span>
          )}
        </div>
      </div>
      <div className='message-body'>
        {actionError && <div className='message-inline-error'>{actionError}</div>}

        {isEditing ? (
          <div className='message-edit-form'>
            <textarea
              className='message-edit-textarea'
              value={draftMessage}
              onChange={e => setDraftMessage(e.target.value)}
              rows={3}
            />
            <div className='message-edit-controls'>
              <button className='message-action-btn' onClick={handleSaveEdit} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save'}
              </button>
              <button
                className='message-action-btn secondary'
                onClick={() => {
                  setIsEditing(false);
                  setDraftMessage(message.msg);
                  setActionError(null);
                }}>
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <Markdown remarkPlugins={[remarkGfm]}>{displayedBody}</Markdown>
            {(canModifyMessage && !isEditing) || (hasHistory && !isEditing) ? (
              <div className='message-body-controls'>
                {canModifyMessage && !isEditing && (
                  <div className='message-actions'>
                    <button
                      className='message-action-btn'
                      onClick={() => {
                        setDraftMessage(message.msg);
                        setIsEditing(true);
                        setActionError(null);
                      }}>
                      Edit
                    </button>
                    <button
                      className='message-action-btn destructive'
                      onClick={handleDeleteMessage}
                      disabled={isDeleting}>
                      {isDeleting ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                )}
                {hasHistory && !isEditing && (
                  <div className='message-history-buttons'>
                    <button
                      className='message-history-toggle'
                      type='button'
                      onClick={() => setIsHistoryOpen(prev => !prev)}>
                      {isHistoryOpen
                        ? 'Hide edit history'
                        : `View edit history (${historyEntries.length})`}
                    </button>
                  </div>
                )}
              </div>
            ) : null}
          </>
        )}

        {message.type === 'friendRequest' && message.msgTo === currentUser.username && (
          <div className='friend-request-actions'>
            {message.friendRequestStatus === 'pending' && (
              <>
                <button
                  className='accept-button'
                  onClick={() => handleFriendRequestResponse('accepted')}>
                  Accept
                </button>
                <button
                  className='decline-button'
                  onClick={() => handleFriendRequestResponse('declined')}>
                  Decline
                </button>
              </>
            )}
            {message.friendRequestStatus === 'accepted' && (
              <span className='friend-request-status accepted'>✓ Accepted</span>
            )}
            {message.friendRequestStatus === 'declined' && (
              <span className='friend-request-status declined'>✗ Declined</span>
            )}
          </div>
        )}
        {message.type === 'gameInvitation' && message.msgTo === currentUser.username && (
          <div className='game-invitation-actions'>
            {message.gameInvitation?.status === 'pending' && (
              <>
                <button
                  className='accept-button game-accept'
                  onClick={() => handleGameInvitationResponse('accepted')}>
                  {message.gameInvitation?.roomCode ? 'Copy Code & Go' : 'Go to Game'}
                </button>
                <button
                  className='decline-button game-decline'
                  onClick={() => handleGameInvitationResponse('declined')}>
                  Decline
                </button>
              </>
            )}
            {message.gameInvitation?.status === 'accepted' && (
              <span className='game-invitation-status accepted'> Joined Game</span>
            )}
            {message.gameInvitation?.status === 'declined' && (
              <span className='game-invitation-status declined'> Declined</span>
            )}
            {message.gameInvitation?.status === 'expired' && (
              <span className='game-invitation-status expired'> Expired</span>
            )}
          </div>
        )}

        {hasHistory && isHistoryOpen && (
          <div className='message-history-panel'>
            {historyEntries
              .map((entry, index) => ({ entry, index }))
              .reverse()
              .map(({ entry, index }) => (
                <div className='history-entry' key={`${messageId}-${entry.editedAt}-${index}`}>
                  <div className='history-entry-meta'>
                    <span className='history-entry-author'>{entry.editedBy}</span>
                    <time>{getMetaData(new Date(entry.editedAt))}</time>
                  </div>
                  <div className='history-entry-content'>
                    <Markdown remarkPlugins={[remarkGfm]}>{entry.body}</Markdown>
                  </div>
                </div>
              ))}
          </div>
        )}

        {isLatestSentMessage && isSentByCurrentUser && (
          <div className='read-receipt'>
            {allParticipants && allParticipants.length > 2
              ? (() => {
                  const participantsToRead = allParticipants.filter(p => p !== message.msgFrom);
                  const readCount = message.readBy
                    ? message.readBy.filter(reader => participantsToRead.includes(reader)).length
                    : 0;
                  const totalCount = participantsToRead.length;
                  if (isRead) {
                    return 'Read by all';
                  } else if (readCount > 0) {
                    return `Read by ${readCount}/${totalCount}`;
                  }
                  return 'Delivered';
                })()
              : isRead
                ? 'Read'
                : 'Delivered'}
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageCard;
