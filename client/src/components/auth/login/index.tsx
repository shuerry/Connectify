import './index.css';
import { Link } from 'react-router-dom';
import useAuth from '../../../hooks/useAuth';

/**
 * Renders a login form with username and password inputs, password visibility toggle,
 * error handling, and a link to the signup page.
 */
const Login = () => {
  const {
    username,
    password,
    showPassword,
    rememberMe,
    err,
    handleSubmit,
    handleInputChange,
    togglePasswordVisibility,
    toggleRememberMe,
  } = useAuth('login');

  return (
    <div className='auth-container'>
      <div className='auth-card'>
        <div className='auth-header'>
          <div className='brand-logo'>
            <svg width='48' height='48' viewBox='0 0 24 24' fill='currentColor'>
              <path d='M12 2L3.09 8.26L4 9L12 4L20 9L20.91 8.26L12 2ZM21 16V14L20 13.5V7.5L12 3L4 7.5V13.5L3 14V16L4 16.5V19C4 19.5 4.4 20 5 20H19C19.6 20 20 19.5 20 19V16.5L21 16ZM18 18H6V15L12 12L18 15V18Z' />
            </svg>
          </div>
          <h1 className='auth-title'>Welcome Back!</h1>
          <p className='auth-subtitle'>Sign in to your Stack Overflow account</p>
        </div>

        <form className='auth-form' onSubmit={handleSubmit}>
          <div className='form-group'>
            <label className='form-label' htmlFor='username-input'>
              <svg
                className='label-icon'
                width='20'
                height='20'
                viewBox='0 0 24 24'
                fill='currentColor'>
                <path d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z' />
              </svg>
              Username
            </label>
            <input
              type='text'
              value={username}
              onChange={event => handleInputChange(event, 'username')}
              placeholder='Enter your username'
              required
              className='form-input'
              id='username-input'
            />
          </div>

          <div className='form-group'>
            <label className='form-label' htmlFor='password-input'>
              <svg
                className='label-icon'
                width='20'
                height='20'
                viewBox='0 0 24 24'
                fill='currentColor'>
                <path d='M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z' />
              </svg>
              Password
            </label>
            <div className='password-input-wrapper'>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={event => handleInputChange(event, 'password')}
                placeholder='Enter your password'
                required
                className='form-input'
                id='password-input'
              />
              <button
                type='button'
                className='password-toggle-external'
                onClick={togglePasswordVisibility}
                aria-label={showPassword ? 'Hide password' : 'Show password'}>
                <svg width='20' height='20' viewBox='0 0 24 24' fill='currentColor'>
                  {showPassword ? (
                    <path d='M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z' />
                  ) : (
                    <path d='M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z' />
                  )}
                </svg>
              </button>
            </div>
          </div>

          <div className='form-options'>
            <label className='checkbox-label'>
              <input
                type='checkbox'
                className='checkbox-input'
                id='rememberMeToggle'
                checked={rememberMe}
                onChange={toggleRememberMe}
              />
              <span className='checkbox-custom'></span>
              Remember me
            </label>
            <Link to='/forgot-password' className='forgot-link'>
              Forgot password?
            </Link>
          </div>

          {err && (
            <div className='error-alert'>
              <svg width='16' height='16' viewBox='0 0 24 24' fill='currentColor'>
                <path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z' />
              </svg>
              {err}
            </div>
          )}

          <button type='submit' className='btn btn-primary btn-lg auth-submit'>
            <svg
              width='20'
              height='20'
              viewBox='0 0 24 24'
              fill='currentColor'
              style={{ marginRight: '8px' }}>
              <path d='M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z' />
            </svg>
            Sign In
          </button>
        </form>

        <div className='auth-footer'>
          <p className='auth-switch'>
            Don't have an account?{' '}
            <Link to='/signup' className='auth-link'>
              Create one here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
