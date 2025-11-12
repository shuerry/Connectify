import { useEffect, useState } from 'react';
import useUserContext from './useUserContext';
import { PopulatedDatabaseQuestion } from '../types/types';

/**
 * Custom hook to handle following logic for a question.
 * It manages the user follow status (followed, not followed),
 * and handles real-time follow updates via socket events.
 *
 * @param question - The question object for which the following is tracked.
 *
 * @returns followed - The user's follow status
 * @returns setFollowed - The function to manually update user's follow status
 */
const useFollowStatus = ({ question }: { question: PopulatedDatabaseQuestion }) => {
  const { user, socket } = useUserContext();
  const [followed, setFollowed] = useState<boolean>(false);

  useEffect(() => {
    /**
     * Function to get the current follow status for the user.
     *
     * @returns The current follow status for the user in the question.
     */
    const getFollowStatus = () => {
      if (
        user.username &&
        question?.followers?.find(follower => follower.username === user.username)
      ) {
        return true;
      }
      return false;
    };

    // Set the initial count and vote value
    setFollowed(getFollowStatus());
  }, [question, user.username, socket]);

  return {
    followed,
    setFollowed,
  };
};

export default useFollowStatus;
