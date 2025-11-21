import { useState, useEffect, useRef } from 'react';
import useNewQuestion from '../../../hooks/useNewQuestion';
import './index.css';
import ProfanityFilterModal from './profanityFilterModal';
import filter from 'leo-profanity';
import useDrafts from '../../../hooks/useDrafts';
import useUserContext from '../../../hooks/useUserContext';
import useAutosave from '../../../hooks/useAutosave';
import logger from '../../../utils/logger';
import { useLocation, useNavigate } from 'react-router-dom';

/**
 * NewQuestionPage component allows users to submit a new question with a title,
 * description, tags, and username - designed with Reddit-style layout.
 */
const NewQuestionPage = () => {
  const {
    title,
    setTitle,
    text,
    setText,
    tagNames,
    setTagNames,
    community,
    setCommunity,
    communityList,
    handleDropdownChange,
    titleErr,
    textErr,
    tagErr,
    postQuestion,
  } = useNewQuestion();

  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [filterReason, setFilterReason] = useState('');
  const {
    saveDraft: apiSaveDraft,
    updateDraft: apiUpdateDraft,
    getUserDrafts,
    deleteDraft: apiDeleteDraft,
  } = useDrafts();
  const { user } = useUserContext();
  const location = useLocation();
  const navigate = useNavigate();
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);
  const storageKey = `unsaved_question_${user?.username || 'guest'}`;

  useAutosave(
    storageKey,
    { title, text, tagNames, community },
    { setTitle, setText, setTagNames, setCommunity },
    { skipRestore: Boolean(new URLSearchParams(location.search).get('draftId')), communityList },
  );

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const draftId = params.get('draftId');
    if (!draftId) return;
    if (!user || !user.username) return;

    (async () => {
      try {
        const drafts = await getUserDrafts(user.username);
        const found = drafts.find(d => d._id.toString() === draftId);
        if (found) {
          setTitle(found.title || '');
          setText(found.text || '');
          setTagNames((found.tags || []).map((t: { name: string }) => t.name).join(' '));
          if (found.community) setCommunity(found.community as typeof community);
          setCurrentDraftId(found._id.toString());
        }
      } catch (e) {
        // ignore errors
      }
    })();
  }, [location.search, user, getUserDrafts, setTitle, setText, setTagNames, setCommunity]);

  // Keep a ref to the latest form values so the unmount cleanup can access
  // them without relying on stale closures. On unmount (navigating away),
  // persist a server-side draft if a title exists and the user is logged in.
  const latestForm = useRef({ title, text, tagNames, community, currentDraftId });

  useEffect(() => {
    latestForm.current = { title, text, tagNames, community, currentDraftId };
  }, [title, text, tagNames, community, currentDraftId]);

  useEffect(() => {
    return () => {
      const {
        title: latestTitle,
        text: latestText,
        tagNames: latestTags,
        community: latestCommunity,
        currentDraftId: latestDraftId,
      } = latestForm.current;

      // Only persist to server-side drafts if there's a non-empty title and the user is logged in.
      if (!latestTitle || latestTitle.trim() === '') return;
      if (!user || !user.username) return;

      const tagArr = (latestTags || '')
        .trim()
        .split(/\s+/)
        .filter(t => t.length > 0)
        .map(name => ({ name, description: `Tag for ${name}` }));

      const payload = {
        title: latestTitle.trim(),
        text: (latestText || '').trim(),
        tags: tagArr,
        askedBy: user.username,
        community: latestCommunity ? latestCommunity._id : null,
      };

      // Fire-and-forget: do not await in unmount cleanup. This will create a
      // draft on the server so it appears under "My Drafts". If there is an
      // existing draft id, try to update it; otherwise create a new draft.
      (async () => {
        try {
          if (latestDraftId) {
            // best-effort update

            await apiUpdateDraft(latestDraftId, payload);
          } else {
            await apiSaveDraft(payload);
          }

          // remove local autosave after server persisted (best-effort)
          try {
            localStorage.removeItem(storageKey);
          } catch (e) {
            // ignore
          }
        } catch (e) {
          // ignore failures on unmount
        }
      })();
    };
  }, [apiSaveDraft, apiUpdateDraft, storageKey, user]);

  return (
    <div className='reddit-new-question'>
      {/* Header Section */}
      <div className='reddit-header'>
        <div className='reddit-header-content'>
          <div className='reddit-breadcrumb'>
            <svg width='16' height='16' viewBox='0 0 24 24' fill='currentColor'>
              <path d='M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z' />
            </svg>
            <span>Create Post</span>
          </div>
          <h1 className='reddit-title'>Create a post</h1>
          <p className='reddit-subtitle'>
            Share your question with the community and get help from experts
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className='reddit-content'>
        <div className='reddit-layout'>
          {/* Main Form Column */}
          <div className='reddit-main-column'>
            {/* Community Selection Card */}
            <div className='reddit-community-card'>
              <div className='reddit-community-header'>
                <svg
                  className='reddit-community-icon'
                  width='20'
                  height='20'
                  viewBox='0 0 24 24'
                  fill='currentColor'>
                  <path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z' />
                </svg>
                <span className='reddit-community-title'>Choose a community</span>
                <span className='reddit-required'>*</span>
              </div>
              <select className='reddit-select' onChange={handleDropdownChange}>
                <option value=''>Search for a community</option>
                {communityList.map(com => (
                  <option key={com._id.toString()} value={com._id.toString()}>
                    r/{com.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Post Content Card */}
            <div className='reddit-card'>
              <div className='reddit-post-type'>
                <div className='reddit-post-tabs'>
                  <button className='reddit-tab reddit-tab-active'>
                    <svg width='20' height='20' viewBox='0 0 24 24' fill='currentColor'>
                      <path d='M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 2 2h8c1.1 0 2-.9 2-2V8l-6-6z' />
                    </svg>
                    Post
                  </button>
                </div>
              </div>

              {/* Title */}
              <div className='reddit-form-group'>
                <label className='reddit-label'>
                  <svg
                    className='reddit-icon'
                    width='20'
                    height='20'
                    viewBox='0 0 24 24'
                    fill='currentColor'>
                    <path d='M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 2 2h8c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z' />
                  </svg>
                  Title
                  <span className='reddit-required'>*</span>
                </label>
                <input
                  id='formTitleInput'
                  className={`reddit-input ${titleErr ? 'reddit-input-error' : ''}`}
                  type='text'
                  placeholder='An interesting title for your question...'
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  maxLength={100}
                />
                <div className='reddit-character-count'>
                  <span className={title.length > 80 ? 'reddit-count-warning' : ''}>
                    {title.length}/100
                  </span>
                </div>
                {titleErr && <div className='reddit-error'>{titleErr}</div>}
              </div>

              {/* Content */}
              <div className='reddit-form-group'>
                <label className='reddit-label'>
                  <svg
                    className='reddit-icon'
                    width='20'
                    height='20'
                    viewBox='0 0 24 24'
                    fill='currentColor'>
                    <path d='M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 2 2h8c1.1 0 2-.9 2-2V8l-6-6zm-2 16l-4-4 1.41-1.41L12 16.17l7.59-7.59L20.41 10 12 18z' />
                  </svg>
                  Body text
                </label>
                <div className='reddit-textarea-container'>
                  <textarea
                    id='formTextInput'
                    className={`reddit-textarea ${textErr ? 'reddit-input-error' : ''}`}
                    placeholder='Describe your question in detail. What have you tried? What are you hoping to achieve?'
                    value={text}
                    onChange={e => setText(e.target.value)}
                    rows={8}
                  />
                  <div className='reddit-formatting-toolbar'>
                    <div className='reddit-formatting-buttons'>
                      <button type='button' className='reddit-format-btn' title='Bold'>
                        <svg width='14' height='14' viewBox='0 0 24 24' fill='currentColor'>
                          <path d='M15.6 10.79c.97-.67 1.65-1.77 1.65-2.79 0-2.26-1.75-4-4-4H7v14h7.04c2.09 0 3.71-1.7 3.71-3.79 0-1.52-.86-2.82-2.15-3.42zM10 6.5h3c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-3v-3zm3.5 9H10v-3h3.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5z' />
                        </svg>
                      </button>
                      <button type='button' className='reddit-format-btn' title='Italic'>
                        <svg width='14' height='14' viewBox='0 0 24 24' fill='currentColor'>
                          <path d='M10 4v3h2.21l-3.42 8H6v3h8v-3h-2.21l3.42-8H18V4z' />
                        </svg>
                      </button>
                      <button type='button' className='reddit-format-btn' title='Link'>
                        <svg width='14' height='14' viewBox='0 0 24 24' fill='currentColor'>
                          <path d='M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z' />
                        </svg>
                      </button>
                    </div>
                    <div className='reddit-formatting-info'>
                      <svg width='16' height='16' viewBox='0 0 24 24' fill='currentColor'>
                        <path d='M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 2 2h8c1.1 0 2-.9 2-2V8l-6-6z' />
                      </svg>
                      Markdown supported
                    </div>
                  </div>
                </div>
                {textErr && <div className='reddit-error'>{textErr}</div>}
              </div>

              {/* Tags */}
              <div className='reddit-form-group'>
                <label className='reddit-label'>
                  <svg
                    className='reddit-icon'
                    width='20'
                    height='20'
                    viewBox='0 0 24 24'
                    fill='currentColor'>
                    <path d='M17.63 5.84C17.27 5.33 16.67 5 16 5L5 5.01C3.9 5.01 3 5.9 3 7v10c0 1.1.9 2 2 2h11c.67 0 1.27-.33 1.63-.84L22 12l-4.37-6.16z' />
                  </svg>
                  Flair & Tags
                  <span className='reddit-required'>*</span>
                </label>
                <input
                  id='formTagInput'
                  className={`reddit-input ${tagErr ? 'reddit-input-error' : ''}`}
                  type='text'
                  placeholder='Add tags separated by spaces: javascript react node.js'
                  value={tagNames}
                  onChange={e => setTagNames(e.target.value)}
                />
                <div className='reddit-hint'>
                  <svg width='16' height='16' viewBox='0 0 24 24' fill='currentColor'>
                    <path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z' />
                  </svg>
                  Add relevant tags to help others find your question
                </div>
                {tagErr && <div className='reddit-error'>{tagErr}</div>}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className='reddit-sidebar'>
            <div className='reddit-sidebar-card'>
              <div className='reddit-sidebar-header'>
                <svg width='20' height='20' viewBox='0 0 24 24' fill='currentColor'>
                  <path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z' />
                </svg>
                <span>Posting Guidelines</span>
              </div>
              <ul className='reddit-guidelines'>
                <li>Remember the human</li>
                <li>Be clear and descriptive in your title</li>
                <li>Provide context and details</li>
                <li>Use relevant tags</li>
                <li>Follow community rules</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className='reddit-actions'>
          <div className='reddit-actions-content'>
            <div className='reddit-actions-left'>
              <div className='reddit-draft-info'>
                <svg width='16' height='16' viewBox='0 0 24 24' fill='currentColor'>
                  <path d='M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z' />
                </svg>
                <span>Draft saved automatically</span>
              </div>
            </div>
            <div className='reddit-actions-right'>
              <button
                className='reddit-btn reddit-btn-secondary'
                onClick={async () => {
                  if (!user || !user.username) {
                    alert('You must be logged in to save drafts');
                    navigate('/login');
                    return;
                  }

                  const tagArr = tagNames
                    .trim()
                    .split(/\s+/)
                    .filter(t => t.length > 0)
                    .map(name => ({ name, description: `Tag for ${name}` }));

                  const payload = {
                    title: title.trim(),
                    text: text.trim(),
                    tags: tagArr,
                    askedBy: user.username,
                    community: community ? community._id : null,
                  };

                  try {
                    if (currentDraftId) {
                      await apiUpdateDraft(currentDraftId, payload);
                      // clear autosave since server draft now persists content
                      try {
                        localStorage.removeItem(storageKey);
                      } catch (e) {
                        // ignore localStorage errors
                        logger.warn('Failed to remove autosave key', e);
                      }
                      alert('Draft updated');
                    } else {
                      const saved = await apiSaveDraft(payload);
                      setCurrentDraftId(saved._id.toString());
                      try {
                        localStorage.removeItem(storageKey);
                      } catch (e) {
                        // ignore localStorage errors
                        logger.warn('Failed to remove autosave key', e);
                      }
                      alert('Draft saved');
                    }
                  } catch (err) {
                    alert(err instanceof Error ? err.message : 'Failed to save draft');
                  }
                }}>
                <svg width='16' height='16' viewBox='0 0 24 24' fill='currentColor'>
                  <path d='M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4z' />
                </svg>
                Save Draft
              </button>
              <button
                className='reddit-btn reddit-btn-primary'
                onClick={async () => {
                  const textToCheck = `${title} ${text} ${tagNames}`;
                  const hits = filter.badWordsUsed(textToCheck);
                  if (hits.length > 0) {
                    setFilterReason(
                      `Your post contains inappropriate language. Please remove: ${hits.join(', ')}`,
                    );
                    setIsFilterModalOpen(true);
                    return;
                  }

                  try {
                    // Await posting the question. postQuestion navigates on success.
                    await postQuestion();

                    // After successful post, if there was a server-side draft, delete it.
                    if (currentDraftId && user && user.username) {
                      try {
                        // best-effort delete; do not block navigation

                        await apiDeleteDraft(currentDraftId, user.username);
                        try {
                          localStorage.removeItem(storageKey);
                        } catch (e) {
                          // ignore
                        }
                      } catch (e) {
                        // ignore delete failures
                      }
                    }
                  } catch (e) {
                    // posting failed; errors are handled inside postQuestion
                  }
                }}>
                <svg width='20' height='20' viewBox='0 0 24 24' fill='currentColor'>
                  <path d='M2.01 21L23 12 2.01 3 2 10l15 2-15 2z' />
                </svg>
                Post
              </button>
            </div>
          </div>
        </div>
      </div>

      {isFilterModalOpen && (
        <ProfanityFilterModal reason={filterReason} onClose={() => setIsFilterModalOpen(false)} />
      )}
    </div>
  );
};

export default NewQuestionPage;
