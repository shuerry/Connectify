import './index.css';
import useMessagingPage from '../../../hooks/useMessagingPage';
import MessageCard from '../messageCard';

/**
 * Represents the MessagingPage component which displays the public chat room.
 * and provides functionality to send and receive messages.
 */
const MessagingPage = () => {
  const { messages, newMessage, setNewMessage, handleSendMessage, error, typingUsers } = useMessagingPage();

  const typingUsersArray = Array.from(typingUsers);
  const typingText = typingUsersArray.length > 0 
    ? typingUsersArray.length === 1
      ? `${typingUsersArray[0]} is typing...`
      : `${typingUsersArray.length} people are typing...`
    : null;

  return (
    <div className='chat-room'>
      <div className='chat-header'>
        <h2>Chat Room</h2>
      </div>
      <div className='chat-messages'>
        {messages.map(message => (
          <MessageCard key={String(message._id)} message={message} />
        ))}
        {typingText && (
          <div className='typing-indicator' style={{ 
            padding: '8px 16px', 
            fontStyle: 'italic', 
            color: '#666',
            fontSize: '0.9em'
          }}>
            {typingText}
          </div>
        )}
      </div>
      <div className='message-input'>
        <textarea
          className='message-textbox'
          placeholder='Type your message here'
          value={newMessage}
          onChange={e => setNewMessage(e.target.value)}
        />
        <div className='message-actions'>
          <button type='button' className='send-button' onClick={handleSendMessage}>
            Send
          </button>
          {error && <span className='error-message'>{error}</span>}
        </div>
      </div>
    </div>
  );
};

export default MessagingPage;
