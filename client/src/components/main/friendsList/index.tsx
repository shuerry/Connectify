import './index.css';
import useFriendsList from '../../../hooks/useFriendsList';
import Avatar from '../../common/Avatar/Avatar';

const FriendsListPage = () => {
  const { friends, loading, onRemove } = useFriendsList();

  return (
    <div className='friends-container'>
      <div className='friends-header'>
        <h1 className='friends-title'>Friends</h1>
        <p className='friends-subtitle'>Manage your connections and friendships</p>
      </div>

      {loading && (
        <div className='friends-loading'>
          <svg width='24' height='24' viewBox='0 0 24 24' fill='currentColor'>
            <path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z' />
          </svg>
          Loading friends...
        </div>
      )}

      {!loading && friends.length === 0 && (
        <div className='friends-empty'>
          <h3>No friends yet</h3>
          <p>Start connecting with other users to build your network!</p>
        </div>
      )}

      {!loading && friends.length > 0 && (
        <div className='friends-list'>
          {friends.map(friend => (
            <div key={friend.username} className='friend-card'>
              <Avatar
                name={friend.username}
                size='lg'
                variant='circle'
                isOnline={friend.isOnline}
                showOnlineStatus={friend.showOnlineStatus}
              />
              <div className='friend-info'>
                <h3 className='friend-username'>{friend.username}</h3>
                <p className='friend-joined'>
                  Joined {new Date(friend.dateJoined).toLocaleDateString()}
                </p>
              </div>
              <div className='friend-actions'>
                <button
                  type='button'
                  className='btn-remove-friend'
                  onClick={() => onRemove(friend.username)}>
                  <svg width='16' height='16' viewBox='0 0 24 24' fill='currentColor'>
                    <path d='M14,2A8,8 0 0,0 6,10A8,8 0 0,0 14,18A8,8 0 0,0 22,10A8,8 0 0,0 14,2M19,11H9V9H19V11Z' />
                  </svg>
                  Remove Friend
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FriendsListPage;
