import './index.css';

interface ProfanityFilterModalProps {
  reason: string;
  cleanedText?: string;
  onClose: () => void;
}

const ProfanityFilterModal = ({ reason, cleanedText, onClose }: ProfanityFilterModalProps) => {
  return (
    <div
      className='modal-backdrop'
      role='presentation'
      onClick={onClose}
      aria-modal='true'
      aria-labelledby='profanity-filter-title'>
      <div className='modal-container' onClick={e => e.stopPropagation()}>
        <h2 className='modal-title' id='profanity-filter-title'>
          Profanity Filter Alert
        </h2>
        <p>{reason}</p>
        {cleanedText && (
          <div className='modal-preview'>
            <div className='modal-preview-label'>Suggested Clean Version</div>
            <p className='modal-preview-body'>{cleanedText}</p>
          </div>
        )}
        <button onClick={onClose} className='close-btn'>
          Close
        </button>
      </div>
    </div>
  );
};

export default ProfanityFilterModal;
