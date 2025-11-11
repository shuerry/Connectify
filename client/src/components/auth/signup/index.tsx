import { useState } from 'react';
import './index.css';
import { Link } from 'react-router-dom';
import useAuth from '../../../hooks/useAuth';
import PasswordStrength from './PasswordStrength';
import LegalModal from '../../legal/LegalModal';

/**
 * Modern signup form with enhanced UX, validation, and accessibility
 */
const Signup = () => {
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  
  const {
    username,
    password,
    passwordConfirmation,
    showPassword,
    err,
    handleSubmit,
    handleInputChange,
    togglePasswordVisibility,
  } = useAuth('signup');

  return (
    <div className='auth-container'>
      <div className='auth-card'>
        <div className='auth-header'>
          <div className='brand-logo'>
            <svg width='48' height='48' viewBox='0 0 24 24' fill='currentColor'>
              <path d='M12 2L13.09 8.26L22 9L17 14L18 22L12 19L6 22L7 14L2 9L10.91 8.26L12 2Z'/>
            </svg>
          </div>
          <h1 className='auth-title'>Join the Community!</h1>
          <p className='auth-subtitle'>Create your Stack Overflow account</p>
        </div>

        <form className='auth-form' onSubmit={handleSubmit}>
          <div className='form-group'>
            <label className='form-label' htmlFor='username-input'>
              <svg className='label-icon' width='20' height='20' viewBox='0 0 24 24' fill='currentColor'>
                <path d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/>
              </svg>
              Username
            </label>
            <input
              type='text'
              value={username}
              onChange={event => handleInputChange(event, 'username')}
              placeholder='Username'
              required
              className='form-input'
              id='username-input'
            />
            <div className='form-hint'>
              Choose a username that represents you in the community
            </div>
          </div>

          <div className='form-group'>
            <label className='form-label' htmlFor='password-input'>
              <svg className='label-icon' width='20' height='20' viewBox='0 0 24 24' fill='currentColor'>
                <path d='M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z'/>
              </svg>
              Password
            </label>
            <div className='password-input-wrapper'>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={event => handleInputChange(event, 'password')}
                placeholder='Create a secure password'
                required
                className='form-input'
                id='password-input'
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
            <PasswordStrength password={password} />
          </div>

          <div className='form-group'>
            <label className='form-label' htmlFor='confirm-password-input'>
              <svg className='label-icon' width='20' height='20' viewBox='0 0 24 24' fill='currentColor'>
                <path d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'/>
              </svg>
              Confirm Password
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={passwordConfirmation}
              onChange={e => handleInputChange(e, 'confirmPassword')}
              placeholder='Confirm your password'
              required
              className='form-input'
              id='confirm-password-input'
            />
          </div>

          <div className='form-options'>
            <label className='checkbox-label'>
              <input
                type='checkbox'
                className='checkbox-input'
                id='showPasswordToggle'
                checked={showPassword}
                onChange={togglePasswordVisibility}
              />
              <span className='checkbox-custom'></span>
              Show passwords
            </label>
          </div>

          {err && (
            <div className='error-alert'>
              <svg width='16' height='16' viewBox='0 0 24 24' fill='currentColor'>
                <path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z'/>
              </svg>
              {err}
            </div>
          )}

          <button type='submit' className='btn btn-primary btn-lg auth-submit'>
            <svg width='20' height='20' viewBox='0 0 24 24' fill='currentColor' style={{ marginRight: '8px' }}>
              <path d='M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z'/>
            </svg>
            Create Account
          </button>
        </form>

        <div className='auth-footer'>
          <p className='auth-switch'>
            Already have an account?{' '}
            <Link to='/' className='auth-link'>
              Sign in here
            </Link>
          </p>
          <div className='terms-notice'>
            By signing up, you agree to our{' '}
            <button className='terms-link' onClick={() => setShowTerms(true)}>Terms of Service</button>
            {' '}and{' '}
            <button className='terms-link' onClick={() => setShowPrivacy(true)}>Privacy Policy</button>
          </div>
        </div>
      </div>
      
      {/* Legal Modals */}
      <LegalModal
        isOpen={showTerms}
        onClose={() => setShowTerms(false)}
        title="Terms of Service"
      >
        <div>
          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing and using this Stack Overflow-style platform ("Service"), you accept and agree to be bound by the terms and provision of this agreement.
          </p>
          
          <h2>2. User Accounts and Registration</h2>
          <p>
            You must provide accurate and complete registration information. You are responsible for maintaining the confidentiality of your account credentials.
          </p>
          
          <h2>3. Content Policy and Community Guidelines</h2>
          <p>Users may post questions, answers, comments, and other content related to programming and technology topics.</p>
          <h3>Prohibited Content:</h3>
          <ul>
            <li>Harassment, bullying, or personal attacks</li>
            <li>Spam, promotional content, or advertisements</li>
            <li>Hateful, discriminatory, or offensive language</li>
            <li>Copyright or trademark infringement</li>
            <li>Sharing of personal information (doxxing)</li>
            <li>Malicious code or security vulnerabilities</li>
          </ul>
          
          <h2>4. Content Moderation and Enforcement</h2>
          <p>We employ both automated systems and human moderators to maintain community standards. Violations may result in content removal, warnings, or account suspension.</p>
          
          <h2>5. Private Rooms and Communities</h2>
          <p>Users can create private communities with restricted access. Community creators act as moderators and community-specific rules may apply.</p>
          
          <h2>6. User Safety and Security</h2>
          <p>Use strong, unique passwords, never share personal information publicly, and report threatening or concerning behavior.</p>
        </div>
      </LegalModal>

      <LegalModal
        isOpen={showPrivacy}
        onClose={() => setShowPrivacy(false)}
        title="Privacy Policy"
      >
        <div>
          <h2>1. Information We Collect</h2>
          <h3>Account Information:</h3>
          <ul>
            <li>Username and email address</li>
            <li>Password (encrypted and securely stored)</li>
            <li>Profile information you choose to provide</li>
          </ul>
          
          <h3>Content and Activity:</h3>
          <ul>
            <li>Questions, answers, and comments you post</li>
            <li>Voting and reputation activity</li>
            <li>Direct messages and communications</li>
            <li>Gaming activity and statistics</li>
          </ul>
          
          <h2>2. How We Use Your Information</h2>
          <p>We use your information to provide and maintain the service, authenticate your identity, enable communication between users, and moderate content.</p>
          
          <h2>3. Information Sharing and Disclosure</h2>
          <p>Your username and public content is visible to other users. We keep your email address, direct messages, and account settings private.</p>
          
          <h2>4. Data Security</h2>
          <p>Passwords are encrypted, data transmission is protected with SSL/TLS encryption, and we conduct regular security audits.</p>
          
          <h2>5. Your Privacy Rights</h2>
          <p>You have the right to view, update, or delete your personal data. You can control privacy settings and communication preferences.</p>
          
          <h2>6. Children's Privacy</h2>
          <p>Our service is not intended for children under 13. We do not knowingly collect personal information from children under 13.</p>
        </div>
      </LegalModal>
    </div>
  );
};

export default Signup;
