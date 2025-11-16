import { useNavigate } from 'react-router-dom';
import useHeader from '../../hooks/useHeader';
import './index.css';
import useUserContext from '../../hooks/useUserContext';
import NotificationButton from '../main/notificationsButton';

/**
 * Modern Header component with improved design and user experience.
 * Features a clean layout, better search functionality, and modern user controls.
 */
const Header = () => {
  const { val, handleInputChange, handleKeyDown, handleSignOut } = useHeader();
  const { user: currentUser } = useUserContext();
  const navigate = useNavigate();

  return (
    <header className='modern-header'>
      <div className='header-container'>
        {/* Logo Section */}
        <div className='logo-section'>
          <button
            className='logo-button'
            onClick={() => navigate('/home')}
            aria-label='Go to home page'>
            <div className='logo-icon'>
              <svg width='32' height='32' viewBox='0 0 32 32' fill='none'>
                <path
                  d='M4 12L16 2L28 12V26C28 27.1046 27.1046 28 26 28H6C4.89543 28 4 27.1046 4 26V12Z'
                  stroke='currentColor'
                  strokeWidth='2'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                />
                <path
                  d='M12 28V16H20V28'
                  stroke='currentColor'
                  strokeWidth='2'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                />
              </svg>
            </div>
            <span className='logo-text'>
              Stack<span className='logo-accent'>Flow</span>
            </span>
          </button>
        </div>

        {/* Search Section */}
        <div className='search-section'>
          <div className='search-container'>
            <div className='search-icon'>
              <svg width='20' height='20' viewBox='0 0 24 24' fill='none'>
                <circle cx='11' cy='11' r='8' stroke='currentColor' strokeWidth='2' />
                <path d='m21 21-4.35-4.35' stroke='currentColor' strokeWidth='2' />
              </svg>
            </div>
            <input
              id='searchBar'
              className='search-input'
              placeholder='Search questions, answers, tags...'
              type='text'
              value={val}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              aria-label='Search'
            />
            {val && (
              <button
                className='search-clear'
                onClick={() =>
                  handleInputChange({
                    target: { value: '' },
                  } as React.ChangeEvent<HTMLInputElement>)
                }
                aria-label='Clear search'>
                <svg width='16' height='16' viewBox='0 0 24 24' fill='none'>
                  <line x1='18' y1='6' x2='6' y2='18' stroke='currentColor' strokeWidth='2' />
                  <line x1='6' y1='6' x2='18' y2='18' stroke='currentColor' strokeWidth='2' />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* User Actions Section */}
        <div className='user-actions'>
          {/* Quick Actions */}
          <div className='quick-actions'>
            <button className='action-button' onClick={() => navigate('/games')} title='Games'>
              <svg width='20' height='20' viewBox='0 0 24 24' fill='none'>
                <rect
                  x='2'
                  y='7'
                  width='20'
                  height='10'
                  rx='2'
                  stroke='currentColor'
                  strokeWidth='2'
                />
                <circle cx='6' cy='12' r='1' fill='currentColor' />
                <circle cx='18' cy='10' r='1' fill='currentColor' />
                <circle cx='18' cy='14' r='1' fill='currentColor' />
              </svg>
            </button>
            <button
              className='action-button'
              onClick={() => navigate('/messages')}
              title='Messages'>
              <svg width='20' height='20' viewBox='0 0 24 24' fill='none'>
                <path
                  d='M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z'
                  stroke='currentColor'
                  strokeWidth='2'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                />
              </svg>
            </button>
            <button
              className='action-button'
              onClick={() => navigate('/communities')}
              title='Communities'>
              <svg width='20' height='20' viewBox='0 0 24 24' fill='none'>
                <path
                  d='M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21'
                  stroke='currentColor'
                  strokeWidth='2'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                />
                <circle cx='9' cy='7' r='4' stroke='currentColor' strokeWidth='2' />
                <path
                  d='M23 21V19C23 18.1645 22.7155 17.3541 22.2094 16.6977C21.7033 16.0414 20.9998 15.5735 20.2 15.3613'
                  stroke='currentColor'
                  strokeWidth='2'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                />
                <path
                  d='M16 3.13C16.8003 3.3421 17.5043 3.8099 18.0106 4.4662C18.5168 5.1226 18.8013 5.9329 18.8013 6.7685C18.8013 7.6041 18.5168 8.4144 18.0106 9.0708C17.5043 9.7271 16.8003 10.1949 16 10.407'
                  stroke='currentColor'
                  strokeWidth='2'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                />
              </svg>
            </button>
          </div>

          {/* User Profile Dropdown */}
          <div className='user-profile-section'>
            <div className='user-avatar'>
              <span className='avatar-text'>
                {currentUser?.username?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            <div className='user-menu'>
              <button
                className='user-menu-item'
                onClick={() => navigate(`/user/${currentUser.username}`)}>
                <svg width='16' height='16' viewBox='0 0 24 24' fill='none'>
                  <path
                    d='M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21'
                    stroke='currentColor'
                    strokeWidth='2'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                  />
                  <circle cx='12' cy='7' r='4' stroke='currentColor' strokeWidth='2' />
                </svg>
                <span>View Profile</span>
              </button>
              <button className='user-menu-item' onClick={() => navigate('/settings')}>
                <svg width='16' height='16' viewBox='0 0 24 24' fill='none'>
                  <circle cx='12' cy='12' r='3' stroke='currentColor' strokeWidth='2' />
                  <path
                    d='M19.4 15C19.2669 15.3016 19.2272 15.6362 19.286 15.9606C19.3448 16.285 19.4995 16.5842 19.73 16.82L19.79 16.88C19.976 17.0657 20.1235 17.2863 20.2241 17.5291C20.3248 17.7719 20.3766 18.0322 20.3766 18.295C20.3766 18.5578 20.3248 18.8181 20.2241 19.0609C20.1235 19.3037 19.976 19.5243 19.79 19.71C19.6043 19.896 19.3837 20.0435 19.1409 20.1441C18.8981 20.2448 18.6378 20.2966 18.375 20.2966C18.1122 20.2966 17.8519 20.2448 17.6091 20.1441C17.3663 20.0435 17.1457 19.896 16.96 19.71L16.9 19.65C16.6642 19.4195 16.365 19.2648 16.0406 19.206C15.7162 19.1472 15.3816 19.1869 15.08 19.32C14.7842 19.4468 14.532 19.6572 14.3543 19.9255C14.1766 20.1938 14.0813 20.5082 14.08 20.83V21C14.08 21.5304 13.8693 22.0391 13.4942 22.4142C13.1191 22.7893 12.6104 23 12.08 23C11.5496 23 11.0409 22.7893 10.6658 22.4142C10.2907 22.0391 10.08 21.5304 10.08 21V20.91C10.0723 20.579 9.96512 20.2583 9.77251 19.9857C9.5799 19.7131 9.31074 19.5009 9 19.37C8.69838 19.2369 8.36381 19.1972 8.03941 19.256C7.71502 19.3148 7.41583 19.4695 7.18 19.7L7.12 19.76C6.93425 19.946 6.71368 20.0935 6.47088 20.1941C6.22808 20.2948 5.96783 20.3466 5.705 20.3466C5.44217 20.3466 5.18192 20.2948 4.93912 20.1941C4.69632 20.0935 4.47575 19.946 4.29 19.76C4.10405 19.5743 3.95653 19.3537 3.85588 19.1109C3.75523 18.8681 3.70343 18.6078 3.70343 18.345C3.70343 18.0822 3.75523 17.8219 3.85588 17.5791C3.95653 17.3363 4.10405 17.1157 4.29 16.93L4.35 16.87C4.58054 16.6342 4.73519 16.335 4.794 16.0106C4.85282 15.6862 4.81312 15.3516 4.68 15.05C4.55324 14.7542 4.34276 14.502 4.07447 14.3243C3.80618 14.1466 3.49179 14.0513 3.17 14.05H3C2.46957 14.05 1.96086 13.8393 1.58579 13.4642C1.21071 13.0891 1 12.5804 1 12.05C1 11.5196 1.21071 11.0109 1.58579 10.6358C1.96086 10.2607 2.46957 10.05 3 10.05H3.09C3.42099 10.0423 3.742 9.93512 4.01426 9.74251C4.28653 9.5499 4.49867 9.28074 4.63 8.97C4.76312 8.66838 4.80282 8.33381 4.744 8.00941C4.68519 7.68502 4.53054 7.38583 4.3 7.15L4.24 7.09C4.05405 6.90425 3.90653 6.68368 3.80588 6.44088C3.70523 6.19808 3.65343 5.93783 3.65343 5.675C3.65343 5.41217 3.70523 5.15192 3.80588 4.90912C3.90653 4.66632 4.05405 4.44575 4.24 4.26C4.42575 4.07405 4.64632 3.92653 4.88912 3.82588C5.13192 3.72523 5.39217 3.67343 5.655 3.67343C5.91783 3.67343 6.17808 3.72523 6.42088 3.82588C6.66368 3.92653 6.88425 4.07405 7.07 4.26L7.13 4.32C7.36583 4.55054 7.66502 4.70519 7.98941 4.764C8.31381 4.82282 8.64838 4.78312 8.95 4.65H9C9.29577 4.52324 9.54802 4.31276 9.72570 4.04447C9.90338 3.77618 9.99872 3.46179 10 3.14V3C10 2.46957 10.2107 1.96086 10.5858 1.58579C10.9609 1.21071 11.4696 1 12 1C12.5304 1 13.0391 1.21071 13.4142 1.58579C13.7893 1.96086 14 2.46957 14 3V3.09C14.0013 3.41179 14.0966 3.72618 14.2743 3.99447C14.452 4.26276 14.7042 4.47324 15 4.6C15.3016 4.73312 15.6362 4.77282 15.9606 4.714C16.285 4.65519 16.5842 4.50054 16.82 4.27L16.88 4.21C17.0657 4.02405 17.2863 3.87653 17.5291 3.77588C17.7719 3.67523 18.0322 3.62343 18.295 3.62343C18.5578 3.62343 18.8181 3.67523 19.0609 3.77588C19.3037 3.87653 19.5243 4.02405 19.71 4.21C19.896 4.39575 20.0435 4.61632 20.1441 4.85912C20.2448 5.10192 20.2966 5.36217 20.2966 5.625C20.2966 5.88783 20.2448 6.14808 20.1441 6.39088C20.0435 6.63368 19.896 6.85425 19.71 7.04L19.65 7.1C19.4195 7.33583 19.2648 7.63502 19.206 7.95941C19.1472 8.28381 19.1869 8.61838 19.32 8.92V9C19.4468 9.29577 19.6572 9.54802 19.9255 9.72570C20.1938 9.90338 20.5082 9.99872 20.83 10H21C21.5304 10 22.0391 10.2107 22.4142 10.5858C22.7893 10.9609 23 11.4696 23 12C23 12.5304 22.7893 13.0391 22.4142 13.4142C22.0391 13.7893 21.5304 14 21 14H20.91C20.5882 14.0013 20.2738 14.0966 20.0055 14.2743C19.7372 14.452 19.5268 14.7042 19.4 15V15Z'
                    stroke='currentColor'
                    strokeWidth='2'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                  />
                </svg>
                <span>Settings</span>
              </button>
              <hr className='menu-divider' />
              <button className='user-menu-item logout-item' onClick={handleSignOut}>
                <svg width='16' height='16' viewBox='0 0 24 24' fill='none'>
                  <path
                    d='M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9'
                    stroke='currentColor'
                    strokeWidth='2'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                  />
                  <polyline
                    points='16,17 21,12 16,7'
                    stroke='currentColor'
                    strokeWidth='2'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                  />
                  <line
                    x1='21'
                    y1='12'
                    x2='9'
                    y2='12'
                    stroke='currentColor'
                    strokeWidth='2'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                  />
                </svg>
                <span>Sign Out</span>
              </button>
            </div>
          </div>

          {/* Notification Button */}
          <NotificationButton username={currentUser?.username || ''} />
        </div>
      </div>
    </header>
  );
};

export default Header;
