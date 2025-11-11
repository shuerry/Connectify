import { getMetaData } from '../../../tool';
import AnswerView from './answer';
import AnswerHeader from './header';
import { Comment } from '../../../types/types';
import './index.css';
import QuestionBody from './questionBody';
import VoteComponent from '../voteComponent';
import CommentSection from '../commentSection';
import useAnswerPage from '../../../hooks/useAnswerPage';
import FollowButton from '../followButton';

/**
 * AnswerPage component that displays the full content of a question along with its answers.
 * It also includes the functionality to vote, ask a new question, post a new answer, and edit the question.
 */
const AnswerPage = () => {
  const { questionID, question, reports, handleNewComment, handleNewAnswer, handleQuestionUpdate } =
    useAnswerPage();

  if (!question) {
    return null;
  }

  return (
    <>
      <div style={{ float: 'right' }}>
        <FollowButton question={question} />
      </div>
      {question.askedBy === (question && question.askedBy) && reports.length > 0 && (
        <div
          className='right_padding'
          style={{
            background: '#fff3cd',
            border: '1px solid #ffeeba',
            color: '#856404',
            padding: '8px 12px',
            marginBottom: '12px',
          }}>
          <strong>This post has been reported</strong>
          <div style={{ marginTop: 6 }}>
            {reports.slice(0, 3).map((r, idx) => (
              <div key={idx}>
                - {r.reason} (by {r.reporter})
              </div>
            ))}
            {reports.length > 3 && <div>…and {reports.length - 3} more</div>}
          </div>
        </div>
      )}
      <VoteComponent question={question} />
      <AnswerHeader ansCount={question.answers.length} title={question.title} />
      <QuestionBody
        question={question}
        views={question.views.length}
        text={question.text}
        askby={question.askedBy}
        meta={getMetaData(new Date(question.askDateTime))}
        onQuestionUpdate={handleQuestionUpdate}
      />
      <CommentSection
        comments={question.comments}
        handleAddComment={(comment: Comment) => handleNewComment(comment, 'question', questionID)}
      />
      {question.answers.map(a => (
        <AnswerView
          key={String(a._id)}
          text={a.text}
          ansBy={a.ansBy}
          meta={getMetaData(new Date(a.ansDateTime))}
          comments={a.comments}
          handleAddComment={(comment: Comment) =>
            handleNewComment(comment, 'answer', String(a._id))
          }
        />
      ))}
      <button
        className='btn btn-primary btn-lg ansButton'
        onClick={() => {
          handleNewAnswer();
        }}>
        <svg width='18' height='18' viewBox='0 0 24 24' fill='currentColor' style={{ marginRight: '8px' }}>
          <path d='M12 2l3.09 6.26L22 9l-5 4.87 1.18 6.88L12 17.77l-6.18 2.98L7 14.87 2 10l6.91-1.74L12 2z'/>
        </svg>
        Answer Question
      </button>
    </>
  );
};

export default AnswerPage;
