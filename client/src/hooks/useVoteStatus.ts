import { useEffect, useState } from 'react';
import useUserContext from './useUserContext';
import { PopulatedDatabaseQuestion } from '../types/types';

interface VoteUpdateData {
  qid: string;
  upVotes?: string[];
  downVotes?: string[];
}

/**
 * Custom hook to handle voting logic for a question.
 * It manages the current vote count, user vote status (upvoted, downvoted),
 * and handles real-time vote updates via socket events.
 *
 * @param question - The question object for which the voting is tracked.
 *
 * @returns count - The urrent vote count (upVotes - downVotes)
 * @returns setCount - The function to manually update vote count
 * @returns voted - The user's vote status
 * @returns setVoted - The function to manually update user's vote status
 */

const useVoteStatus = ({ question }: { question: PopulatedDatabaseQuestion }) => {
  const { user, socket } = useUserContext();
  const [count, setCount] = useState<number>(0);
  const [voted, setVoted] = useState<number>(0);

  useEffect(() => {
    // Listen for vote updates via socket
    const handleVoteUpdate = (voteData: VoteUpdateData) => {
      if (voteData.qid === String(question?._id)) {
        const newCount = (voteData.upVotes || []).length - (voteData.downVotes || []).length;
        setCount(newCount);

        // Update user's vote status
        if (user.username && voteData.upVotes?.includes(user.username)) {
          setVoted(1);
        } else if (user.username && voteData.downVotes?.includes(user.username)) {
          setVoted(-1);
        } else {
          setVoted(0);
        }
      }
    };

    socket.on('voteUpdate', handleVoteUpdate);

    return () => {
      socket.off('voteUpdate', handleVoteUpdate);
    };
  }, [question, user.username, socket]);

  return {
    count,
    setCount,
    voted,
    setVoted,
  };
};

export default useVoteStatus;
