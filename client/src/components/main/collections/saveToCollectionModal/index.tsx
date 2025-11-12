import './index.css';
import { PopulatedDatabaseQuestion } from '../../../../types/types';
import useSaveToCollectionModal from '../../../../hooks/useSaveToCollectionModal';

/**
 * SaveToCollectionModal component allows users to save a question to their collections.
 * It fetches the user's collections and displays them with options to save or unsave the question.
 */
const SaveToCollectionModal = ({
  question,
  onClose,
}: {
  question: PopulatedDatabaseQuestion;
  onClose: () => void;
}) => {
  const { collections, handleToggleSave } = useSaveToCollectionModal(question);

  return (
    <div className='modal-backdrop' onClick={onClose}>
      <div className='modal-container' onClick={e => e.stopPropagation()}>
        <div className='modal-header'>
          <h2 className='modal-title'>Save to Collection</h2>
          <button className='modal-close-btn' onClick={onClose}>
            <svg width='24' height='24' viewBox='0 0 24 24' fill='currentColor'>
              <path d='M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z' />
            </svg>
          </button>
        </div>
        
        {collections.length === 0 ? (
          <div className='no-collections'>
            <p>You don't have any collections yet.</p>
            <p>Create a collection first to save questions!</p>
          </div>
        ) : (
          <ul className='collection-list'>
            {collections.map(collection => {
              const isSaved = collection.questions.some(q => q._id === question._id);

              return (
                <li key={collection._id.toString()} className='collection-row'>
                  <span className='collection-name'>{collection.name}</span>
                  <span className={`status-tag ${isSaved ? 'saved' : 'unsaved'}`}>
                    {isSaved ? 'Saved' : 'Not Saved'}
                  </span>
                  <button
                    className='save-btn'
                    onClick={() => handleToggleSave(collection._id.toString())}>
                    {isSaved ? 'Unsave' : 'Save'}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

export default SaveToCollectionModal;
