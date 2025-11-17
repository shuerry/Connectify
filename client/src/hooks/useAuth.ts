import { useNavigate } from 'react-router-dom';
import { ChangeEvent, useState } from 'react';
import useLoginContext from './useLoginContext';
import { createUser, loginUser } from '../services/userService';

/**
 * Custom hook to manage authentication logic, including handling input changes,
 * form submission, password visibility toggling, remember me functionality, and error validation for both
 * login and signup processes.
 *
 * @param authType - Specifies the authentication type ('login' or 'signup').
 * @returns {Object} An object containing:
 *   - username: The current value of the username input.
 *   - password: The current value of the password input.
 *   - passwordConfirmation: The current value of the password confirmation input (for signup).
 *   - showPassword: Boolean indicating whether the password is visible.
 *   - rememberMe: Boolean indicating whether to remember the user login (for login).
 *   - err: The current error message, if any.
 *   - handleInputChange: Function to handle changes in input fields.
 *   - handleSubmit: Function to handle form submission.
 *   - togglePasswordVisibility: Function to toggle password visibility.
 *   - toggleRememberMe: Function to toggle remember me checkbox.
 */
const useAuth = (authType: 'login' | 'signup') => {
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [passwordConfirmation, setPasswordConfirmation] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [err, setErr] = useState<string>('');
  const { setUser } = useLoginContext();
  const navigate = useNavigate();

  /**
   * Toggles the visibility of the password input field.
   */
  const togglePasswordVisibility = () => {
    setShowPassword(prevState => !prevState);
  };

  /**
   * Toggles the remember me checkbox state.
   */
  const toggleRememberMe = () => {
    setRememberMe(prevState => !prevState);
  };

  /**
   * Handles changes in input fields and updates the corresponding state.
   *
   * @param e - The input change event.
   * @param field - The field being updated ('username', 'password', or 'confirmPassword').
   */
  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement>,
    field: 'username' | 'password' | 'confirmPassword',
  ) => {
    const fieldText = e.target.value.trim();

    if (field === 'username') {
      setUsername(fieldText);
    } else if (field === 'password') {
      setPassword(fieldText);
    } else if (field === 'confirmPassword') {
      setPasswordConfirmation(fieldText);
    }
  };

  /**
   * Validates the input fields for the form.
   * Ensures required fields are filled and passwords match (for signup).
   *
   * @returns {boolean} True if inputs are valid, false otherwise.
   */
  const validateInputs = (): boolean => {
    if (username === '' || password === '') {
      setErr('Please enter a username and password');
      return false;
    }

    if (authType === 'signup' && password !== passwordConfirmation) {
      setErr('Passwords do not match');
      return false;
    }

    return true;
  };

  /**
   * Handles the submission of the form.
   * Validates input, performs login/signup, and navigates to the home page on success.
   *
   * @param event - The form submission event.
   */
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validateInputs()) {
      return;
    }

    let user;

    try {
      if (authType === 'signup') {
        user = await createUser({ username, password });
      } else if (authType === 'login') {
        user = await loginUser({ username, password });
      } else {
        throw new Error('Invalid auth type');
      }

      setUser(user);

      // Handle remember me functionality for login
      if (authType === 'login' && rememberMe) {
        localStorage.setItem(
          'rememberedUser',
          JSON.stringify({
            user,
            timestamp: Date.now(),
            // Store for 30 days
            expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
          }),
        );
      }

      // Persist current user across page reloads so refreshing keeps the user on the same page.
      // We store under `currentUser` (no expiry). If you want explicit "remember me" semantics,
      // keep using `rememberedUser` as well.
      try {
        localStorage.setItem('currentUser', JSON.stringify(user));
      } catch (e) {
        // ignore localStorage errors
      }

      navigate('/home');
    } catch (error) {
      setErr((error as Error).message);
    }
  };

  return {
    username,
    password,
    passwordConfirmation,
    showPassword,
    rememberMe,
    err,
    handleInputChange,
    handleSubmit,
    togglePasswordVisibility,
    toggleRememberMe,
  };
};

export default useAuth;
