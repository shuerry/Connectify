import './index.css';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPassword } from '../../../services/userService';

/**
 * Renders a forgot password form that allows users to request a password reset email.
 */
const ForgotPassword = () => {
  const [usernameOrEmail, setUsernameOrEmail] = useState<string>('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    if (!usernameOrEmail.trim()) {
      setError('Please enter your username or email address');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await forgotPassword(usernameOrEmail.trim());
      setIsSubmitted(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className='auth-container'>
        <div className='auth-card'>
          <div className='auth-header'>
            <div className='brand-logo'>
              <svg width='48' height='48' viewBox='0 0 24 24' fill='currentColor'>
                <path d='M12 2L3.09 8.26L4 9L12 4L20 9L20.91 8.26L12 2ZM21 16V14L20 13.5V7.5L12 3L4 7.5V13.5L3 14V16L4 16.5V19C4 19.5 4.4 20 5 20H19C19.6 20 20 19.5 20 19V16.5L21 16ZM18 18H6V15L12 12L18 15V18Z'/>
              </svg>
            </div>
            <h1 className='auth-title'>Check your email</h1>
            <p className='auth-subtitle'>If an account exists, we've sent a password reset link to your email address.</p>
          </div>

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
  }

  return (
    <div className='auth-container'>
      <div className='auth-card'>
        <div className='auth-header'>
          <div className='brand-logo'>
            <svg width='48' height='48' viewBox='0 0 24 24' fill='currentColor'>
              <path d='M12 2L3.09 8.26L4 9L12 4L20 9L20.91 8.26L12 2ZM21 16V14L20 13.5V7.5L12 3L4 7.5V13.5L3 14V16L4 16.5V19C4 19.5 4.4 20 5 20H19C19.6 20 20 19.5 20 19V16.5L21 16ZM18 18H6V15L12 12L18 15V18Z'/>
            </svg>
          </div>
          <h1 className='auth-title'>Forgot password?</h1>
          <p className='auth-subtitle'>Enter your username or email address and we'll send you a link to reset your password.</p>
        </div>

        <form className='auth-form' onSubmit={handleSubmit}>
          <div className='form-group'>
            <label className='form-label' htmlFor='username-email-input'>
              <svg className='label-icon' width='20' height='20' viewBox='0 0 24 24' fill='currentColor'>
                <path d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/>
              </svg>
              Username or Email
            </label>
            <input
              type='text'
              value={usernameOrEmail}
              onChange={(e) => setUsernameOrEmail(e.target.value)}
              placeholder='Enter your username or email address'
              required
              className='form-input'
              id='username-email-input'
              disabled={isLoading}
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
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <svg width='20' height='20' viewBox='0 0 24 24' fill='currentColor' style={{ marginRight: '8px' }} className='spinning'>
                  <path d='M12,1A11,11,0,1,0,23,12,11,11,0,0,0,12,1Zm0,19a8,8,0,1,1,8-8A8,8,0,0,1,12,20Z' opacity='.25'/>
                  <path d='M12,4a8,8,0,0,1,7.89,6.7A1.53,1.53,0,0,0,21.38,12h0a1.5,1.5,0,0,0,1.48-1.75,11,11,0,0,0-21.72,0A1.5,1.5,0,0,0,2.62,12h0a1.53,1.53,0,0,0,1.49-1.3A8,8,0,0,1,12,4Z'/>
                </svg>
                Sending...
              </>
            ) : (
              <>
                <svg width='20' height='20' viewBox='0 0 24 24' fill='currentColor' style={{ marginRight: '8px' }}>
                  <path d='M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z'/>
                </svg>
                Send reset link
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

export default ForgotPassword;