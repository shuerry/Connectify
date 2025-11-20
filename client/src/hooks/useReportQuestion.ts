import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PopulatedDatabaseQuestion } from '../types/types';
import useUserContext from './useUserContext';
import { reportQuestion } from '../services/questionService';

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
const useReportQuestion = () => {
  const navigate = useNavigate();
  const { user } = useUserContext();
  const [isModalOpen, setModalOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<PopulatedDatabaseQuestion | null>(null);
  const [isReportOpen, setReportOpen] = useState(false);
  const [reportTarget, setReportTarget] = useState<PopulatedDatabaseQuestion | null>(null);
  const [hiddenQuestionIds, setHiddenQuestionIds] = useState<Set<string>>(new Set());
  const [reportDropdownOpen, setReportDropdownOpen] = useState<string | null>(null);

  const canReport = (question: PopulatedDatabaseQuestion): boolean => {
    if (!user || !user.username || !question) return false;
    return user.username !== question.askedBy;
  };

  const closeModal = () => {
    setSelectedQuestion(null);
    setModalOpen(false);
  };

  const openReportModal = (question: PopulatedDatabaseQuestion) => {
    const questionId = question._id.toString();
    setReportDropdownOpen(reportDropdownOpen === questionId ? null : questionId);
    setReportTarget(question);
  };

  const submitReport = async (reason: string) => {
    if (!reportTarget) return;
    await reportQuestion(String(reportTarget._id), user.username, reason);
    setReportOpen(false);
    setReportTarget(null);
    setHiddenQuestionIds(prev => new Set(prev).add(String(reportTarget._id)));
    navigate(`/home`);
  };

  const isHidden = (qid: string | undefined): boolean => {
    if (!qid) return false;
    return hiddenQuestionIds.has(String(qid));
  };

  const closeReportDropdown = () => {
    setReportDropdownOpen(null);
  };

  return {
    isModalOpen,
    selectedQuestion,
    closeModal,
    openReportModal,
    isReportOpen,
    reportTarget,
    submitReport,
    setReportOpen,
    isHidden,
    canReport,
    reportDropdownOpen,
    closeReportDropdown,
  };
};

export default useReportQuestion;
