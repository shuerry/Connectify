import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getUserByUsername,
  deleteUser,
  resetPassword,
  updateBiography,
  updateEmail,
  toggleOnlineStatus,
  toggleReadReceipts,
} from '../services/userService';
// ...existing code...
import { SafeDatabaseUser } from '../types/types';
import useUserContext from './useUserContext';
import logger from '../utils/logger';

/**
 * A custom hook to encapsulate all logic/state for the ProfileSettings component.
 */
const useProfileSettings = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { user: currentUser, socket } = useUserContext();

  // Local state
  const [userData, setUserData] = useState<SafeDatabaseUser | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [editBioMode, setEditBioMode] = useState(false);
  const [newBio, setNewBio] = useState('');
  const [editEmailMode, setEditEmailMode] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // For delete-user confirmation modal
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  const [showPassword, setShowPassword] = useState(false);

  const canEditProfile =
    currentUser.username && userData?.username ? currentUser.username === userData.username : false;

  useEffect(() => {
    if (!username) return;

    const fetchUserData = async () => {
      try {
        setLoading(true);
        const data = await getUserByUsername(username);
        setUserData(data);
      } catch (error) {
        setErrorMessage('Error fetching user profile');
        setUserData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [username]);

  useEffect(() => {
    if (!socket || !username) return;

    const handleUserUpdate = (payload: { user: SafeDatabaseUser; type: string }) => {
      if (payload.user.username === username) {
        setUserData(payload.user);
      }
    };

    const handleUserStatusUpdate = (payload: {
      username: string;
      isOnline: boolean;
      showOnlineStatus: boolean;
    }) => {
      if (payload.username === username && userData) {
        setUserData({
          ...userData,
          isOnline: payload.isOnline,
          showOnlineStatus: payload.showOnlineStatus,
        });
      }
    };

    socket.on('userUpdate', handleUserUpdate);
    socket.on('userStatusUpdate', handleUserStatusUpdate);

    return () => {
      socket.off('userUpdate', handleUserUpdate);
      socket.off('userStatusUpdate', handleUserStatusUpdate);
    };
  }, [socket, username, userData]);

  /**
   * Toggles the visibility of the password fields.
   */
  const togglePasswordVisibility = () => {
    setShowPassword(prevState => !prevState);
  };

  /**
   * Validate the password fields before attempting to reset.
   */
  const validatePasswords = () => {
    if (newPassword.trim() === '' || confirmNewPassword.trim() === '') {
      setErrorMessage('Please enter and confirm your new password.');
      return false;
    }
    if (newPassword !== confirmNewPassword) {
      setErrorMessage('Passwords do not match.');
      return false;
    }
    return true;
  };

  /**
   * Handler for resetting the password
   */
  const handleResetPassword = async () => {
    if (!username) return;
    if (!validatePasswords()) {
      return;
    }
    try {
      await resetPassword(username, newPassword);
      setSuccessMessage('Password reset successful!');
      setErrorMessage(null);
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (error) {
      setErrorMessage('Failed to reset password.');
      setSuccessMessage(null);
    }
  };

  const handleUpdateBiography = async () => {
    if (!username) return;
    try {
      // Await the async call to update the biography
      const updatedUser = await updateBiography(username, newBio);

      // Ensure state updates occur sequentially after the API call completes
      await new Promise(resolve => {
        setUserData(updatedUser); // Update the user data
        setEditBioMode(false); // Exit edit mode
        resolve(null); // Resolve the promise
      });

      setSuccessMessage('Biography updated!');
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage('Failed to update biography.');
      setSuccessMessage(null);
    }
  };

  /**
   * Handler for updating the email
   */
  const handleUpdateEmail = async () => {
    if (!username) return;
    try {
      logger.info('Attempting to update email with:', { username, newEmail }); // Debugging log
      await updateEmail(username, newEmail);
      logger.info('Passed updateEmail');

      setUserData(prev => {
        if (!prev) return prev;

        const updatedUser = {
          ...prev,
          emailVerified: false,
          emailVerification: {
            ...(prev.emailVerification ?? {}),
            pendingEmail: newEmail,
          },
        };

        logger.info('Updated userData state:', updatedUser); // Debugging log
        return updatedUser;
      });

      setEditEmailMode(false);
      setSuccessMessage('Verification email sent. Please check your spam folder.');
      setErrorMessage(null);
    } catch (error) {
      logger.error('Error in handleUpdateEmail:', error); // Debugging log
      setErrorMessage('Failed to update email.');
      setSuccessMessage(null);
    }
  };

  /**
   * Handler for deleting the user (triggers confirmation modal)
   */
  const handleDeleteUser = () => {
    if (!username) return;
    setShowConfirmation(true);
    setPendingAction(() => async () => {
      try {
        await deleteUser(username);
        setSuccessMessage(`User "${username}" deleted successfully.`);
        setErrorMessage(null);
        navigate('/');
      } catch (error) {
        setErrorMessage('Failed to delete user.');
        setSuccessMessage(null);
      } finally {
        setShowConfirmation(false);
      }
    });
  };

  const handleViewCollectionsPage = () => {
    navigate(`/collections/${username}`);
    return;
  };

  /**
   * Handler for toggling online status visibility
   */
  const handleToggleOnlineStatus = async () => {
    if (!username) return;
    try {
      const updatedUser = await toggleOnlineStatus(username);
      setUserData(updatedUser);
      setSuccessMessage(
        `Online status visibility ${updatedUser.showOnlineStatus ? 'enabled' : 'disabled'}`,
      );
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage('Failed to toggle online status visibility.');
      setSuccessMessage(null);
    }
  };

  /**
   * Handler for toggling read receipts preference
   */
  const handleToggleReadReceipts = async () => {
    if (!username) return;
    try {
      const updatedUser = await toggleReadReceipts(username);
      setUserData(updatedUser);
      setSuccessMessage(
        `Read receipts ${updatedUser.readReceiptsEnabled ? 'enabled' : 'disabled'}`,
      );
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage('Failed to toggle read receipts.');
      setSuccessMessage(null);
    }
  };

  return {
    userData,
    newPassword,
    confirmNewPassword,
    setNewPassword,
    setConfirmNewPassword,
    loading,
    editBioMode,
    setEditBioMode,
    newBio,
    setNewBio,
    newEmail,
    setNewEmail,
    editEmailMode,
    setEditEmailMode,
    successMessage,
    errorMessage,
    showConfirmation,
    setShowConfirmation,
    pendingAction,
    setPendingAction,
    canEditProfile,
    showPassword,
    togglePasswordVisibility,
    handleResetPassword,
    handleUpdateBiography,
    handleUpdateEmail,
    handleDeleteUser,
    handleViewCollectionsPage,
    handleToggleOnlineStatus,
    handleToggleReadReceipts,
  };
};

export default useProfileSettings;
