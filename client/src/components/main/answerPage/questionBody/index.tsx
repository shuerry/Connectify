import { useState } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './index.css';
import { PopulatedDatabaseQuestion } from '../../../../types/types';
import useUserContext from '../../../../hooks/useUserContext';
import EditQuestionForm from '../editQuestionForm';

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
  onQuestionUpdate 
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
    return (
      <EditQuestionForm
        question={question}
        onCancel={handleEditCancel}
        onSuccess={handleEditSuccess}
      />
    );
  }

  return (
    <div id='questionBody' className='questionBody right_padding'>
      <div className='bold_title answer_question_view'>{views} views</div>
      <div className='answer_question_text'>
        <Markdown remarkPlugins={[remarkGfm]}>{text}</Markdown>
      </div>
      <div className='answer_question_right'>
        <div className='question_author_section'>
          <div className='question_author'>{askby}</div>
          <div className='answer_question_meta'>asked {meta}</div>
        </div>
        {canEdit && (
          <button 
            className='edit-question-btn'
            onClick={handleEditClick}
            title='Edit your question'
          >
            Edit
          </button>
        )}
      </div>
    </div>
  );
};

export default QuestionBody;
