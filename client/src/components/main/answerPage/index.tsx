import { useState } from 'react';
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
import SaveToCollectionModal from '../collections/saveToCollectionModal';

/**
 * AnswerPage component that displays the full content of a question along with its answers.
 * It also includes the functionality to vote, ask a new question, post a new answer, and edit the question.
 */
const AnswerPage = () => {
  const { 
    questionID, 
    question, 
    reports, 
    handleNewComment, 
    handleNewAnswer, 
    handleQuestionUpdate, 
    canReport, 
    openReportModal, 
    submitReport, 
    isReportOpen, 
    setReportOpen 
  } = useAnswerPage();

  const [isSaveModalOpen, setSaveModalOpen] = useState(false);

  if (!question) {
    return null;
  }

  return (
    <div className="reddit-answer-page">
      {/* Main Question Post */}
      <div className="reddit-post-container">
        {/* Vote Sidebar */}
        <div className="reddit-vote-sidebar">
          <VoteComponent question={question} />
        </div>

        {/* Post Content */}
        <div className="reddit-post-content">
          {/* Reports Section */}
          {question.askedBy === (question && question.askedBy) && reports.length > 0 && (
            <div className="reddit-report-warning">
              <div className="reddit-report-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
                </svg>
              </div>
              <div className="reddit-report-content">
                <strong>This post has been reported</strong>
                <div className="reddit-report-details">
                  {reports.slice(0, 3).map((r, idx) => (
                    <div key={idx}>• {r.reason} (by {r.reporter})</div>
                  ))}
                  {reports.length > 3 && <div>• …and {reports.length - 3} more</div>}
                </div>
              </div>
            </div>
          )}

          {/* Post Header */}
          <AnswerHeader title={question.title} />
          {/* Post Body */}
          <QuestionBody
            question={question}
            views={question.views.length}
            text={question.text}
            askby={question.askedBy}
            meta={getMetaData(new Date(question.askDateTime))}
            onQuestionUpdate={handleQuestionUpdate}
          />

          {/* Post Actions Bar */}
          <div className="reddit-post-actions">
            <button className="reddit-action-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-3 12H7v-2h10v2zm0-4H7V8h10v2zm0-4H7V4h10v2z"/>
              </svg>
              <span>{question.comments.length} Comments</span>
            </button>

            <button 
              className="reddit-action-btn"
              onClick={() => setSaveModalOpen(true)}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17 3H5c-1.11 0-2 .9-2 2v14l7-3 7 3V5c0-1.1-.89-2-2-2z"/>
              </svg>
              <span>Save</span>
            </button>

            {canReport() && (
              <button 
                className="reddit-action-btn report-btn"
                onClick={openReportModal}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6z" />
                </svg>
                <span>Report</span>
              </button>
            )}

            <div className="reddit-follow-wrapper">
              <FollowButton question={question} />
            </div>
          </div>

          {/* Comments Section */}
          <CommentSection
            comments={question.comments}
            handleAddComment={(comment: Comment) => handleNewComment(comment, 'question', questionID)}
          />
        </div>
      </div>

      {/* Answers Section */}
      <div className="reddit-answers-section">
        <div className="reddit-answers-header">
          <h3>{question.answers.length} {question.answers.length === 1 ? 'Answer' : 'Answers'}</h3>
        </div>
        
        {question.answers.map(a => (
          <div key={String(a._id)} className="reddit-answer-container">
            <AnswerView
              text={a.text}
              ansBy={a.ansBy}
              meta={getMetaData(new Date(a.ansDateTime))}
              comments={a.comments}
              handleAddComment={(comment: Comment) =>
                handleNewComment(comment, 'answer', String(a._id))
              }
            />
          </div>
        ))}

        {/* Answer Question Button */}
        <div className="reddit-answer-form-trigger">
          <button
            className="reddit-answer-button"
            onClick={handleNewAnswer}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
            </svg>
            Add an Answer
          </button>
        </div>
      </div>

      {/* Report Modal */}
      {isReportOpen && (
        <div className="modal-backdrop" onClick={() => setReportOpen(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Report Post</h2>
              <button className="modal-close" onClick={() => setReportOpen(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                </svg>
              </button>
            </div>
            <div className="modal-body">
              <textarea
                placeholder="Please describe the reason for reporting this post..."
                className="form-textarea"
                rows={5}
                onClick={(e) => e.stopPropagation()}
                id="report-reason-input"
              />
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setReportOpen(false)}>
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={(e) => {
                  e.stopPropagation();
                  const val = (document.getElementById('report-reason-input') as HTMLTextAreaElement).value.trim();
                  if (val) submitReport(val);
                }}
              >
                Submit Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save Collection Modal */}
      {isSaveModalOpen && question && (
        <SaveToCollectionModal 
          question={question} 
          onClose={() => setSaveModalOpen(false)} 
        />
      )}
    </div>
  );
};

export default AnswerPage;
