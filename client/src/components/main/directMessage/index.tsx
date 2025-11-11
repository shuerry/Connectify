import './index.css';
import useDirectMessage from '../../../hooks/useDirectMessage';
import UsersListPage from '../usersListPage';
import MessageCard from '../messageCard';
import NotifComponent from '../notifComponent';
import ChatsListCard from './chatsListCard';
import useUserContext from '../../../hooks/useUserContext';

/**
 * DirectMessage component renders a page for direct messaging between users.
 * It includes a list of users and a chat window to send and receive messages.
 */
const DirectMessage = () => {
  const { user } = useUserContext();
  const {
    selectedChat,
    chats,
    messages,
    handleChatSelect,
    newMessage,
    setNewMessage,
    showCreatePanel,
    setShowCreatePanel,
    handleSendMessage,
    handleUserSelect,
    handleCreateChat,
    chatToCreate,
    refreshChat,
    error,
    typingUsers,
  } = useDirectMessage();

  // Get the other participant's username (excluding current user)
  const otherParticipant = selectedChat
    ? Object.keys(selectedChat.participants).find(username => username !== user.username)
    : null;

  // Find the latest message sent by the current user
  const latestSentMessage = messages
    .filter(msg => msg.msgFrom === user.username && msg.type === 'direct')
    .sort((a, b) => new Date(b.msgDateTime).getTime() - new Date(a.msgDateTime).getTime())[0];

  // Get typing indicator text
  const typingUsersArray = Array.from(typingUsers);
  const typingText = typingUsersArray.length > 0 
    ? typingUsersArray.length === 1
      ? `${typingUsersArray[0]} is typing...`
      : `${typingUsersArray.length} people are typing...`
    : null;

  return (
    <>
      <div className='create-panel'>
        <button
          className='custom-button'
          onClick={() => setShowCreatePanel(prevState => !prevState)}>
          {showCreatePanel ? 'Hide User Selection' : 'Start a Chat'}
        </button>
        {error && <div className='direct-message-error'>{error}</div>}
        {showCreatePanel && (
          <>
            <p>Selected user: {chatToCreate}</p>
            <button className='custom-button' onClick={handleCreateChat}>
              Create Chat
            </button>
            <UsersListPage handleUserSelect={handleUserSelect} />
          </>
        )}
      </div>
      <div className='direct-message-container'>
      <div className='chats-list'>
          {chats.map(chat => (
            <ChatsListCard key={String(chat._id)} chat={chat} handleChatSelect={handleChatSelect} />
          ))}
        </div>
        <div className='chat-container'>
          {selectedChat && otherParticipant ? (
            <>
              <div className='chat-header'>
                <h2>Chat Participants: {Object.keys(selectedChat.participants).join(', ')}</h2>
                <NotifComponent chat={selectedChat} />
              </div>
              <div className='chat-messages'>
                {messages.map((message) => (
                  <MessageCard
                    key={String(message._id)}
                    message={message}
                    onMessageUpdate={refreshChat}
                    isLatestSentMessage={
                      latestSentMessage ? String(message._id) === String(latestSentMessage._id) : false
                    }
                    otherParticipant={otherParticipant}
                  />
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
                <input
                  className='custom-input'
                  type='text'
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  placeholder='Type a message...'
                />
                <button className='custom-button' onClick={handleSendMessage}>
                  Send
                </button>
              </div>
            </>
          ) : (
            <h2>Select a chat to start messaging</h2>
          )}
        </div>
      </div>
    </>
  );
};

export default DirectMessage;
