import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PopulatedDatabaseQuestion } from '../types/types';
import { ObjectId } from 'mongodb';

/**
 * Custom hook to manage the state and behavior of the question view.
 *
 * @returns An object containing the following:
 * - isModalOpen: A boolean indicating if the modal is open
 * - selectedQuestion: The currently selected question
 * - clickTag: A function to handle tag clicks
 * - handleAnswer: A function to navigate to the question page
 * - handleSaveClick: A function to open the save modal
 * - closeModal: A function to close the modal
 */
const useQuestionView = () => {
  const navigate = useNavigate();
  const [isModalOpen, setModalOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<PopulatedDatabaseQuestion | null>(null);
  const [saveDropdownOpen, setSaveDropdownOpen] = useState<string | null>(null);

  /**
   * Function to navigate to the home page with the specified tag as a search parameter.
   *
   * @param tagName - The name of the tag to be added to the search parameters.
   */
  const clickTag = (tagName: string) => {
    const searchParams = new URLSearchParams();
    searchParams.set('tag', tagName);

    navigate(`/home?${searchParams.toString()}`);
  };

  /**
   * Function to navigate to the specified question page based on the question ID.
   *
   * @param questionID - The ID of the question to navigate to.
   */
  const handleAnswer = (questionID: ObjectId) => {
    navigate(`/question/${questionID}`);
  };

  const handleSaveClick = (question: PopulatedDatabaseQuestion) => {
    const questionId = question._id.toString();
    setSaveDropdownOpen(saveDropdownOpen === questionId ? null : questionId);
    setSelectedQuestion(question);
  };

  const closeModal = () => {
    setSelectedQuestion(null);
    setModalOpen(false);
  };

  const closeSaveDropdown = () => {
    setSaveDropdownOpen(null);
  };

  return {
    isModalOpen,
    selectedQuestion,
    clickTag,
    handleAnswer,
    handleSaveClick,
    closeModal,
    saveDropdownOpen,
    closeSaveDropdown,
  };
};

export default useQuestionView;
