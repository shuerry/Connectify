import './index.css';
import { ObjectId } from 'mongodb';
import { PopulatedDatabaseChat, SafeDatabaseUser } from '../../../../types/types';
import useUserContext from '../../../../hooks/useUserContext';
import Avatar from '../../../common/Avatar/Avatar';

/**
 * ChatsListCard component displays information about a chat and allows the user to select it.
 *
 * @param chat: The chat object containing details like participants and chat ID.
 * @param handleChatSelect: A function to handle the selection of a chat, receiving the chat's ID as an argument.
 * @param participantUser: The user data for the other participant (optional, for showing online status).
 */
const ChatsListCard = ({
  chat,
  handleChatSelect,
  participantUser,
}: {
  chat: PopulatedDatabaseChat;
  handleChatSelect: (chatID: ObjectId | undefined) => void;
  participantUser?: SafeDatabaseUser | null;
}) => {
  const { user } = useUserContext();
  const participants = Object.keys(chat.participants);
  const isGroupChat = participants.length > 2;

  const getChatDisplayName = () => {
    if (chat.name) {
      return chat.name;
    }
    if (isGroupChat) {
      const otherParticipants = participants.filter(p => p !== user.username);
      if (otherParticipants.length === 1) {
        return otherParticipants[0];
      }
      return `${otherParticipants.length} participants`;
    }
    // Direct message
    const otherParticipant = participants.find(p => p !== user.username);
    return otherParticipant || 'Unknown';
  };

  const hasUnread = chat.messages?.some(
    m => m.msgFrom !== user.username && (!m.readBy || !m.readBy.includes(user.username)),
  );

  return (
    <div
      onClick={() => handleChatSelect(chat._id)}
      className={`chats-list-card ${hasUnread ? 'chats-list-card--unread' : ''}`}>
      <div className='chats-list-card-header'>
        {participantUser && (
          <Avatar
            name={participantUser.username}
            size='sm'
            variant='circle'
            isOnline={participantUser.isOnline}
            showOnlineStatus={participantUser.showOnlineStatus}
            className='chats-list-card-avatar'
          />
        )}
        <p>
          <strong>Chat with:</strong> {otherParticipant}
        </p>
        {hasUnread && <span className='chats-list-card__unread-dot' aria-label='Unread messages' />}
      </div>
    </div>
  );
};

export default ChatsListCard;
