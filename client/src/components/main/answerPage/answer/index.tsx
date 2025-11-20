import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import CommentSection from '../../commentSection';
import useUserContext from '../../../../hooks/useUserContext';
import { useState } from 'react';
import './index.css';
import { Comment, DatabaseComment } from '../../../../types/types';

/**
 * Interface representing the props for the AnswerView component.
 *
 * - text The content of the answer.
 * - ansBy The username of the user who wrote the answer.
 * - meta Additional metadata related to the answer.
 * - comments An array of comments associated with the answer.
 * - handleAddComment Callback function to handle adding a new comment.
 */
interface AnswerProps {
  text: string;
  ansBy: string;
  meta: string;
  comments: DatabaseComment[];
  handleAddComment: (comment: Comment) => void;
  answerId?: string;
  questionAskedBy?: string;
}

/**
 * AnswerView component that displays the content of an answer with the author's name and metadata.
 * The answer text is processed to handle hyperlinks, and a comment section is included.
 *
 * @param text The content of the answer.
 * @param ansBy The username of the answer's author.
 * @param meta Additional metadata related to the answer.
 * @param comments An array of comments associated with the answer.
 * @param handleAddComment Function to handle adding a new comment.
 */
const AnswerView = ({ text, ansBy, meta, comments, handleAddComment, answerId, questionAskedBy }: AnswerProps) => {
  const { user } = useUserContext();
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    window.clearTimeout((showToast as unknown as { t?: number }).t);
    (showToast as unknown as { t?: number }).t = window.setTimeout(() => setToastMsg(null), 2000);
  };

  return (
  <div className='answer right_padding'>
    <div id='answerText' className='answerText'>
      {<Markdown remarkPlugins={[remarkGfm]}>{text}</Markdown>}
    </div>
    <div className='answerAuthor'>
      <div className='answer_author'>{ansBy}</div>
      <div className='answer_question_meta'>{meta}</div>
      {/* Delete button for answer author or question author */}
      {(answerId && (user.username === ansBy || user.username === questionAskedBy)) && (
        <button
          className='reddit-action-btn report-btn delete-btn'
          title='Delete answer'
          onClick={e => {
            e.stopPropagation();
            const confirmed = window.confirm('Delete this answer? This action cannot be undone.');
            if (!confirmed) return;
            (async () => {
              try {
                const { deleteAnswer } = await import('../../../../services/answerService');
                if (answerId && user.username) {
                  await deleteAnswer(answerId, user.username);
                  showToast('Answer deleted');
                }
              } catch (err) {
                // eslint-disable-next-line no-console
                console.error('Error deleting answer', err);
                showToast('Unable to delete answer');
              }
            })();
          }}>
          <svg width='14' height='14' viewBox='0 0 24 24' fill='currentColor' aria-hidden>
            <path d='M3 6h18v2H3V6zm2 3h14l-1.1 12.2c-.1 1.1-1 1.8-2.1 1.8H8.2c-1.1 0-2-.8-2.1-1.8L5 9zm5 2v8h2v-8H10zm4 0v8h2v-8h-2zM9 4V3h6v1h5v2H4V4h5z' />
          </svg>
          <span className='delete-label'>DELETE</span>
        </button>
      )}
    </div>
    <CommentSection
      comments={comments}
      handleAddComment={handleAddComment}
      parentOwners={[ansBy, questionAskedBy ?? '']}
      parentId={answerId}
    />
    {toastMsg && <div className='cf-toast' style={{ position: 'relative', top: 8 }}>{toastMsg}</div>}
  </div>
    );
  };

  export default AnswerView;
  
