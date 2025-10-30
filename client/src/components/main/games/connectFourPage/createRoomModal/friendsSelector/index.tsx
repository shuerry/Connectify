import { useState, useEffect } from 'react';
import './index.css';
import useUserContext from '../../../../../../hooks/useUserContext';

interface Friend {
  username: string;
  isOnline?: boolean;
}

interface FriendsSelectorProps {
  selectedFriends: string[];
  onFriendsChange: (friends: string[]) => void;
}

/**
 * Component for selecting friends to invite to a Connect Four room
 */
const FriendsSelector = ({ selectedFriends, onFriendsChange }: FriendsSelectorProps) => {
  const { user } = useUserContext();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch user's friends list
  useEffect(() => {
    const fetchFriends = async () => {
      if (!user?.username) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await fetch(`/api/user/relations/${user.username}`, {
          credentials: 'include',
        });
        
        if (response.ok) {
          const data = await response.json();
          // Transform friends list to include mock online status
          const friendsWithStatus = data.friends.map((username: string) => ({
            username,
            isOnline: Math.random() > 0.5, // Mock online status
          }));
          setFriends(friendsWithStatus);
        } else {
          // eslint-disable-next-line no-console
          console.error('Failed to fetch friends:', response.statusText);
          setFriends([]); // Set empty array on error
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error fetching friends:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFriends();
  }, [user?.username]);

  // Filter friends based on search term
  const filteredFriends = friends.filter(friend =>
    friend.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleFriendToggle = (username: string) => {
    if (selectedFriends.includes(username)) {
      onFriendsChange(selectedFriends.filter(f => f !== username));
    } else {
      onFriendsChange([...selectedFriends, username]);
    }
  };

  const selectAllFriends = () => {
    onFriendsChange(filteredFriends.map(f => f.username));
  };

  const clearAllFriends = () => {
    onFriendsChange([]);
  };

  if (loading) {
    return (
      <div className="friends-selector">
        <div className="friends-loading">
          <span>Loading friends...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="friends-selector">
      <div className="friends-header">
        <h4>Select Friends to Invite</h4>
        <div className="friends-actions">
          <button 
            type="button" 
            className="btn-select-all"
            onClick={selectAllFriends}
            disabled={filteredFriends.length === 0}
          >
            Select All
          </button>
          <button 
            type="button" 
            className="btn-clear-all"
            onClick={clearAllFriends}
            disabled={selectedFriends.length === 0}
          >
            Clear All
          </button>
        </div>
      </div>

      {friends.length === 0 ? (
        <div className="no-friends">
          <p>You don't have any friends yet.</p>
          <p>Add some friends to invite them to your games!</p>
        </div>
      ) : (
        <>
          <div className="friends-search">
            <input
              type="text"
              placeholder="Search friends..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="friends-search-input"
            />
          </div>

          <div className="friends-list">
            {filteredFriends.length === 0 ? (
              <p className="no-results">No friends match your search.</p>
            ) : (
              filteredFriends.map((friend) => (
                <div
                  key={friend.username}
                  className={`friend-item ${selectedFriends.includes(friend.username) ? 'selected' : ''}`}
                  onClick={() => handleFriendToggle(friend.username)}
                >
                  <div className="friend-info">
                    <div className="friend-avatar">
                      <span>{friend.username.charAt(0).toUpperCase()}</span>
                    </div>
                    <div className="friend-details">
                      <span className="friend-name">{friend.username}</span>
                      <span className={`friend-status ${friend.isOnline ? 'online' : 'offline'}`}>
                        {friend.isOnline ? '🟢 Online' : '⚫ Offline'}
                      </span>
                    </div>
                  </div>
                  <div className="friend-checkbox">
                    <input
                      type="checkbox"
                      checked={selectedFriends.includes(friend.username)}
                      onChange={() => handleFriendToggle(friend.username)}
                    />
                  </div>
                </div>
              ))
            )}
          </div>

          {selectedFriends.length > 0 && (
            <div className="selected-summary">
              <strong>{selectedFriends.length}</strong> friend{selectedFriends.length !== 1 ? 's' : ''} selected
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default FriendsSelector;