import React, { useState } from 'react';
import { API_BASE } from '../../../../services/api';
import { PopulatedDatabaseQuestion, Tag } from '../../../../types/types';
import useUserContext from '../../../../hooks/useUserContext';
import filter from 'leo-profanity';
import ProfanityFilterModal from '../../newQuestion/profanityFilterModal';
import './index.css';

interface EditQuestionFormProps {
  question: PopulatedDatabaseQuestion;
  onCancel: () => void;
  onSuccess: (updatedQuestion: PopulatedDatabaseQuestion) => void;
}

const EditQuestionForm: React.FC<EditQuestionFormProps> = ({ question, onCancel, onSuccess }) => {
  const { user } = useUserContext();
  const [title, setTitle] = useState(question.title);
  const [text, setText] = useState(question.text);
  const [tagNames, setTagNames] = useState(question.tags.map(tag => tag.name).join(' '));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [filterReason, setFilterReason] = useState('');
  const [errors, setErrors] = useState({
    title: '',
    text: '',
    tags: '',
    general: '',
  });

  const validateForm = (): boolean => {
    const newErrors = {
      title: '',
      text: '',
      tags: '',
      general: '',
    };

    if (!title.trim()) {
      newErrors.title = 'Title cannot be empty';
    } else if (title.length > 100) {
      newErrors.title = 'Title cannot be more than 100 characters';
    }

    if (!text.trim()) {
      newErrors.text = 'Question text cannot be empty';
    }

    if (!tagNames.trim()) {
      newErrors.tags = 'At least one tag is required';
    } else {
      const tags = tagNames.trim().split(/\s+/);
      if (tags.length > 5) {
        newErrors.tags = 'Cannot have more than 5 tags';
      }
      for (const tag of tags) {
        if (tag.length > 10) {
          newErrors.tags = 'Each tag cannot be more than 10 characters';
          break;
        }
      }
    }

    setErrors(newErrors);
    return !Object.values(newErrors).some(error => error);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Check for profanity before submitting
    const textToCheck = `${title} ${text} ${tagNames}`;
    const hits = filter.badWordsUsed(textToCheck);
    if (hits.length > 0) {
      setFilterReason(
        `Your post contains inappropriate language. Please remove: ${hits.join(', ')}`,
      );
      setIsFilterModalOpen(true);
      return;
    }

    setIsSubmitting(true);
    setErrors(prev => ({ ...prev, general: '' }));

    try {
      // Parse tags into the expected format
      const tags: Tag[] = tagNames
        .trim()
        .split(/\s+/)
        .map(tagName => ({
          name: tagName,
          description: `Tag for ${tagName}`,
        }));

      const response = await fetch(`${API_BASE}/api/question/editQuestion/${question._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title.trim(),
          text: text.trim(),
          tags,
          username: user.username,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to update question');
      }

      const updatedQuestion = await response.json();
      onSuccess(updatedQuestion);
    } catch (error) {
      setErrors(prev => ({
        ...prev,
        general: error instanceof Error ? error.message : 'Failed to update question',
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className='edit-question-form'>
      <div className='edit-form-header'>
        <h2>Edit Question</h2>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Title Field */}
        <div className='form-group'>
          <label htmlFor='edit-title'>Title *</label>
          <input
            id='edit-title'
            type='text'
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder='Enter question title'
            className={errors.title ? 'error' : ''}
            disabled={isSubmitting}
          />
          {errors.title && <span className='error-message'>{errors.title}</span>}
        </div>

        {/* Text Field */}
        <div className='form-group'>
          <label htmlFor='edit-text'>Question Details *</label>
          <textarea
            id='edit-text'
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder='Describe your question in detail'
            rows={8}
            className={errors.text ? 'error' : ''}
            disabled={isSubmitting}
          />
          {errors.text && <span className='error-message'>{errors.text}</span>}
        </div>

        {/* Tags Field */}
        <div className='form-group'>
          <label htmlFor='edit-tags'>Tags *</label>
          <input
            id='edit-tags'
            type='text'
            value={tagNames}
            onChange={e => setTagNames(e.target.value)}
            placeholder='Enter tags separated by spaces (e.g. javascript react nodejs)'
            className={errors.tags ? 'error' : ''}
            disabled={isSubmitting}
          />
          {errors.tags && <span className='error-message'>{errors.tags}</span>}
          <div className='help-text'>
            Add up to 5 tags, each up to 10 characters. Separate tags with spaces.
          </div>
        </div>

        {/* General Error */}
        {errors.general && <div className='api-error'>{errors.general}</div>}

        {/* Action Buttons */}
        <div className='form-actions'>
          <button type='button' onClick={onCancel} className='btn-cancel' disabled={isSubmitting}>
            Cancel
          </button>
          <button type='submit' className='btn-submit' disabled={isSubmitting}>
            {isSubmitting ? 'Updating...' : 'Update Question'}
          </button>
        </div>
      </form>

      {isFilterModalOpen && (
        <ProfanityFilterModal reason={filterReason} onClose={() => setIsFilterModalOpen(false)} />
      )}
    </div>
  );
};

export default EditQuestionForm;
