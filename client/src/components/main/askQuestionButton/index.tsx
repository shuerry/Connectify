import { useNavigate } from 'react-router-dom';

/**
 * AskQuestionButton component that renders a button for navigating to the
 * "New Question" page. When clicked, it redirects the user to the page
 * where they can ask a new question.
 */
const AskQuestionButton = () => {
  const navigate = useNavigate();

  /**
   * Function to handle navigation to the "New Question" page.
   */
  const handleNewQuestion = () => {
    navigate('/new/question');
  };

  return (
    <button
      className='btn btn-primary'
      onClick={handleNewQuestion}
    >
      <svg width='18' height='18' viewBox='0 0 24 24' fill='currentColor' style={{ marginRight: '8px' }}>
        <path d='M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z'/>
      </svg>
      Ask a Question
    </button>
  );
};

export default AskQuestionButton;
