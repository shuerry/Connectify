import { useState } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './index.css';
import { PopulatedDatabaseQuestion } from '../../../../types/types';
import useUserContext from '../../../../hooks/useUserContext';
import EditQuestionForm from '../editQuestionForm';
import QuestionVersionHistory from '../questionVersionHistory';

/**
 * Interface representing the props for the QuestionBody component.
 *
 * - question - The complete question object for editing support
 * - views - The number of views the question has received.
 * - text - The content of the question, which may contain hyperlinks.
 * - askby - The username of the user who asked the question.
 * - meta - Additional metadata related to the question, such as the date and time it was asked.
 * - onQuestionUpdate - Callback function when the question is updated
 */
interface QuestionBodyProps {
  question: PopulatedDatabaseQuestion;
  views: number;
  text: string;
  askby: string;
  meta: string;
  onQuestionUpdate?: (updatedQuestion: PopulatedDatabaseQuestion) => void;
}

/**
 * QuestionBody component that displays the body of a question.
 * It includes the number of views, the question content (with hyperlink handling),
 * the username of the author, additional metadata, and edit functionality for the author.
 *
 * @param question The complete question object for editing support
 * @param views The number of views the question has received.
 * @param text The content of the question.
 * @param askby The username of the question's author.
 * @param meta Additional metadata related to the question.
 * @param onQuestionUpdate Callback function when the question is updated
 */
const QuestionBody = ({
  question,
  views,
  text,
  askby,
  meta,
  onQuestionUpdate,
}: QuestionBodyProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const { user } = useUserContext();

  // Check if current user is the author of the question
  const canEdit = user.username === askby;

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleEditCancel = () => {
    setIsEditing(false);
  };

  const handleEditSuccess = (updatedQuestion: PopulatedDatabaseQuestion) => {
    setIsEditing(false);
    if (onQuestionUpdate) {
      onQuestionUpdate(updatedQuestion);
    }
  };

  if (isEditing) {
    return <EditQuestionForm onCancel={handleEditCancel} />;
  }

  return (
    <div id='questionBody' className='questionBody'>
      <div className='reddit-question-content'>
        <div className='answer_question_text'>
          <Markdown remarkPlugins={[remarkGfm]}>{text}</Markdown>
        </div>
      </div>

      <div className='answer_question_right'>
        <div className='reddit-question-meta'>
          <div className='reddit-question-views'>
            <svg width='16' height='16' viewBox='0 0 24 24' fill='currentColor'>
              <path d='M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z' />
            </svg>
            <span className='answer_question_view'>{views} views</span>
          </div>

          <div className='reddit-question-author'>
            <span>Posted by</span>
            <strong>u/{askby}</strong>
            <span>•</span>
            <span>{meta}</span>
          </div>
        </div>

        {canEdit && (
          <div className='question-actions'>
            <button
              className='edit-question-btn'
              onClick={handleEditClick}
              title='Edit your question'>
              <svg width='14' height='14' viewBox='0 0 24 24' fill='currentColor'>
                <path d='M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z' />
              </svg>
              Edit
            </button>
            <QuestionVersionHistory question={question} onVersionRollback={handleEditSuccess} />
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionBody;
