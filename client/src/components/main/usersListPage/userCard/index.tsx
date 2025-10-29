import './index.css';
import { useEffect, useState } from 'react';
import { SafeDatabaseUser } from '../../../../types/types';
import useUserContext from '../../../../hooks/useUserContext';
import { removeFriend, blockUser, getRelations } from '../../../../services/userService';
import { addDirectMessage, getDirectMessages } from '../../../../services/messageService';

/**
 * Interface representing the props for the User component.
 *
 * user - The user object containing details about the user.
 * handleUserCardViewClickHandler - The function to handle the click event on the user card.
 */
interface UserProps {
  user: SafeDatabaseUser;
  handleUserCardViewClickHandler: (user: SafeDatabaseUser) => void;
}

/**
 * User component renders the details of a user including its username and dateJoined.
 * Clicking on the component triggers the handleUserPage function,
 * and clicking on a tag triggers the clickTag function.
 *
 * @param user - The user object containing user details.
 */
const UserCardView = (props: UserProps) => {
  const { user, handleUserCardViewClickHandler } = props;
  const { user: currentUser } = useUserContext();
  const [isFriend, setIsFriend] = useState<boolean>(false);
  const [isBlocked, setIsBlocked] = useState<boolean>(false);
  const [friendRequestSent, setFriendRequestSent] = useState<boolean>(false);

  useEffect(() => {
    const checkRelations = async () => {
      try {
        const relations = await getRelations(currentUser.username);
        setIsFriend(relations.friends.includes(user.username));
        setIsBlocked(relations.blockedUsers.includes(user.username));
        
        // Check if there's a pending friend request from current user to this user
        const messages = await getDirectMessages(currentUser.username, user.username);
        const hasPendingRequest = messages.some(
          msg => msg.type === 'friendRequest' && 
                 msg.msgFrom === currentUser.username && 
                 msg.msgTo === user.username && 
                 msg.friendRequestStatus === 'pending'
        );
        setFriendRequestSent(hasPendingRequest);
      } catch {
        setIsFriend(false);
        setIsBlocked(false);
        setFriendRequestSent(false);
      }
    };
    checkRelations();
  }, [currentUser.username, user.username]);

  const onSendFriendRequest = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await addDirectMessage({
        msg: `${currentUser.username} wants to be your friend!`,
        msgFrom: currentUser.username,
        msgDateTime: new Date(),
        type: 'friendRequest',
        msgTo: user.username,
        friendRequestStatus: 'pending',
      });
      setFriendRequestSent(true);
    } catch {}
  };

  const onRemoveFriend = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await removeFriend(currentUser.username, user.username);
      setIsFriend(false);
    } catch {}
  };

  const onBlockUser = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await blockUser(currentUser.username, user.username);
      setIsBlocked(true);
      setIsFriend(false); // Blocking removes from friends
    } catch {}
  };

  return (
    <div className='user right_padding' onClick={() => handleUserCardViewClickHandler(user)}>
      <div className='user_mid'>
        <div className='userUsername'>{user.username}</div>
      </div>
      <div className='userStats'>
        <div>joined {new Date(user.dateJoined).toUTCString()}</div>
      </div>
      {currentUser.username !== user.username && !isBlocked && (
        <div style={{ display: 'flex', gap: 8 }}>
          {isFriend ? (
            <button type='button' onClick={onRemoveFriend}>Remove Friend</button>
          ) : friendRequestSent ? (
            <span style={{ color: 'blue' }}>Friend Request Sent</span>
          ) : (
            <button type='button' onClick={onSendFriendRequest}>Send Friend Request</button>
          )}
          <button type='button' onClick={onBlockUser}>Block</button>
        </div>
      )}
      {currentUser.username !== user.username && isBlocked && (
        <div style={{ display: 'flex', gap: 8 }}>
          <span style={{ color: 'red' }}>Blocked</span>
        </div>
      )}
    </div>
  );
};

export default UserCardView;
