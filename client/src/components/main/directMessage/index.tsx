import React from 'react';
import './index.css';
import useDirectMessage from '../../../hooks/useDirectMessage';
import UsersListPage from '../usersListPage';
import MessageCard from '../messageCard';
import NotifComponent from '../notifyButton';
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
    isGroupChat,
    setIsGroupChat,
    selectedUsersForGroup,
    setSelectedUsersForGroup,
    groupChatName,
    setGroupChatName,
  } = useDirectMessage();

  // Get the other participant's username (excluding current user) or group info
  const participants = selectedChat ? Object.keys(selectedChat.participants) : [];
  const isSelectedGroupChat = participants.length > 2;
  const otherParticipant = !isSelectedGroupChat
    ? participants.find(username => username !== user.username)
    : null;

  const getChatDisplayName = () => {
    if (!selectedChat) return null;
    if (selectedChat.name) return selectedChat.name;
    if (isSelectedGroupChat) {
      const otherParticipants = participants.filter(p => p !== user.username);
      return `${otherParticipants.length} participants`;
    }
    return otherParticipant;
  };

  // Find the latest message sent by the current user
  const latestSentMessage = messages
    .filter(msg => msg.msgFrom === user.username && msg.type === 'direct')
    .sort((a, b) => new Date(b.msgDateTime).getTime() - new Date(a.msgDateTime).getTime())[0];

  // Get typing indicator text
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
    <div className='modern-direct-message'>
      {/* Header with New Chat Button */}
      <div className='dm-header'>
        <div className='dm-header-content'>
          <div className='dm-title'>
            <div className='dm-icon'>
              <svg width='24' height='24' viewBox='0 0 24 24' fill='currentColor'>
                <path
                  d='M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9 7a4 4 0 108 0 4 4 0 00-8 0zM22 11v4M20 13h4'
                  stroke='currentColor'
                  strokeWidth='2'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  fill='none'
                />
              </svg>
            </div>
            <div>
              <h1>Direct Messages</h1>
              <p>{chats.length} conversations</p>
            </div>
          </div>
          <button
            className={`new-chat-btn ${showCreatePanel ? 'active' : ''}`}
            onClick={() => setShowCreatePanel(!showCreatePanel)}>
            <svg width='20' height='20' viewBox='0 0 24 24' fill='none'>
              <path
                d='M12 5v14M5 12h14'
                stroke='currentColor'
                strokeWidth='2'
                strokeLinecap='round'
              />
            </svg>
            New Chat
          </button>
        </div>
      </div>

      {/* Create Chat Panel */}
      {showCreatePanel && (
        <div className='create-chat-panel'>
          <div className='create-chat-header'>
            <h3>Start a New Conversation</h3>
            <button
              className='close-panel-btn'
              onClick={() => {
                setShowCreatePanel(false);
                setIsGroupChat(false);
                setSelectedUsersForGroup(new Set());
                setGroupChatName('');
              }}>
              <svg width='16' height='16' viewBox='0 0 24 24' fill='none'>
                <path
                  d='M18 6L6 18M6 6l12 12'
                  stroke='currentColor'
                  strokeWidth='2'
                  strokeLinecap='round'
                />
              </svg>
            </button>
          </div>

          {/* Chat Type Toggle */}
          <div className='chat-type-toggle'>
            <button
              className={`chat-type-btn ${!isGroupChat ? 'active' : ''}`}
              onClick={() => {
                setIsGroupChat(false);
                setSelectedUsersForGroup(new Set());
                setGroupChatName('');
              }}>
              Direct Message
            </button>
            <button
              className={`chat-type-btn ${isGroupChat ? 'active' : ''}`}
              onClick={() => {
                setIsGroupChat(true);
              }}>
              Group Chat
            </button>
          </div>

          {error && (
            <div className='create-chat-error'>
              <svg width='16' height='16' viewBox='0 0 24 24' fill='currentColor'>
                <path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z' />
              </svg>
              {error}
            </div>
          )}

          {isGroupChat ? (
            <>
              {/* Group Chat Name Input */}
              <div className='group-chat-name-input'>
                <label>Group Chat Name (optional)</label>
                <input
                  type='text'
                  value={groupChatName}
                  onChange={e => setGroupChatName(e.target.value)}
                  placeholder='Enter group name...'
                />
              </div>

              {/* Selected Users for Group Chat */}
              {selectedUsersForGroup.size > 0 && (
                <div className='selected-users-group'>
                  <div className='selected-users-header'>
                    <span>Selected ({selectedUsersForGroup.size}):</span>
                    <button
                      className='clear-selection-btn'
                      onClick={() => setSelectedUsersForGroup(new Set())}>
                      Clear
                    </button>
                  </div>
                  <div className='selected-users-list'>
                    {Array.from(selectedUsersForGroup).map(username => (
                      <div key={username} className='selected-user-tag'>
                        <span>{username}</span>
                        <button
                          onClick={() => {
                            setSelectedUsersForGroup(prev => {
                              const newSet = new Set(prev);
                              newSet.delete(username);
                              return newSet;
                            });
                          }}>
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    className='create-chat-confirm-btn'
                    onClick={handleCreateChat}
                    disabled={selectedUsersForGroup.size === 0}>
                    Create Group Chat
                  </button>
                </div>
              )}
            </>
          ) : (
            chatToCreate && (
              <div className='selected-user'>
                <div className='selected-user-info'>
                  <div className='selected-avatar'>
                    <svg width='16' height='16' viewBox='0 0 24 24' fill='currentColor'>
                      <path
                        d='M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 3a4 4 0 100 8 4 4 0 000-8z'
                        stroke='currentColor'
                        strokeWidth='2'
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        fill='none'
                      />
                    </svg>
                  </div>
                  <span>
                    Selected: <strong>{chatToCreate}</strong>
                  </span>
                </div>
                <button className='create-chat-confirm-btn' onClick={handleCreateChat}>
                  Create Chat
                </button>
              </div>
            )
          )}

          <div className='users-list-container'>
            <UsersListPage handleUserSelect={handleUserSelect} />
          </div>
        </div>
      )}

      {/* Main Chat Interface */}
      <div className='dm-main-container'>
        {/* Chats Sidebar */}
        <div className='dm-sidebar'>
          <div className='dm-sidebar-header'>
            <h3>Conversations</h3>
            <span className='chat-count'>{chats.length}</span>
          </div>
          <div className='chats-list-container'>
            {chats.length === 0 ? (
              <div className='empty-chats'>
                <div className='empty-chats-icon'>
                  <svg width='32' height='32' viewBox='0 0 24 24' fill='none'>
                    <path
                      d='M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z'
                      stroke='currentColor'
                      strokeWidth='2'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                    />
                  </svg>
                </div>
                <p>No conversations yet</p>
                <small>Start a new chat to begin messaging</small>
              </div>
            ) : (
              chats.map(chat => (
                <ChatsListCard
                  key={String(chat._id)}
                  chat={chat}
                  handleChatSelect={handleChatSelect}
                />
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className='dm-chat-area'>
          {selectedChat ? (
            <>
              {/* Chat Header */}
              <div className='dm-chat-header'>
                <div className='chat-participant-info'>
                  {isSelectedGroupChat ? (
                    <div className='participant-avatar group-avatar'>
                      <svg width='20' height='20' viewBox='0 0 24 24' fill='none'>
                        <path
                          d='M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75M13 7a4 4 0 11-8 0 4 4 0 018 0z'
                          stroke='currentColor'
                          strokeWidth='2'
                          strokeLinecap='round'
                          strokeLinejoin='round'
                        />
                      </svg>
                    </div>
                  ) : (
                    <div className='participant-avatar'>
                      <svg width='20' height='20' viewBox='0 0 24 24' fill='currentColor'>
                        <path
                          d='M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 3a4 4 0 100 8 4 4 0 000-8z'
                          stroke='currentColor'
                          strokeWidth='2'
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          fill='none'
                        />
                      </svg>
                    </div>
                  )}
                  <div className='participant-details'>
                    <h2>{getChatDisplayName()}</h2>
                    {isSelectedGroupChat && (
                      <p className='group-participants-list'>
                        {participants.filter(p => p !== user.username).join(', ')}
                      </p>
                    )}
                    {!isSelectedGroupChat && <p>{typingText || ''}</p>}
                    {isSelectedGroupChat && typingText && <p>{typingText}</p>}
                  </div>
                </div>
                <div className='chat-actions'>
                  {isSelectedGroupChat && (
                    <button
                      className='chat-action-btn'
                      title='Add participant'
                      onClick={() => {
                        // TODO: Implement add participant modal
                        alert('Add participant feature coming soon!');
                      }}>
                      <svg width='20' height='20' viewBox='0 0 24 24' fill='none'>
                        <path
                          d='M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8zM20 8v6M23 11h-6'
                          stroke='currentColor'
                          strokeWidth='2'
                          strokeLinecap='round'
                          strokeLinejoin='round'
                        />
                      </svg>
                    </button>
                  )}
                  <NotifComponent chat={selectedChat} />
                  <button className='chat-action-btn' title='Chat options'>
                    <svg width='20' height='20' viewBox='0 0 24 24' fill='none'>
                      <circle cx='12' cy='12' r='1' stroke='currentColor' strokeWidth='2' />
                      <circle cx='19' cy='12' r='1' stroke='currentColor' strokeWidth='2' />
                      <circle cx='5' cy='12' r='1' stroke='currentColor' strokeWidth='2' />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Messages Area */}
              <div className='dm-messages-area'>
                <div className='dm-messages-container'>
                  {messages.length === 0 ? (
                    <div className='empty-messages'>
                      <div className='empty-messages-icon'>
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
                      <h3>Start the conversation</h3>
                      <p>
                        {isSelectedGroupChat
                          ? `Send a message to ${getChatDisplayName()}`
                          : `Send a message to ${otherParticipant}`}
                      </p>
                    </div>
                  ) : (
                    messages.map(message => (
                      <MessageCard
                        key={String(message._id)}
                        message={message}
                        onMessageUpdate={refreshChat}
                        isLatestSentMessage={
                          latestSentMessage
                            ? String(message._id) === String(latestSentMessage._id)
                            : false
                        }
                        otherParticipant={otherParticipant}
                      />
                    ))
                  )}

                  {typingText && (
                    <div className='dm-typing-indicator'>
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

              {/* Message Input */}
              <div className='dm-message-input'>
                <div className='dm-input-container'>
                  <div className='dm-input-wrapper'>
                    <input
                      className='dm-message-textbox'
                      type='text'
                      value={newMessage}
                      onChange={e => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder={
                        isSelectedGroupChat
                          ? `Message ${getChatDisplayName()}...`
                          : `Message ${otherParticipant}...`
                      }
                    />
                    <button
                      className={`dm-send-button ${newMessage.trim() ? 'active' : ''}`}
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim()}>
                      <svg width='20' height='20' viewBox='0 0 24 24' fill='currentColor'>
                        <path d='M2.01 21L23 12 2.01 3 2 10l15 2-15 2z' />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className='dm-empty-state'>
              <div className='empty-state-icon'>
                <svg width='64' height='64' viewBox='0 0 24 24' fill='none'>
                  <path
                    d='M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z'
                    stroke='currentColor'
                    strokeWidth='2'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                  />
                </svg>
              </div>
              <h2>Select a conversation</h2>
              <p>Choose from your existing conversations or start a new one</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DirectMessage;
