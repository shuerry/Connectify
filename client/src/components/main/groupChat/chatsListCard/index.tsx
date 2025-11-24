import './index.css';
import { ObjectId } from 'mongodb';
import { PopulatedDatabaseChat } from '../../../../types/types';
import useUserContext from '../../../../hooks/useUserContext';

/**
 * ChatsListCard component displays information about a group chat and allows the user to select it.
 *
 * @param chat: The chat object containing details like participants and chat ID.
 * @param handleChatSelect: A function to handle the selection of a chat, receiving the chat's ID as an argument.
 */
const ChatsListCard = ({
  chat,
  handleChatSelect,
}: {
  chat: PopulatedDatabaseChat;
  handleChatSelect: (chatID: ObjectId | undefined) => void;
}) => {
  const { user } = useUserContext();
  const participants = Object.keys(chat.participants);
  const isCommunityChat = chat.isCommunityChat || false;

  const getChatDisplayName = () => {
    if (chat.name) {
      return chat.name;
    }
    return `${participants.length} participants`;
  };

  const hasUnread = chat.messages?.some(
    m => m.msgFrom !== user.username && (!m.readBy || !m.readBy.includes(user.username)),
  );

  return (
    <div
      onClick={() => handleChatSelect(chat._id)}
      className={`chats-list-card ${hasUnread ? 'chats-list-card--unread' : ''}`}>
      <div className='chat-card-content'>
        <div className={`group-chat-icon ${isCommunityChat ? 'community-icon' : ''}`}>
          <svg width='16' height='16' viewBox='0 0 24 24' fill='none'>
            <path
              d='M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75M13 7a4 4 0 11-8 0 4 4 0 018 0z'
              stroke='currentColor'
              strokeWidth='2'
              strokeLinecap='round'
              strokeLinejoin='round'
            />
          </svg>
        </div>
        <div className='chat-card-info'>
          <p className='chat-card-title'>{getChatDisplayName()}</p>
          {isCommunityChat && <p className='chat-card-badge'>Community</p>}
          {!chat.name && (
            <p className='chat-card-subtitle'>
              {participants
                .filter(p => p !== user.username)
                .slice(0, 3)
                .join(', ')}
              {participants.length > 4 && ` +${participants.length - 4} more`}
            </p>
          )}
        </div>
        {hasUnread && <span className='chats-list-card__unread-dot' aria-label='Unread messages' />}
      </div>
    </div>
  );
};

export default ChatsListCard;
