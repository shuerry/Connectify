import { useEffect, useState } from 'react';
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
    } catch {}
  };

  return (
    <div className='right_padding'>
      <div className='bold_title'>Blocked Users</div>
      {loading && <div>Loading...</div>}
      {!loading && (
        <div>
          {blocked.length === 0 && <div>No blocked users.</div>}
          {blocked.map(u => (
            <div key={u.username} className='user'>
              <div className='user_mid'>
                <div className='userUsername'>{u.username}</div>
              </div>
              <div className='userStats'>
                <div>joined {new Date(u.dateJoined).toUTCString()}</div>
              </div>
              <button type='button' onClick={() => onUnblock(u.username)}>Unblock</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BlockedListPage;


