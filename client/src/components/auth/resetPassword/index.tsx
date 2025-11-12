import './index.css';
import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { resetPasswordWithToken } from '../../../services/userService';

/**
 * Renders a reset password form that allows users to set a new password using a reset token.
 */
const ResetPassword = () => {
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setError('Invalid reset link. Please request a new password reset.');
    }
  }, [token]);

  const togglePasswordVisibility = () => {
    setShowPassword(prevState => !prevState);
  };

  const validateInputs = (): boolean => {
    if (!password || !confirmPassword) {
      setError('Please fill in all fields');
      return false;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    return true;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    if (!token) {
      setError('Invalid reset token');
      return;
    }

    if (!validateInputs()) {
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await resetPasswordWithToken(token, password);
      setIsSuccess(true);
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className='auth-container'>
        <div className='auth-card'>
          <div className='auth-header'>
            <div className='brand-logo'>
              <svg width='48' height='48' viewBox='0 0 24 24' fill='currentColor'>
                <path d='M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z'/>
              </svg>
            </div>
            <h1 className='auth-title'>Password reset successful!</h1>
            <p className='auth-subtitle'>Your password has been updated. You'll be redirected to the login page shortly.</p>
          </div>

          <div className='auth-footer'>
            <p className='auth-switch'>
              <Link to='/login' className='auth-link'>
                Go to sign in now
              </Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='auth-container'>
      <div className='auth-card'>
        <div className='auth-header'>
          <div className='brand-logo'>
            <svg width='48' height='48' viewBox='0 0 24 24' fill='currentColor'>
              <path d='M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z'/>
            </svg>
          </div>
          <h1 className='auth-title'>Reset your password</h1>
          <p className='auth-subtitle'>Enter your new password below</p>
        </div>

        <form className='auth-form' onSubmit={handleSubmit}>
          <div className='form-group'>
            <label className='form-label' htmlFor='password-input'>
              <svg className='label-icon' width='20' height='20' viewBox='0 0 24 24' fill='currentColor'>
                <path d='M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z'/>
              </svg>
              New Password
            </label>
            <div className='password-input-wrapper'>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder='Enter your new password'
                required
                className='form-input'
                id='password-input'
                disabled={isLoading}
                minLength={6}
              />
              <button
                type='button'
                className='password-toggle-external'
                onClick={togglePasswordVisibility}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                <svg width='20' height='20' viewBox='0 0 24 24' fill='currentColor'>
                  {showPassword ? (
                    <path d='M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z'/>
                  ) : (
                    <path d='M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z'/>
                  )}
                </svg>
              </button>
            </div>
          </div>

          <div className='form-group'>
            <label className='form-label' htmlFor='confirm-password-input'>
              <svg className='label-icon' width='20' height='20' viewBox='0 0 24 24' fill='currentColor'>
                <path d='M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z'/>
              </svg>
              Confirm New Password
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder='Confirm your new password'
              required
              className='form-input'
              id='confirm-password-input'
              disabled={isLoading}
              minLength={6}
            />
          </div>

          {error && (
            <div className='error-alert'>
              <svg width='16' height='16' viewBox='0 0 24 24' fill='currentColor'>
                <path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z'/>
              </svg>
              {error}
            </div>
          )}

          <button 
            type='submit' 
            className='btn btn-primary btn-lg auth-submit'
            disabled={isLoading || !token}
          >
            {isLoading ? (
              <>
                <svg width='20' height='20' viewBox='0 0 24 24' fill='currentColor' style={{ marginRight: '8px' }} className='spinning'>
                  <path d='M12,1A11,11,0,1,0,23,12,11,11,0,0,0,12,1Zm0,19a8,8,0,1,1,8-8A8,8,0,0,1,12,20Z' opacity='.25'/>
                  <path d='M12,4a8,8,0,0,1,7.89,6.7A1.53,1.53,0,0,0,21.38,12h0a1.5,1.5,0,0,0,1.48-1.75,11,11,0,0,0-21.72,0A1.5,1.5,0,0,0,2.62,12h0a1.53,1.53,0,0,0,1.49-1.3A8,8,0,0,1,12,4Z'/>
                </svg>
                Updating password...
              </>
            ) : (
              <>
                <svg width='20' height='20' viewBox='0 0 24 24' fill='currentColor' style={{ marginRight: '8px' }}>
                  <path d='M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z'/>
                </svg>
                Update password
              </>
            )}
          </button>
        </form>

        <div className='auth-footer'>
          <p className='auth-switch'>
            Remember your password?{' '}
            <Link to='/login' className='auth-link'>
              Back to sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;