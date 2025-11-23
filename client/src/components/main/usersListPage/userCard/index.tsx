import './index.css';
import { useEffect, useState } from 'react';
import { SafeDatabaseUser } from '../../../../types/types';
import useUserContext from '../../../../hooks/useUserContext';
import { removeFriend, blockUser, getRelations } from '../../../../services/userService';
import { addDirectMessage, getDirectMessages } from '../../../../services/messageService';
import Avatar from '../../../common/Avatar/Avatar';

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
          msg =>
            msg.type === 'friendRequest' &&
            msg.msgFrom === currentUser.username &&
            msg.msgTo === user.username &&
            msg.friendRequestStatus === 'pending',
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
    } catch {
      throw new Error('Failed to send friend request');
    }
  };

  const onRemoveFriend = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await removeFriend(currentUser.username, user.username);
      setIsFriend(false);
    } catch {
      throw new Error('Failed to remove friend');
    }
  };

  const onBlockUser = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await blockUser(currentUser.username, user.username);
      setIsBlocked(true);
      setIsFriend(false); // Blocking removes from friends
    } catch {
      throw new Error('Failed to block user');
    }
  };

  return (
    <div className='user right_padding' onClick={() => handleUserCardViewClickHandler(user)}>
      <Avatar
        name={user.username}
        size='md'
        variant='circle'
        isOnline={user.isOnline}
        showOnlineStatus={user.showOnlineStatus}
        className='user-avatar'
      />
      <div className='user_mid'>
        <div className='userUsername'>{user.username}</div>
      </div>
      <div className='userStats'>
        <div>joined {new Date(user.dateJoined).toUTCString()}</div>
      </div>
      {currentUser.username !== user.username && !isBlocked && (
        <div className='user-actions'>
          {isFriend ? (
            <button className='user-btn user-btn-secondary' onClick={onRemoveFriend}>
              <svg width='16' height='16' viewBox='0 0 24 24' fill='currentColor'>
                <path d='M14,2A8,8 0 0,0 6,10A8,8 0 0,0 14,18A8,8 0 0,0 22,10A8,8 0 0,0 14,2M19,11H9V9H19V11Z' />
              </svg>
              Remove Friend
            </button>
          ) : friendRequestSent ? (
            <div className='user-status sent'>
              <svg width='16' height='16' viewBox='0 0 24 24' fill='currentColor'>
                <path d='M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M11,16.5L6.5,12L7.91,10.59L11,13.67L16.59,8.09L18,9.5L11,16.5Z' />
              </svg>
              Friend Request Sent
            </div>
          ) : (
            <button className='user-btn user-btn-primary' onClick={onSendFriendRequest}>
              <svg width='16' height='16' viewBox='0 0 24 24' fill='currentColor'>
                <path d='M15,14C12.33,14 7,15.33 7,18V20H23V18C23,15.33 17.67,14 15,14M1,10V12H9V10M15,12A4,4 0 0,0 19,8A4,4 0 0,0 15,4A4,4 0 0,0 11,8A4,4 0 0,0 15,12Z' />
              </svg>
              Add Friend
            </button>
          )}
          <button className='user-btn user-btn-danger' onClick={onBlockUser}>
            <svg width='16' height='16' viewBox='0 0 24 24' fill='currentColor'>
              <path d='M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12C20,14.4 19,16.5 17.35,18.15L5.85,6.65C7.5,5 9.6,4 12,4M12,20A8,8 0 0,1 4,12C4,9.6 5,7.5 6.65,5.85L18.15,17.35C16.5,19 14.4,20 12,20Z' />
            </svg>
            Block
          </button>
        </div>
      )}
      {currentUser.username !== user.username && isBlocked && (
        <div className='user-status blocked'>
          <svg width='16' height='16' viewBox='0 0 24 24' fill='currentColor'>
            <path d='M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12C20,14.4 19,16.5 17.35,18.15L5.85,6.65C7.5,5 9.6,4 12,4M12,20A8,8 0 0,1 4,12C4,9.6 5,7.5 6.65,5.85L18.15,17.35C16.5,19 14.4,20 12,20Z' />
          </svg>
          Blocked
        </div>
      )}
    </div>
  );
};

export default UserCardView;
