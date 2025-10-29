import { useState } from 'react';
import './index.css';
import { PopulatedDatabaseQuestion, Tag } from '../../../../types/types';
import { useEditQuestion } from '../../../../hooks/useEditQuestion';
import useUserContext from '../../../../hooks/useUserContext';

/**
 * Interface for the EditQuestionForm component props
 */
interface EditQuestionFormProps {
  question: PopulatedDatabaseQuestion;
  onCancel: () => void;
  onSuccess: (updatedQuestion: PopulatedDatabaseQuestion) => void;
}

/**
 * EditQuestionForm component allows users to edit their own questions
 * Includes form validation and error handling
 */
const EditQuestionForm = ({ question, onCancel, onSuccess }: EditQuestionFormProps) => {
  const [title, setTitle] = useState(question.title);
  const [text, setText] = useState(question.text);
  const [tagString, setTagString] = useState(question.tags.map(tag => tag.name).join(' '));
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const { editQuestion, isLoading, error } = useEditQuestion();
  const { user } = useUserContext();

  /**
   * Validates the form inputs
   * @returns {boolean} - True if form is valid, false otherwise
   */
  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    // Validate title
    if (!title.trim()) {
      newErrors.title = 'Title is required';
    } else if (title.trim().length > 100) {
      newErrors.title = 'Title must be 100 characters or less';
    }

    // Validate text
    if (!text.trim()) {
      newErrors.text = 'Question text is required';
    }

    // Validate tags
    const tags = tagString.trim().split(/\s+/).filter(tag => tag.length > 0);
    if (tags.length === 0) {
      newErrors.tags = 'At least one tag is required';
    } else if (tags.length > 5) {
      newErrors.tags = 'Maximum 5 tags allowed';
    } else {
      // Check individual tag length
      const invalidTags = tags.filter(tag => tag.length > 20);
      if (invalidTags.length > 0) {
        newErrors.tags = 'Each tag must be 20 characters or less';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handles form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Convert tag string to Tag objects
    const tagNames = tagString.trim().split(/\s+/).filter(tag => tag.length > 0);
    const tags: Tag[] = tagNames.map(name => ({
      name: name.toLowerCase(),
      description: `Tag for ${name}`,
    }));

    const updatedQuestion = await editQuestion(question._id.toString(), {
      title: title.trim(),
      text: text.trim(),
      tags,
      username: user.username,
    });

    if (updatedQuestion) {
      onSuccess(updatedQuestion);
    }
  };

  return (
    <div className='edit-question-form'>
      <div className='edit-form-header'>
        <h2>Edit Question</h2>
      </div>

      <form onSubmit={handleSubmit}>
        <div className='form-group'>
          <label htmlFor='edit-title'>Question Title *</label>
          <input
            id='edit-title'
            type='text'
            value={title}
            onChange={e => setTitle(e.target.value)}
            className={errors.title ? 'error' : ''}
            placeholder='Enter question title'
            maxLength={100}
          />
          {errors.title && <span className='error-message'>{errors.title}</span>}
          <div className='character-count'>{title.length}/100</div>
        </div>

        <div className='form-group'>
          <label htmlFor='edit-text'>Question Text *</label>
          <textarea
            id='edit-text'
            value={text}
            onChange={e => setText(e.target.value)}
            className={errors.text ? 'error' : ''}
            placeholder='Enter question details'
            rows={8}
          />
          {errors.text && <span className='error-message'>{errors.text}</span>}
          <div className='help-text'>
            <i>Markdown formatting is supported</i>
          </div>
        </div>

        <div className='form-group'>
          <label htmlFor='edit-tags'>Tags *</label>
          <input
            id='edit-tags'
            type='text'
            value={tagString}
            onChange={e => setTagString(e.target.value)}
            className={errors.tags ? 'error' : ''}
            placeholder='Enter tags separated by spaces (e.g. javascript react nodejs)'
          />
          {errors.tags && <span className='error-message'>{errors.tags}</span>}
          <div className='help-text'>
            Enter tags separated by spaces. Maximum 5 tags, each up to 20 characters.
          </div>
        </div>

        {error && <div className='error-message api-error'>{error}</div>}

        <div className='form-actions'>
          <button
            type='button'
            onClick={onCancel}
            className='btn-cancel'
            disabled={isLoading}
          >
            Cancel
          </button>
          <button type='submit' className='btn-submit' disabled={isLoading}>
            {isLoading ? 'Updating...' : 'Update Question'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditQuestionForm;