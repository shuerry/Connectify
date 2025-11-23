import { useState } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getMetaData } from '../../../tool';
import { Comment, DatabaseComment } from '../../../types/types';
import './index.css';
import useUserContext from '../../../hooks/useUserContext';
import logger from '../../../utils/logger';

/**
 * Interface representing the props for the Comment Section component.
 *
 * - comments - list of the comment components
 * - handleAddComment - a function that handles adding a new comment, taking a Comment object as an argument
 */
interface CommentSectionProps {
  comments: DatabaseComment[];
  handleAddComment: (comment: Comment) => void;
  parentOwners?: string[];
  parentId?: string;
}

/**
 * CommentSection component shows the users all the comments and allows the users add more comments.
 *
 * @param comments: an array of Comment objects
 * @param handleAddComment: function to handle the addition of a new comment
 */
const CommentSection = ({ comments, handleAddComment, parentOwners }: CommentSectionProps) => {
  const { user } = useUserContext();
  const [text, setText] = useState<string>('');
  const [textErr, setTextErr] = useState<string>('');
  const [showComments, setShowComments] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    window.clearTimeout((showToast as unknown as { t?: number }).t);
    (showToast as unknown as { t?: number }).t = window.setTimeout(() => setToastMsg(null), 2000);
  };

  /**
   * Function to handle the addition of a new comment.
   */
  const handleAddCommentClick = () => {
    if (text.trim() === '' || user.username.trim() === '') {
      setTextErr(text.trim() === '' ? 'Comment text cannot be empty' : '');
      return;
    }

    const newComment: Comment = {
      text,
      commentBy: user.username,
      commentDateTime: new Date(),
    };

    handleAddComment(newComment);
    setText('');
    setTextErr('');
  };

  return (
    <div className='comment-section'>
      <button className='toggle-button' onClick={() => setShowComments(!showComments)}>
        {showComments ? 'Hide Comments' : `Show Comments (${comments.length})`}
      </button>

      {showComments && (
        <div className='comments-container'>
          <ul className='comments-list'>
            {comments.length > 0 ? (
              comments.map(comment => (
                <li key={String(comment._id)} className='comment-item'>
                  <div className='comment-text'>
                    <Markdown remarkPlugins={[remarkGfm]}>{comment.text}</Markdown>
                  </div>
                  <small className='comment-meta'>
                    {comment.commentBy}, {getMetaData(new Date(comment.commentDateTime))}
                    {user &&
                      (user.username === comment.commentBy ||
                        (parentOwners && parentOwners.includes(user.username))) && (
                        <button
                          className='reddit-action-btn report-btn delete-btn'
                          title='Delete comment'
                          onClick={e => {
                            e.stopPropagation();
                            const confirmed = window.confirm('Delete this comment?');
                            if (!confirmed) return;
                            (async () => {
                              try {
                                // lazy import to avoid circular deps
                                const { deleteComment } = await import(
                                  '../../../services/commentService'
                                );
                                if (comment._id && user.username) {
                                  await deleteComment(String(comment._id), user.username);
                                  showToast('Comment deleted');
                                }
                              } catch (err) {
                                logger.error('Error deleting comment', err);
                                showToast('Unable to delete comment');
                              }
                            })();
                          }}>
                          <svg
                            width='14'
                            height='14'
                            viewBox='0 0 24 24'
                            fill='currentColor'
                            aria-hidden>
                            <path d='M3 6h18v2H3V6zm2 3h14l-1.1 12.2c-.1 1.1-1 1.8-2.1 1.8H8.2c-1.1 0-2-.8-2.1-1.8L5 9zm5 2v8h2v-8H10zm4 0v8h2v-8h-2zM9 4V3h6v1h5v2H4V4h5z' />
                          </svg>
                          <span className='delete-label'>Delete</span>
                        </button>
                      )}
                  </small>
                </li>
              ))
            ) : (
              <p className='no-comments'>No comments yet.</p>
            )}
          </ul>

          <div className='add-comment'>
            <div className='input-row'>
              <textarea
                placeholder='Comment'
                value={text}
                onChange={e => setText(e.target.value)}
                className='comment-textarea'
              />
              <button className='add-comment-button' onClick={handleAddCommentClick}>
                Add Comment
              </button>
            </div>
            {textErr && <small className='error'>{textErr}</small>}
          </div>
        </div>
      )}
      {toastMsg && (
        <div className='cf-toast' style={{ position: 'relative', top: 8 }}>
          {toastMsg}
        </div>
      )}
    </div>
  );
};

export default CommentSection;
