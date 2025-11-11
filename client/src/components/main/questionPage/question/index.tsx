import './index.css';
import { getMetaData } from '../../../../tool';
import { PopulatedDatabaseQuestion } from '../../../../types/types';
import SaveToCollectionModal from '../../collections/saveToCollectionModal';
import useQuestionView from '../../../../hooks/useQuestionView';

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
  const {
    clickTag,
    handleAnswer,
    handleSaveClick,
    closeModal,
    isModalOpen,
    selectedQuestion,
    openReportModal,
    isReportOpen,
    reportTarget,
    submitReport,
    setReportOpen,
    isHidden,
  } = useQuestionView();

  if (isHidden(String(question._id))) {
    return null;
  }

  return (
    <div className='question-card'>
      <div 
        className='question-content'
        onClick={() => {
          if (question._id) {
            handleAnswer(question._id);
          }
        }}
      >
        <div className='question-stats'>
          <div className='stat-item'>
            <div className='stat-number'>{question.answers.length || 0}</div>
            <div className='stat-label'>answers</div>
          </div>
          <div className='stat-item'>
            <div className='stat-number'>{question.views.length}</div>
            <div className='stat-label'>views</div>
          </div>
        </div>
        
        <div className='question-main'>
          <h3 className='question-title'>{question.title}</h3>
          
          <div className='question-tags'>
            {question.tags.map(tag => (
              <button
                key={String(tag._id)}
                className='tag-button'
                onClick={e => {
                  e.stopPropagation();
                  clickTag(tag.name);
                }}>
                {tag.name}
              </button>
            ))}
          </div>
          
          <div className='question-meta'>
            <div className='asked-by'>
              <span>asked by</span>
              <span className='author-name'>{question.askedBy}</span>
            </div>
            <div className='asked-time'>{getMetaData(new Date(question.askDateTime))}</div>
          </div>
        </div>
      </div>
      
      <div className='question-actions'>
        <button
          onClick={e => {
            e.stopPropagation();
            handleSaveClick(question);
          }}
          className='btn btn-secondary btn-sm'>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"/>
          </svg>
          Save to Collection
        </button>

        <button
          onClick={e => {
            e.stopPropagation();
            openReportModal(question);
          }}
          className='btn btn-outline btn-sm'>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6z"/>
          </svg>
          Report
        </button>
      </div>

      {isModalOpen && selectedQuestion && (
        <SaveToCollectionModal question={selectedQuestion} onClose={closeModal} />
      )}

      {isReportOpen && reportTarget && (
        <div className='modal-backdrop' onClick={e => e.stopPropagation()}>
          <div className='modal-container' onClick={e => e.stopPropagation()}>
            <div className='modal-header'>
              <h2 className='modal-title'>Report Post</h2>
              <button className='modal-close' onClick={() => setReportOpen(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
              </button>
            </div>
            <div className='modal-body'>
              <textarea
                placeholder='Please describe the reason for reporting this post...'
                className='form-textarea'
                rows={5}
                onClick={e => e.stopPropagation()}
                onChange={() => {}}
                id='report-reason-input'
              />
            </div>
            <div className='modal-footer'>
              <button className='btn btn-secondary' onClick={() => setReportOpen(false)}>
                Cancel
              </button>
              <button
                className='btn btn-danger'
                onClick={e => {
                  e.stopPropagation();
                  const val = (
                    document.getElementById('report-reason-input') as HTMLTextAreaElement
                  ).value.trim();
                  if (val) submitReport(val);
                }}>
                Submit Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionView;
