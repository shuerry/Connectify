import React from 'react';

interface EditQuestionFormProps {
  onCancel: () => void;
}

const EditQuestionForm: React.FC<EditQuestionFormProps> = ({ onCancel }) => {
  // Placeholder implementation
  return (
    <div className='edit-question-form'>
      <h3>Edit Question</h3>
      <p>Edit functionality coming soon...</p>
      <button onClick={onCancel}>Cancel</button>
    </div>
  );
};

export default EditQuestionForm;
