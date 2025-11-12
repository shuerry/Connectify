import './index.css';
import { PopulatedDatabaseQuestion } from '../../../../types/types';
import { useState } from 'react';

interface ReportDropdownProps {
  question: PopulatedDatabaseQuestion;
  onClose: () => void;
  onSubmit: (reason: string) => void;
}

/**
 * ReportDropdown component for reporting questions without a modal
 */
const ReportDropdown = ({ question, onClose, onSubmit }: ReportDropdownProps) => {
  const [reason, setReason] = useState('');

  const handleSubmit = () => {
    if (reason.trim()) {
      onSubmit(reason.trim());
      onClose();
    }
  };

  return (
    <div className='report-dropdown' onClick={e => e.stopPropagation()}>
      <div className='dropdown-header'>
        <span className='dropdown-title'>Report Post</span>
        <button className='dropdown-close' onClick={e => { e.stopPropagation(); onClose(); }}>
          <svg width='16' height='16' viewBox='0 0 24 24' fill='currentColor'>
            <path d='M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z' />
          </svg>
        </button>
      </div>
      
      <div className='report-content'>
        <textarea
          placeholder='Please describe the reason for reporting this post...'
          className='report-textarea'
          rows={4}
          value={reason}
          onChange={e => setReason(e.target.value)}
          onClick={e => e.stopPropagation()}
        />
      </div>

      <div className='report-footer'>
        <button 
          className='report-btn-submit'
          onClick={e => {
            e.stopPropagation();
            handleSubmit();
          }}
          disabled={!reason.trim()}>
          Report
        </button>
      </div>
    </div>
  );
};

export default ReportDropdown;