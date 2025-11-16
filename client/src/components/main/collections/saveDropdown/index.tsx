import './index.css';
import { PopulatedDatabaseQuestion } from '../../../../types/types';
import useSaveToCollectionModal from '../../../../hooks/useSaveToCollectionModal';

interface SaveDropdownProps {
  question: PopulatedDatabaseQuestion;
  onClose: () => void;
}

/**
 * SaveDropdown component for saving questions to collections without a modal
 */
const SaveDropdown = ({ question, onClose }: SaveDropdownProps) => {
  const { collections, handleToggleSave } = useSaveToCollectionModal(question);

  const handleSave = async (collectionId: string) => {
    await handleToggleSave(collectionId);
    // Don't close dropdown - let user continue saving to other collections
  };

  return (
    <div className='save-dropdown' onClick={e => e.stopPropagation()}>
      <div className='dropdown-header'>
        <span className='dropdown-title'>Save to Collection</span>
        <button
          className='dropdown-close'
          onClick={e => {
            e.stopPropagation();
            onClose();
          }}>
          <svg width='16' height='16' viewBox='0 0 24 24' fill='currentColor'>
            <path d='M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z' />
          </svg>
        </button>
      </div>

      {collections.length === 0 ? (
        <div className='no-collections-dropdown'>
          <p>No collections available</p>
          <small>Create a collection first!</small>
        </div>
      ) : (
        <div className='collection-list-dropdown'>
          {collections.map(collection => {
            const isSaved = collection.questions.some(q => q._id === question._id);

            return (
              <div key={collection._id.toString()} className='collection-item-dropdown'>
                <span className='collection-name-dropdown'>{collection.name}</span>
                <button
                  className={`save-btn-dropdown ${isSaved ? 'saved' : 'unsaved'}`}
                  onClick={e => {
                    e.stopPropagation();
                    handleSave(collection._id.toString());
                  }}>
                  {isSaved ? 'Unsave' : 'Save'}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SaveDropdown;
