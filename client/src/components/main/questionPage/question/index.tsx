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
    <div
      className='question right_padding'
      onClick={() => {
        if (question._id) {
          handleAnswer(question._id);
        }
      }}>
      <div className='postStats'>
        <div>{question.answers.length || 0} answers</div>
        <div>{question.views.length} views</div>
      </div>
      <div className='question_mid'>
        <div className='postTitle'>{question.title}</div>
        <div className='question_tags'>
          {question.tags.map(tag => (
            <button
              key={String(tag._id)}
              className='question_tag_button'
              onClick={e => {
                e.stopPropagation();
                clickTag(tag.name);
              }}>
              {tag.name}
            </button>
          ))}
        </div>
      </div>
      <div className='lastActivity'>
        <div className='question_author'>{question.askedBy}</div>
        <div>&nbsp;</div>
        <div className='question_meta'>asked {getMetaData(new Date(question.askDateTime))}</div>
      </div>

      <button
        onClick={e => {
          e.stopPropagation();
          handleSaveClick(question);
        }}
        className='collections-btn'>
        Edit My Collections
      </button>

      <button
        onClick={e => {
          e.stopPropagation();
          openReportModal(question);
        }}
        className='collections-btn'
        style={{ marginLeft: '8px' }}>
        Report
      </button>

      {isModalOpen && selectedQuestion && (
        <SaveToCollectionModal question={selectedQuestion} onClose={closeModal} />
      )}

      {isReportOpen && reportTarget && (
        <div className='modal-backdrop' onClick={e => e.stopPropagation()}>
          <div className='modal-container' onClick={e => e.stopPropagation()}>
            <h2 className='modal-title'>Report Post</h2>
            <textarea
              placeholder='Describe the reason'
              style={{ width: '100%', height: '120px', marginBottom: '12px' }}
              onClick={e => e.stopPropagation()}
              onChange={() => {}}
              id='report-reason-input'
            />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className='close-btn' onClick={() => setReportOpen(false)}>
                Close
              </button>
              <button
                className='close-btn'
                onClick={e => {
                  e.stopPropagation();
                  const val = (
                    document.getElementById('report-reason-input') as HTMLTextAreaElement
                  ).value.trim();
                  if (val) submitReport(val);
                }}>
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionView;
