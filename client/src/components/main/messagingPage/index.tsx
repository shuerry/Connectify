import './index.css';
import useMessagingPage from '../../../hooks/useMessagingPage';
import MessageCard from '../messageCard';
import ProfanityFilterModal from '../newQuestion/profanityFilterModal';

/**
 * Represents the MessagingPage component which displays the public chat room.
 * Modern design with improved UX and visual hierarchy.
 */
const MessagingPage = () => {
  const {
    messages,
    newMessage,
    setNewMessage,
    handleSendMessage,
    error,
    typingUsers,
    isFilterModalOpen,
    setIsFilterModalOpen,
    filterReason,
  } = useMessagingPage();

  const typingUsersArray = Array.from(typingUsers);
  const typingText =
    typingUsersArray.length > 0
      ? typingUsersArray.length === 1
        ? `${typingUsersArray[0]} is typing...`
        : `${typingUsersArray.length} people are typing...`
      : null;

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className='modern-chat-room'>
      {/* Header */}
      <div className='modern-chat-header'>
        <div className='header-content'>
          <div className='header-title'>
            <div className='chat-icon'>
              <svg width='24' height='24' viewBox='0 0 24 24' fill='currentColor'>
                <path
                  d='M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z'
                  stroke='currentColor'
                  strokeWidth='2'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  fill='none'
                />
              </svg>
            </div>
            <div className='header-text'>
              <h1>Global Chat</h1>
              <p>
                {messages.length} messages{typingText ? ` • ${typingText}` : ''}
              </p>
            </div>
          </div>
          <div className='header-actions'>
            <button className='header-btn' title='Chat settings'>
              <svg width='20' height='20' viewBox='0 0 24 24' fill='none'>
                <circle cx='12' cy='12' r='3' stroke='currentColor' strokeWidth='2' />
                <path d='M12 1v6m0 6v6m11-7h-6m-6 0H1' stroke='currentColor' strokeWidth='2' />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className='modern-chat-messages'>
        <div className='messages-container'>
          {messages.length === 0 ? (
            <div className='empty-chat'>
              <div className='empty-icon'>
                <svg width='48' height='48' viewBox='0 0 24 24' fill='none'>
                  <path
                    d='M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z'
                    stroke='currentColor'
                    strokeWidth='2'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                  />
                </svg>
              </div>
              <h3>Welcome to Global Chat!</h3>
              <p>Start a conversation with the community</p>
            </div>
          ) : (
            messages.map(message => <MessageCard key={String(message._id)} message={message} />)
          )}

          {typingText && (
            <div className='modern-typing-indicator'>
              <div className='typing-avatar'>
                <div className='typing-dots'>
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
              <div className='typing-text'>{typingText}</div>
            </div>
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className='modern-message-input'>
        {error && (
          <div className='modern-error-message'>
            <svg width='16' height='16' viewBox='0 0 24 24' fill='currentColor'>
              <path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z' />
            </svg>
            {error}
          </div>
        )}
        <div className='input-container'>
          <div className='input-wrapper'>
            <textarea
              className='modern-message-textbox'
              placeholder='Type a message...'
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              rows={1}
            />
            <button
              type='button'
              className={`modern-send-button ${newMessage.trim() ? 'active' : ''}`}
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}>
              <svg width='20' height='20' viewBox='0 0 24 24' fill='currentColor'>
                <path d='M2.01 21L23 12 2.01 3 2 10l15 2-15 2z' />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {isFilterModalOpen && (
        <ProfanityFilterModal reason={filterReason} onClose={() => setIsFilterModalOpen(false)} />
      )}
    </div>
  );
};

export default MessagingPage;
