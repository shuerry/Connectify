import { ReactNode } from 'react';
import './LegalModal.css';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

/**
 * Modal component for displaying legal documents like Terms of Service and Privacy Policy
 */
const LegalModal = ({ isOpen, onClose, title, children }: LegalModalProps) => {
  if (!isOpen) return null;

  return (
    <div className='legal-modal-backdrop' onClick={onClose}>
      <div className='legal-modal-container' onClick={e => e.stopPropagation()}>
        <div className='legal-modal-header'>
          <h2 className='legal-modal-title'>{title}</h2>
          <button className='legal-modal-close' onClick={onClose}>
            <svg width='24' height='24' viewBox='0 0 24 24' fill='currentColor'>
              <path d='M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z' />
            </svg>
          </button>
        </div>
        <div className='legal-modal-content'>{children}</div>
      </div>
    </div>
  );
};

export default LegalModal;
