import './index.css';
import { ObjectId } from 'mongodb';
import { PopulatedDatabaseChat } from '../../../../types/types';
import useUserContext from '../../../../hooks/useUserContext';

/**
 * ChatsListCard component displays information about a chat and allows the user to select it.
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
  const otherParticipant = chat
    ? Object.keys(chat.participants).find(username => username !== user.username)
    : null;

  const hasUnread = chat.messages?.some(
    m =>
      m.msgFrom !== user.username &&
      (!m.readBy || !m.readBy.includes(user.username)),
  );

  return (
    <div
      onClick={() => handleChatSelect(chat._id)}
      className={`chats-list-card ${hasUnread ? 'chats-list-card--unread' : ''}`}
    >
      <div className="chats-list-card-header">
        <p>
          <strong>Chat with:</strong> {otherParticipant}
        </p>
        {hasUnread && (
          <span
            className="chats-list-card__unread-dot"
            aria-label="Unread messages"
          />
        )}
      </div>
    </div>
  );
};

export default ChatsListCard;
