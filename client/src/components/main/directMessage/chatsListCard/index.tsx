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
  const otherParticipant = chat
    ? Object.keys(chat.participants).find(username => username !== user.username)
    : null;

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
