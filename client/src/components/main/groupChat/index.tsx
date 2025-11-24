import React from 'react';
import './index.css';
import useGroupChat from '../../../hooks/useGroupChat';
import UsersListPage from '../usersListPage';
import MessageCard from '../messageCard';
import NotifComponent from '../notifyButton';
import ChatsListCard from './chatsListCard';
import useUserContext from '../../../hooks/useUserContext';
import OnlineStatusIndicator from '../../common/OnlineStatusIndicator/OnlineStatusIndicator';

/**
 * GroupChat component renders a page for group chat messaging.
 * It includes support for regular group chats and community chats.
 */
const GroupChat = () => {
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
    handleCreateGroupChat,
    handleCreateCommunityChat,
    refreshChat,
    error,
    typingUsers,
    selectedUsersForGroup,
    setSelectedUsersForGroup,
    groupChatName,
    setGroupChatName,
    isCreatingCommunityChat,
    setIsCreatingCommunityChat,
    selectedCommunity,
    setSelectedCommunity,
    communities,
    participantUsers,
  } = useGroupChat();

  const participants = selectedChat ? Object.keys(selectedChat.participants) : [];
  const isCommunityChat = selectedChat?.isCommunityChat || false;

  const getChatDisplayName = () => {
    if (!selectedChat) return null;
    if (selectedChat.name) {
      return selectedChat.name;
    }
    return `${participants.length} participants`;
  };

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

  const renderParticipantStatusList = () => {
    const otherParticipants = participants.filter(p => p !== user.username);
    if (otherParticipants.length === 0) {
      return null;
    }

    return otherParticipants.map((participant, index) => {
      const participantUser = participantUsers.get(participant);
      const canShowStatus = Boolean(participantUser) && participantUser?.showOnlineStatus !== false;

      return (
        <React.Fragment key={participant}>
          {index > 0 && <span className='participant-status-separator'>, </span>}
          <span className='participant-status-entry'>
            {canShowStatus && (
              <OnlineStatusIndicator
                size='small'
                isOnline={participantUser?.isOnline}
                showOnlineStatus={participantUser?.showOnlineStatus}
                className='participant-status-dot'
              />
            )}
            {participant}
          </span>
        </React.Fragment>
      );
    });
  };

  return (
    <div className='modern-group-chat'>
      {/* Header with New Chat Button */}
      <div className='gc-header'>
        <div className='gc-header-content'>
          <div className='gc-title'>
            <div className='gc-icon'>
              <svg width='24' height='24' viewBox='0 0 24 24' fill='currentColor'>
                <path
                  d='M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75M13 7a4 4 0 11-8 0 4 4 0 018 0z'
                  stroke='currentColor'
                  strokeWidth='2'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  fill='none'
                />
              </svg>
            </div>
            <div>
              <h1>Group Chats</h1>
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
            New Group Chat
          </button>
        </div>
      </div>

      {/* Create Chat Panel */}
      {showCreatePanel && (
        <div className='create-chat-panel'>
          <div className='create-chat-header'>
            <h3>Create Group Chat</h3>
            <button
              className='close-panel-btn'
              onClick={() => {
                setShowCreatePanel(false);
                setIsCreatingCommunityChat(false);
                setSelectedUsersForGroup(new Set());
                setGroupChatName('');
                setSelectedCommunity(null);
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
              className={`chat-type-btn ${!isCreatingCommunityChat ? 'active' : ''}`}
              onClick={() => {
                setIsCreatingCommunityChat(false);
                setSelectedCommunity(null);
              }}>
              Regular Group
            </button>
            <button
              className={`chat-type-btn ${isCreatingCommunityChat ? 'active' : ''}`}
              onClick={() => {
                setIsCreatingCommunityChat(true);
                setSelectedUsersForGroup(new Set());
                setGroupChatName('');
              }}>
              Community Chat
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

          {isCreatingCommunityChat ? (
            <>
              {/* Community Selection */}
              <div className='community-selection'>
                <label>Select Community</label>
                <div className='communities-list'>
                  {communities.length === 0 ? (
                    <p className='no-communities'>
                      You are not an admin of any communities. Only community admins can create
                      community chats.
                    </p>
                  ) : (
                    communities.map(community => (
                      <div
                        key={community._id.toString()}
                        className={`community-item ${
                          selectedCommunity?._id.toString() === community._id.toString()
                            ? 'selected'
                            : ''
                        }`}
                        onClick={() => setSelectedCommunity(community)}>
                        <div className='community-info'>
                          <h4>{community.name}</h4>
                          <p>{community.participants.length} members</p>
                        </div>
                        {selectedCommunity?._id.toString() === community._id.toString() && (
                          <div className='check-icon'>✓</div>
                        )}
                      </div>
                    ))
                  )}
                </div>
                {selectedCommunity && (
                  <button className='create-chat-confirm-btn' onClick={handleCreateCommunityChat}>
                    Create Community Chat
                  </button>
                )}
              </div>
            </>
          ) : (
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
                    onClick={handleCreateGroupChat}
                    disabled={selectedUsersForGroup.size === 0}>
                    Create Group Chat
                  </button>
                </div>
              )}
            </>
          )}

          {!isCreatingCommunityChat && (
            <div className='users-list-container'>
              <UsersListPage handleUserSelect={handleUserSelect} />
            </div>
          )}
        </div>
      )}

      {/* Main Chat Interface */}
      <div className='gc-main-container'>
        {/* Chats Sidebar */}
        <div className='gc-sidebar'>
          <div className='gc-sidebar-header'>
            <h3>Group Chats</h3>
            <span className='chat-count'>{chats.length}</span>
          </div>
          <div className='chats-list-container'>
            {chats.length === 0 ? (
              <div className='empty-chats'>
                <div className='empty-chats-icon'>
                  <svg width='32' height='32' viewBox='0 0 24 24' fill='none'>
                    <path
                      d='M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75M13 7a4 4 0 11-8 0 4 4 0 018 0z'
                      stroke='currentColor'
                      strokeWidth='2'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                    />
                  </svg>
                </div>
                <p>No group chats yet</p>
                <small>Start a new group chat to begin messaging</small>
              </div>
            ) : (
              chats.map(chat => (
                <ChatsListCard
                  key={String(chat._id)}
                  chat={chat}
                  handleChatSelect={handleChatSelect}
                  participantUsers={participantUsers}
                />
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className='gc-chat-area'>
          {selectedChat ? (
            <>
              {/* Chat Header */}
              <div className='gc-chat-header'>
                <div className='chat-participant-info'>
                  <div
                    className={`participant-avatar ${isCommunityChat ? 'community-avatar' : 'group-avatar'}`}>
                    <svg width='20' height='20' viewBox='0 0 24 24' fill='none'>
                      {isCommunityChat ? (
                        <path
                          d='M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75M13 7a4 4 0 11-8 0 4 4 0 018 0z'
                          stroke='currentColor'
                          strokeWidth='2'
                          strokeLinecap='round'
                          strokeLinejoin='round'
                        />
                      ) : (
                        <path
                          d='M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75M13 7a4 4 0 11-8 0 4 4 0 018 0z'
                          stroke='currentColor'
                          strokeWidth='2'
                          strokeLinecap='round'
                          strokeLinejoin='round'
                        />
                      )}
                    </svg>
                  </div>
                  <div className='participant-details'>
                    <h2>{getChatDisplayName()}</h2>
                    {isCommunityChat && <p className='community-badge'>Community Chat</p>}
                    <p className='participants-list'>{renderParticipantStatusList()}</p>
                    {typingText && <p>{typingText}</p>}
                  </div>
                </div>
                <div className='chat-actions'>
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
              <div className='gc-messages-area'>
                <div className='gc-messages-container'>
                  {messages.length === 0 ? (
                    <div className='empty-messages'>
                      <div className='empty-messages-icon'>
                        <svg width='48' height='48' viewBox='0 0 24 24' fill='none'>
                          <path
                            d='M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75M13 7a4 4 0 11-8 0 4 4 0 018 0z'
                            stroke='currentColor'
                            strokeWidth='2'
                            strokeLinecap='round'
                            strokeLinejoin='round'
                          />
                        </svg>
                      </div>
                      <h3>Start the conversation</h3>
                      <p>Send a message to {getChatDisplayName()}</p>
                    </div>
                  ) : (
                    (() => {
                      // Find the latest message sent by the current user
                      const latestSentMessage = messages
                        .filter(msg => msg.msgFrom === user.username && msg.type === 'direct')
                        .sort(
                          (a, b) =>
                            new Date(b.msgDateTime).getTime() - new Date(a.msgDateTime).getTime(),
                        )[0];

                      return messages.map(message => (
                        <MessageCard
                          key={String(message._id)}
                          message={message}
                          onMessageUpdate={refreshChat}
                          isLatestSentMessage={
                            latestSentMessage
                              ? String(message._id) === String(latestSentMessage._id)
                              : false
                          }
                          otherParticipant={null}
                          allParticipants={participants}
                        />
                      ));
                    })()
                  )}

                  {typingText && (
                    <div className='gc-typing-indicator'>
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
              <div className='gc-message-input'>
                <div className='gc-input-container'>
                  <div className='gc-input-wrapper'>
                    <input
                      className='gc-message-textbox'
                      type='text'
                      value={newMessage}
                      onChange={e => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder={`Message ${getChatDisplayName()}...`}
                    />
                    <button
                      className={`gc-send-button ${newMessage.trim() ? 'active' : ''}`}
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
            <div className='gc-empty-state'>
              <div className='empty-state-icon'>
                <svg width='64' height='64' viewBox='0 0 24 24' fill='none'>
                  <path
                    d='M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75M13 7a4 4 0 11-8 0 4 4 0 018 0z'
                    stroke='currentColor'
                    strokeWidth='2'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                  />
                </svg>
              </div>
              <h2>Select a group chat</h2>
              <p>Choose from your existing group chats or start a new one</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GroupChat;
