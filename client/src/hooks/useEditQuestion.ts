import { useState } from 'react';
import { PopulatedDatabaseQuestion, Tag } from '../types/types';

/**
 * Interface for the edit question request payload
 */
interface EditQuestionRequest {
  title: string;
  text: string;
  tags: Tag[];
  username: string;
}

/**
 * Interface for the hook's return value
 */
interface UseEditQuestionReturn {
  editQuestion: (
    qid: string,
    questionData: EditQuestionRequest,
  ) => Promise<PopulatedDatabaseQuestion | null>;
  isLoading: boolean;
  error: string | null;
}

/**
 * Custom hook for editing existing questions
 * Provides functionality to update a question's title, text, and tags
 *
 * @returns {UseEditQuestionReturn}
 */
export const useEditQuestion = (): UseEditQuestionReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const editQuestion = async (
    qid: string,
    questionData: EditQuestionRequest,
  ): Promise<PopulatedDatabaseQuestion | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const SERVER = (import.meta as ImportMeta).env.VITE_SERVER_URL || '';
      const url = SERVER
        ? `${SERVER}/api/question/editQuestion/${qid}`
        : `/api/question/editQuestion/${qid}`;

      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(questionData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to update question');
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
    editQuestion,
    isLoading,
    error,
  };
};

export default useEditQuestion;
