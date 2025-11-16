import { useState, useEffect } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  PopulatedDatabaseQuestion,
  PopulatedDatabaseQuestionVersion,
} from '../../../../types/types';
import { useQuestionVersions } from '../../../../hooks/useQuestionVersions';
import useUserContext from '../../../../hooks/useUserContext';
import './index.css';

interface QuestionVersionHistoryProps {
  question: PopulatedDatabaseQuestion;
  onVersionRollback?: (updatedQuestion: PopulatedDatabaseQuestion) => void;
}

/**
 * Component for displaying and managing question version history.
 * Allows users to view previous versions and rollback to them.
 */
const QuestionVersionHistory = ({ question, onVersionRollback }: QuestionVersionHistoryProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [versions, setVersions] = useState<PopulatedDatabaseQuestionVersion[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<PopulatedDatabaseQuestionVersion | null>(
    null,
  );
  const { getVersions, rollbackToVersion, isLoading, error } = useQuestionVersions();
  const { user } = useUserContext();

  // Check if current user is the author
  const canViewHistory = user.username === question.askedBy;

  const loadVersions = async () => {
    const loadedVersions = await getVersions(question._id.toString(), user.username);
    if (loadedVersions) {
      setVersions(loadedVersions);
    }
  };

  useEffect(() => {
    if (isOpen && canViewHistory && versions.length === 0) {
      loadVersions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, canViewHistory]);

  const handleToggleHistory = () => {
    setIsOpen(!isOpen);
    if (!isOpen && versions.length === 0) {
      loadVersions();
    }
  };

  const handleViewVersion = (version: PopulatedDatabaseQuestionVersion) => {
    setSelectedVersion(version);
  };

  const handleRollback = async (version: PopulatedDatabaseQuestionVersion) => {
    if (
      !window.confirm(
        `Are you sure you want to rollback to version ${version.versionNumber}? This will create a new version with the current state.`,
      )
    ) {
      return;
    }

    const updatedQuestion = await rollbackToVersion(
      question._id.toString(),
      version._id.toString(),
      user.username,
    );

    if (updatedQuestion && onVersionRollback) {
      onVersionRollback(updatedQuestion);
      setIsOpen(false);
      setSelectedVersion(null);
      // Reload versions to show the new version created during rollback
      await loadVersions();
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString();
  };

  if (!canViewHistory) {
    return null;
  }

  return (
    <div className='question-version-history'>
      <button
        className='version-history-btn'
        onClick={handleToggleHistory}
        title='View version history'>
        Version History
      </button>

      {isOpen && (
        <div className='version-history-modal'>
          <div className='version-history-header'>
            <h3>Question Version History</h3>
            <button className='close-btn' onClick={() => setIsOpen(false)}>
              ×
            </button>
          </div>

          {error && <div className='version-history-error'>{error}</div>}

          {isLoading && versions.length === 0 ? (
            <div className='version-history-loading'>Loading versions...</div>
          ) : versions.length === 0 ? (
            <div className='version-history-empty'>
              No previous versions found. This question has not been edited yet.
            </div>
          ) : (
            <div className='version-history-content'>
              <div className='version-list'>
                <h4>Previous Versions</h4>
                <div className='version-items'>
                  {versions.map(version => (
                    <div
                      key={version._id.toString()}
                      className={`version-item ${selectedVersion?._id.toString() === version._id.toString() ? 'selected' : ''}`}>
                      <div className='version-header'>
                        <span className='version-number'>Version {version.versionNumber}</span>
                        <span className='version-date'>{formatDate(version.createdAt)}</span>
                      </div>
                      <div className='version-actions'>
                        <button
                          className='view-version-btn'
                          onClick={() => handleViewVersion(version)}>
                          View
                        </button>
                        <button
                          className='rollback-btn'
                          onClick={() => handleRollback(version)}
                          disabled={isLoading}>
                          Rollback
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {selectedVersion && (
                <div className='version-preview'>
                  <h4>Version {selectedVersion.versionNumber} Preview</h4>
                  <div className='version-preview-content'>
                    <div className='version-preview-title'>
                      <strong>Title:</strong> {selectedVersion.title}
                    </div>
                    <div className='version-preview-text'>
                      <strong>Content:</strong>
                      <Markdown remarkPlugins={[remarkGfm]}>{selectedVersion.text}</Markdown>
                    </div>
                    <div className='version-preview-tags'>
                      <strong>Tags:</strong>
                      {selectedVersion.tags.map(tag => (
                        <span key={tag._id.toString()} className='version-tag'>
                          {tag.name}
                        </span>
                      ))}
                    </div>
                    <div className='version-preview-meta'>
                      <div>
                        <strong>Created:</strong> {formatDate(selectedVersion.createdAt)}
                      </div>
                      <div>
                        <strong>By:</strong> {selectedVersion.createdBy}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default QuestionVersionHistory;
