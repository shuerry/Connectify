import { useEffect, useState } from 'react';
import './index.css';
import useUserContext from '../../../hooks/useUserContext';
import { SafeDatabaseUser } from '../../../types/types';
import { getRelations, getUserByUsername, unblockUser } from '../../../services/userService';

const BlockedListPage = () => {
  const { user: currentUser } = useUserContext();
  const [blocked, setBlocked] = useState<SafeDatabaseUser[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { blockedUsers } = await getRelations(currentUser.username);
        const results = await Promise.all(blockedUsers.map(u => getUserByUsername(u)));
        setBlocked(results);
      } catch {
        setBlocked([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [currentUser.username]);

  const onUnblock = async (target: string) => {
    try {
      await unblockUser(currentUser.username, target);
      setBlocked(prev => prev.filter(u => u.username !== target));
    } catch {
      throw new Error('Failed to unblock user');
    }
  };

  return (
    <div className='blocked-container'>
      <div className='blocked-header'>
        <h1 className='blocked-title'>Blocked Users</h1>
        <p className='blocked-subtitle'>Manage users you have blocked from interacting with you</p>
      </div>

      {loading && (
        <div className='blocked-loading'>
          <svg width='24' height='24' viewBox='0 0 24 24' fill='currentColor'>
            <path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z' />
          </svg>
          Loading blocked users...
        </div>
      )}

      {!loading && blocked.length === 0 && (
        <div className='blocked-empty'>
          <h3>No blocked users</h3>
          <p>You haven't blocked any users yet.</p>
        </div>
      )}

      {!loading && blocked.length > 0 && (
        <div className='blocked-list'>
          {blocked.map(blockedUser => (
            <div key={blockedUser.username} className='blocked-card'>
              <div className='blocked-avatar'>{blockedUser.username.charAt(0).toUpperCase()}</div>
              <div className='blocked-info'>
                <h3 className='blocked-username'>{blockedUser.username}</h3>
                <p className='blocked-joined'>
                  Joined {new Date(blockedUser.dateJoined).toLocaleDateString()}
                </p>
              </div>
              <div className='blocked-actions'>
                <button
                  type='button'
                  className='btn-unblock-user'
                  onClick={() => onUnblock(blockedUser.username)}>
                  <svg width='16' height='16' viewBox='0 0 24 24' fill='currentColor'>
                    <path d='M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M16.2,16.2L11,11V7H12.5V10.2L17,14.7L16.2,16.2Z' />
                  </svg>
                  Unblock User
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BlockedListPage;
