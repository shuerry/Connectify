import { useNavigate } from 'react-router-dom';
import useHeader from '../../hooks/useHeader';
import './index.css';
import useUserContext from '../../hooks/useUserContext';
import useUnreadNotifications from '../../hooks/useUnreadNotifications';

/**
 * Modern Header component with improved design and user experience.
 * Features a clean layout, better search functionality, and modern user controls.
 */
const Header = () => {
  const { val, handleInputChange, handleKeyDown, handleSignOut } = useHeader();
  const { user: currentUser } = useUserContext();
  const { unread } = useUnreadNotifications(currentUser?.username);
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
              Connect<span className='logo-accent'>ify</span>
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
              onClick={() => navigate('/messaging')}
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
            <button
              className='action-button'
              onClick={() => navigate('/notifications')}
              title='Notifications'>
              <svg width='20' height='20' viewBox='0 0 24 24' fill='none'>
                <path
                  d='M12 22c1.1 0 2-.9 2-2H10a2 2 0 0 0 2 2z'
                  stroke='currentColor'
                  strokeWidth='2'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                />
                <path
                  d='M18 16v-5a6 6 0 0 0-5-5.91V4a1 1 0 1 0-2 0v1.09A6 6 0 0 0 6 11v5l-2 2v1h16v-1l-2-2z'
                  stroke='currentColor'
                  strokeWidth='2'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                />
                {unread > 0 && <circle cx='18' cy='6' r='4' fill='#3075ffff' />}
              </svg>
            </button>
          </div>

          {/* User Profile Dropdown */}
          <div className='user-profile-section'>
            <div className='user-avatar' style={{ position: 'relative' }}>
              <span className='avatar-text'>
                {currentUser?.username?.charAt(0).toUpperCase() || 'U'}
              </span>
              {/* Online Status Indicator */}
              <div
                className={`user-avatar__online-status ${
                  currentUser?.showOnlineStatus !== false
                    ? 'user-avatar__online-status--online'
                    : 'user-avatar__online-status--offline'
                }`}
                title={currentUser.isOnline ? 'Online' : 'Offline'}
              />
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
        </div>
      </div>
    </header>
  );
};

export default Header;
