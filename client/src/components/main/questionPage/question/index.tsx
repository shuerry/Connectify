/* eslint-disable no-console */
import './index.css';
import { getMetaData } from '../../../../tool';
import { PopulatedDatabaseQuestion } from '../../../../types/types';
import SaveDropdown from '../../collections/saveDropdown';
import ReportDropdown from '../../collections/reportDropdown';
import useQuestionView from '../../../../hooks/useQuestionView';
import { useNavigate } from 'react-router-dom';
import {
  deleteQuestion,
  upvoteQuestion,
  downvoteQuestion,
} from '../../../../services/questionService';
import useVoteStatus from '../../../../hooks/useVoteStatus';

import useUserContext from '../../../../hooks/useUserContext';
import useReportQuestion from '../../../../hooks/useReportQuestion';

/**
 * Interface representing the props for the Question component.
 *
 * q - The question object containing details about the question.
 */
interface QuestionProps {
  question: PopulatedDatabaseQuestion;
}

/**
 * Question component renders the details of a question including its title, tags, author, answers, and views.
 * Clicking on the component triggers the handleAnswer function,
 * and clicking on a tag triggers the clickTag function.
 *
 * @param q - The question object containing question details.
 */
const QuestionView = ({ question }: QuestionProps) => {
  const { user } = useUserContext();
  const { count, voted } = useVoteStatus({ question });
  const navigate = useNavigate();
  const {
    clickTag,
    handleAnswer,
    handleSaveClick,

    saveDropdownOpen,
    closeSaveDropdown,
  } = useQuestionView();

  const {
    isHidden,
    openReportModal,
    reportTarget,
    submitReport,
    canReport,
    reportDropdownOpen,
    closeReportDropdown,
  } = useReportQuestion();

  /**
   * Function to handle upvoting or downvoting a question.
   */
  const handleVote = async (type: 'upvote' | 'downvote') => {
    try {
      if (question._id && user.username) {
        if (type === 'upvote') {
          await upvoteQuestion(question._id, user.username);
        } else if (type === 'downvote') {
          await downvoteQuestion(question._id, user.username);
        }
      }
    } catch (error) {
      console.error(`Error during ${type}:`, error);
    }
  };

  if (isHidden(String(question._id))) {
    return null;
  }

  return (
    <>
      <div className='reddit-question-card'>
        {/* Voting sidebar */}
        <div className='vote-sidebar'>
          <button
            className={`vote-btn vote-up ${voted === 1 ? 'vote-up-active' : ''}`}
            onClick={e => {
              e.stopPropagation();
              handleVote('upvote');
            }}
            aria-label='Upvote'>
            <svg width='18' height='18' viewBox='0 0 24 24' fill='currentColor'>
              <path d='M12 4l8 8h-6v8h-4v-8H4z' />
            </svg>
          </button>
          <div className='vote-score'>{count}</div>
          <button
            className={`vote-btn vote-down ${voted === -1 ? 'vote-down-active' : ''}`}
            onClick={e => {
              e.stopPropagation();
              handleVote('downvote');
            }}
            aria-label='Downvote'>
            <svg width='18' height='18' viewBox='0 0 24 24' fill='currentColor'>
              <path d='M12 20l-8-8h6V4h4v8h6z' />
            </svg>
          </button>
        </div>

        {/* Main content */}
        <div
          className='question-content'
          onClick={() => {
            if (question._id) {
              handleAnswer(question._id);
            }
          }}>
          {/* Question header with metadata */}
          <div className='question-header'>
            <div className='question-meta-inline'>
              <span className='author-link'>r/stackoverflow</span>
              <span className='meta-separator'>•</span>
              <span className='post-time'>{getMetaData(new Date(question.askDateTime))}</span>
              <span className='meta-separator'>•</span>
              <span className='author-name'>u/{question.askedBy}</span>
            </div>
          </div>

          {/* Question title */}
          <h3 className='reddit-question-title'>{question.title}</h3>

          {/* Tags */}
          <div className='question-tags-reddit'>
            {question.tags.map(tag => (
              <button
                key={String(tag._id)}
                className='reddit-tag'
                onClick={e => {
                  e.stopPropagation();
                  clickTag(tag.name);
                }}>
                {tag.name}
              </button>
            ))}
          </div>

          {/* Action bar */}
          <div className='reddit-actions'>
            <button
              className='reddit-action-btn'
              onClick={e => {
                e.stopPropagation();
                if (question._id) {
                  handleAnswer(question._id);
                }
              }}>
              <svg width='16' height='16' viewBox='0 0 24 24' fill='currentColor'>
                <path d='M21,6H3A1,1 0 0,0 2,7V17A1,1 0 0,0 3,18H8.5L12,21.5L15.5,18H21A1,1 0 0,0 22,17V7A1,1 0 0,0 21,6Z' />
              </svg>
              {question.answers.length || 0} Comments
            </button>

            <div className='save-dropdown-container'>
              <button
                className='reddit-action-btn'
                onClick={e => {
                  e.stopPropagation();
                  handleSaveClick(question);
                }}>
                <svg width='16' height='16' viewBox='0 0 24 24' fill='currentColor'>
                  <path d='M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z' />
                </svg>
                Save
              </button>
              {saveDropdownOpen === question._id.toString() && (
                <SaveDropdown question={question} onClose={closeSaveDropdown} />
              )}
            </div>

            <div className='views-count'>
              <svg width='16' height='16' viewBox='0 0 24 24' fill='currentColor'>
                <path d='M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17M12,4.5C7,4.5 2.73,7.61 1,12C2.73,16.39 7,19.5 12,19.5C17,19.5 21.27,16.39 23,12C21.27,7.61 17,4.5 12,4.5Z' />
              </svg>
              {question.views.length} views
            </div>

            {canReport(question) && (
              <button
                className='reddit-action-btn report-btn'
                onClick={e => {
                  e.stopPropagation();
                  openReportModal(question);
                }}>
                <svg width='16' height='16' viewBox='0 0 24 24' fill='currentColor'>
                  <path d='M14.4 6L14 4H5v17h2v-7h5.6l .4 2h7V6z' />
                </svg>
                Report
              </button>
            )}
            {/* Show Delete for the author */}
            {user && user.username === question.askedBy && (
              <button
                className='reddit-action-btn report-btn delete-btn'
                onClick={e => {
                  e.stopPropagation();
                  const confirmed = window.confirm(
                    'Delete this question? This action cannot be undone.',
                  );
                  if (!confirmed) return;
                  (async () => {
                    try {
                      if (question._id && user.username) {
                        await deleteQuestion(String(question._id), user.username);
                        // If we're on the question page, send user home; otherwise reload to update lists
                        if (window.location.pathname.startsWith('/question/')) {
                          navigate('/home');
                        } else {
                          window.location.reload();
                        }
                      }
                    } catch (err) {
                      console.error('Error deleting question', err);
                      alert('Unable to delete question');
                    }
                  })();
                }}>
                <svg width='16' height='16' viewBox='0 0 24 24' fill='currentColor'>
                  <path d='M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z M19,4H15.5L14.79,3H9.21L8.5,4H5V6H19V4Z' />
                </svg>
                Delete
              </button>
            )}
          </div>
        </div>
      </div>
      {canReport(question) && reportDropdownOpen === question._id.toString() && reportTarget && (
        <div className='report-dropdown-overlay'>
          <ReportDropdown
            question={reportTarget}
            onClose={closeReportDropdown}
            onSubmit={submitReport}
          />
        </div>
      )}
    </>
  );
};

export default QuestionView;
