import './index.css';
import QuestionHeader from './header';
import QuestionView from './question';
import useQuestionPage from '../../../hooks/useQuestionPage';

/**
 * QuestionPage component renders a page displaying a list of questions
 * based on filters such as order and search terms.
 * It includes a header with order buttons and a button to ask a new question.
 */
const QuestionPage = () => {
  const { titleText, qlist, setQuestionOrder } = useQuestionPage();

  return (
    <div className="question-page">
      <QuestionHeader
        titleText={titleText}
        qcnt={qlist.length}
        setQuestionOrder={setQuestionOrder}
      />
      
      <div className="question-content">
        {qlist.length > 0 ? (
          <div id="question_list" className="question-list">
            {qlist.map(q => (
              <QuestionView question={q} key={q._id.toString()} />
            ))}
          </div>
        ) : titleText === 'Search Results' ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor">
                <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
              </svg>
            </div>
            <h3 className="empty-state-title">No Questions Found</h3>
            <p className="empty-state-description">
              We couldn't find any questions matching your search. Try adjusting your search terms or browse all questions.
            </p>
            <button className="btn btn-primary" onClick={() => window.location.reload()}>
              Browse All Questions
            </button>
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </div>
            <h3 className="empty-state-title">No Questions Yet</h3>
            <p className="empty-state-description">
              Be the first to ask a question in this community! Your question helps others learn and grow.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionPage;
