import './index.css';

const ContentFilterModal = ({
  reason,
  onClose,
}: {
  reason: string;
  onClose: () => void;
}) => {
  return (
    <div className='modal-backdrop' onClick={onClose}>
      <div className='modal-container' onClick={e => e.stopPropagation()}>
        <h2 className='modal-title'>Content Filter Alert</h2>
        <p>{reason}</p>
        <button onClick={onClose} className='close-btn'>
          Close
        </button>
      </div>
    </div>
  );
};

export default ContentFilterModal;


