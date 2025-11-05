import { useEffect, useState } from 'react';
import useUserContext from '../../../hooks/useUserContext';
import { SafeDatabaseUser } from '../../../types/types';
import { getRelations, getUserByUsername, removeFriend } from '../../../services/userService';

const FriendsListPage = () => {
  const { user: currentUser } = useUserContext();
  const [friends, setFriends] = useState<SafeDatabaseUser[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { friends: friendUsernames } = await getRelations(currentUser.username);
        const results = await Promise.all(friendUsernames.map(u => getUserByUsername(u)));
        setFriends(results);
      } catch {
        setFriends([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [currentUser.username]);

  const onRemove = async (target: string) => {
    try {
      await removeFriend(currentUser.username, target);
      setFriends(prev => prev.filter(u => u.username !== target));
    } catch {
      throw new Error('Failed to remove friend');
    }
  };

  return (
    <div className='right_padding'>
      <div className='bold_title'>Friends</div>
      {loading && <div>Loading...</div>}
      {!loading && (
        <div>
          {friends.length === 0 && <div>No friends yet.</div>}
          {friends.map(u => (
            <div key={u.username} className='user'>
              <div className='user_mid'>
                <div className='userUsername'>{u.username}</div>
              </div>
              <div className='userStats'>
                <div>joined {new Date(u.dateJoined).toUTCString()}</div>
              </div>
              <button type='button' onClick={() => onRemove(u.username)}>
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FriendsListPage;
