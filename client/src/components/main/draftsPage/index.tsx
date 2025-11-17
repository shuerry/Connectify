import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PopulatedDatabaseDraft } from '@fake-stack-overflow/shared';
import useDrafts from '../../../hooks/useDrafts';
import './index.css';

interface DraftsPageProps {
  userContext: {
    username: string;
  };
}

const DraftsPage: React.FC<DraftsPageProps> = ({ userContext }) => {
  const [drafts, setDrafts] = useState<PopulatedDatabaseDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const { getUserDrafts, deleteDraft } = useDrafts();

  const fetchUserDrafts = React.useCallback(async () => {
    try {
      setLoading(true);
      const data = await getUserDrafts(userContext.username);
      setDrafts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch drafts');
    } finally {
      setLoading(false);
    }
  }, [userContext.username, getUserDrafts]);

  useEffect(() => {
    if (!userContext.username) {
      navigate('/login');
      return;
    }

    fetchUserDrafts();
  }, [userContext.username, navigate, fetchUserDrafts]);

  const handleEditDraft = (draftId: string) => {
    navigate(`/new/question?draftId=${draftId}`);
  };

  const handleDeleteDraft = async (draftId: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete the draft "${title}"?`)) {
      return;
    }

    try {
      await deleteDraft(draftId, userContext.username);
      // Remove the draft from local state
      setDrafts(drafts.filter(draft => draft._id.toString() !== draftId));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete draft');
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const truncateText = (text: string, maxLength: number = 200) => {
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  if (loading) {
    return (
      <div className='drafts-page'>
        <div className='loading'>Loading your drafts...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='drafts-page'>
        <div className='error'>Error: {error}</div>
        <button onClick={fetchUserDrafts} className='retry-button'>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className='drafts-page'>
      <div className='drafts-header'>
        <h1>My Drafts</h1>
        <p className='drafts-count'>
          {drafts.length} {drafts.length === 1 ? 'draft' : 'drafts'}
        </p>
      </div>

      {drafts.length === 0 ? (
        <div className='no-drafts'>
          <h2>No drafts yet</h2>
          <p>Start writing a question and save it as a draft to see it here.</p>
          <button onClick={() => navigate('/new/question')} className='ask-question-button'>
            Ask a Question
          </button>
        </div>
      ) : (
        <div className='drafts-list'>
          {drafts.map(draft => (
            <div key={draft._id.toString()} className='draft-card'>
              <div className='draft-header'>
                <h3 className='draft-title'>{draft.title || 'Untitled Draft'}</h3>
                <div className='draft-meta'>
                  <span className='draft-date'>Last updated: {formatDate(draft.updatedAt)}</span>
                  {draft.community && (
                    <span className='draft-community'>in {draft.community.name}</span>
                  )}
                </div>
              </div>

              <div className='draft-content'>
                {draft.text && <p className='draft-text'>{truncateText(draft.text)}</p>}

                {draft.tags.length > 0 && (
                  <div className='draft-tags'>
                    {draft.tags.map(tag => (
                      <span key={tag._id.toString()} className='tag'>
                        {tag.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className='draft-actions'>
                <button
                  onClick={() => handleEditDraft(draft._id.toString())}
                  className='edit-button'>
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteDraft(draft._id.toString(), draft.title)}
                  className='delete-button'>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DraftsPage;
