import { useState } from 'react';
import { PopulatedDatabaseQuestion, PopulatedDatabaseQuestionVersion } from '../types/types';

interface UseQuestionVersionsReturn {
  getVersions: (
    qid: string,
    username: string,
  ) => Promise<PopulatedDatabaseQuestionVersion[] | null>;
  rollbackToVersion: (
    qid: string,
    versionId: string,
    username: string,
  ) => Promise<PopulatedDatabaseQuestion | null>;
  isLoading: boolean;
  error: string | null;
}

/**
 * Custom hook for managing question version history
 * Provides functionality to fetch version history and rollback to previous versions
 *
 * @returns {UseQuestionVersionsReturn}
 */
export const useQuestionVersions = (): UseQuestionVersionsReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getVersions = async (
    qid: string,
    username: string,
  ): Promise<PopulatedDatabaseQuestionVersion[] | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `http://localhost:8000/api/question/getQuestionVersions/${qid}?username=${encodeURIComponent(username)}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to fetch question versions');
      }

      const versions: PopulatedDatabaseQuestionVersion[] = await response.json();
      return versions;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const rollbackToVersion = async (
    qid: string,
    versionId: string,
    username: string,
  ): Promise<PopulatedDatabaseQuestion | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `http://localhost:8000/api/question/rollbackQuestion/${qid}/${versionId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username }),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to rollback question');
      }

      const updatedQuestion: PopulatedDatabaseQuestion = await response.json();
      return updatedQuestion;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    getVersions,
    rollbackToVersion,
    isLoading,
    error,
  };
};

export default useQuestionVersions;
