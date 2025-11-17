import { useState } from 'react';
import './index.css';
import { NavLink, useLocation } from 'react-router-dom';
import useUserContext from '../../../hooks/useUserContext';

/**
 * The SideBarNav component has a sidebar navigation menu for all the main pages.
 * It highlights the currently selected item based on the active page and
 * triggers corresponding functions when the menu items are clicked.
 */
const SideBarNav = () => {
  const { user } = useUserContext();
  const [showMessagingOptions, setShowMessagingOptions] = useState<boolean>(false);
  const [showUsersOptions, setShowUsersOptions] = useState<boolean>(false);
  const location = useLocation();

  const toggleMessagingOptions = () => {
    setShowMessagingOptions(!showMessagingOptions);
  };

  const toggleUsersOptions = () => {
    setShowUsersOptions(!showUsersOptions);
  };

  const isActiveOption = (path: string) => (location.pathname === path ? 'nav-item-active' : '');

  return (
    <nav className='modern-sidebar'>
      <div className='sidebar-content'>
        {/* Main Navigation */}
        <section className='nav-section'>
          <h3 className='nav-section-title'>Main</h3>
          <div className='nav-items'>
            <NavLink
              to='/home'
              className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : ''}`}>
              <div className='nav-item-icon'>
                <svg width='20' height='20' viewBox='0 0 24 24' fill='none'>
                  <circle cx='12' cy='12' r='3' stroke='currentColor' strokeWidth='2' />
                  <path d='M12 1v6m0 6v6m11-7h-6m-6 0H1' stroke='currentColor' strokeWidth='2' />
                </svg>
              </div>
              <span className='nav-item-text'>Questions</span>
            </NavLink>

            <NavLink
              to='/tags'
              className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : ''}`}>
              <div className='nav-item-icon'>
                <svg width='20' height='20' viewBox='0 0 24 24' fill='none'>
                  <path
                    d='M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z'
                    stroke='currentColor'
                    strokeWidth='2'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                  />
                  <line x1='7' y1='7' x2='7.01' y2='7' stroke='currentColor' strokeWidth='2' />
                </svg>
              </div>
              <span className='nav-item-text'>Tags</span>
            </NavLink>

            <NavLink
              to='/drafts'
              className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : ''}`}>
              <div className='nav-item-icon'>
                <svg width='20' height='20' viewBox='0 0 24 24' fill='none'>
                  <path
                    d='M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z'
                    stroke='currentColor'
                    strokeWidth='2'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                  />
                  <polyline
                    points='14,2 14,8 20,8'
                    stroke='currentColor'
                    strokeWidth='2'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                  />
                  <line
                    x1='16'
                    y1='13'
                    x2='8'
                    y2='13'
                    stroke='currentColor'
                    strokeWidth='2'
                    strokeLinecap='round'
                  />
                  <line
                    x1='16'
                    y1='17'
                    x2='8'
                    y2='17'
                    stroke='currentColor'
                    strokeWidth='2'
                    strokeLinecap='round'
                  />
                  <polyline
                    points='10,9 9,9 8,9'
                    stroke='currentColor'
                    strokeWidth='2'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                  />
                </svg>
              </div>
              <span className='nav-item-text'>My Drafts</span>
            </NavLink>
          </div>
        </section>

        {/* Communication Section */}
        <section className='nav-section'>
          <h3 className='nav-section-title'>Communication</h3>
          <div className='nav-items'>
            <button
              onClick={toggleMessagingOptions}
              className={`nav-item nav-expandable ${showMessagingOptions ? 'nav-item-expanded' : ''}`}>
              <div className='nav-item-icon'>
                <svg width='20' height='20' viewBox='0 0 24 24' fill='none'>
                  <path
                    d='M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z'
                    stroke='currentColor'
                    strokeWidth='2'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                  />
                </svg>
              </div>
              <span className='nav-item-text'>Messaging</span>
              <div className='nav-item-chevron'>
                <svg width='16' height='16' viewBox='0 0 24 24' fill='none'>
                  <polyline
                    points='6,9 12,15 18,9'
                    stroke='currentColor'
                    strokeWidth='2'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                  />
                </svg>
              </div>
            </button>

            {showMessagingOptions && (
              <div className='nav-subitems animate-slide-up'>
                <NavLink to='/messaging' className={`nav-subitem ${isActiveOption('/messaging')}`}>
                  <span className='nav-subitem-text'>Global Messages</span>
                </NavLink>
                <NavLink
                  to='/messaging/direct-message'
                  className={`nav-subitem ${isActiveOption('/messaging/direct-message')}`}>
                  <span className='nav-subitem-text'>Direct Messages</span>
                </NavLink>
              </div>
            )}

            <button
              onClick={toggleUsersOptions}
              className={`nav-item nav-expandable ${showUsersOptions ? 'nav-item-expanded' : ''}`}>
              <div className='nav-item-icon'>
                <svg width='20' height='20' viewBox='0 0 24 24' fill='none'>
                  <path
                    d='M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2'
                    stroke='currentColor'
                    strokeWidth='2'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                  />
                  <circle cx='9' cy='7' r='4' stroke='currentColor' strokeWidth='2' />
                  <path
                    d='M23 21v-2a4 4 0 00-3-3.87m-4-12a4 4 0 010 7.75'
                    stroke='currentColor'
                    strokeWidth='2'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                  />
                </svg>
              </div>
              <span className='nav-item-text'>Users</span>
              <div className='nav-item-chevron'>
                <svg width='16' height='16' viewBox='0 0 24 24' fill='none'>
                  <polyline
                    points='6,9 12,15 18,9'
                    stroke='currentColor'
                    strokeWidth='2'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                  />
                </svg>
              </div>
            </button>

            {showUsersOptions && (
              <div className='nav-subitems animate-slide-up'>
                <NavLink to='/users' className={`nav-subitem ${isActiveOption('/users')}`}>
                  <span className='nav-subitem-text'>All Users</span>
                </NavLink>
                <NavLink to='/friends' className={`nav-subitem ${isActiveOption('/friends')}`}>
                  <span className='nav-subitem-text'>Friends</span>
                </NavLink>
                <NavLink to='/blocked' className={`nav-subitem ${isActiveOption('/blocked')}`}>
                  <span className='nav-subitem-text'>Blocked</span>
                </NavLink>
              </div>
            )}
          </div>
        </section>

        {/* Entertainment & Community */}
        <section className='nav-section'>
          <h3 className='nav-section-title'>Community</h3>
          <div className='nav-items'>
            <NavLink
              to='/games'
              className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : ''}`}>
              <div className='nav-item-icon'>
                <svg width='20' height='20' viewBox='0 0 24 24' fill='none'>
                  <rect
                    x='2'
                    y='7'
                    width='20'
                    height='10'
                    rx='2'
                    stroke='currentColor'
                    strokeWidth='2'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                  />
                  <circle cx='6' cy='12' r='1' fill='currentColor' />
                  <circle cx='18' cy='10' r='1' fill='currentColor' />
                  <circle cx='18' cy='14' r='1' fill='currentColor' />
                </svg>
              </div>
              <span className='nav-item-text'>Games</span>
            </NavLink>

            <NavLink
              to='/communities'
              className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : ''}`}>
              <div className='nav-item-icon'>
                <svg width='20' height='20' viewBox='0 0 24 24' fill='none'>
                  <path
                    d='M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2'
                    stroke='currentColor'
                    strokeWidth='2'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                  />
                  <circle cx='9' cy='7' r='4' stroke='currentColor' strokeWidth='2' />
                  <path
                    d='M22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75'
                    stroke='currentColor'
                    strokeWidth='2'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                  />
                </svg>
              </div>
              <span className='nav-item-text'>Communities</span>
            </NavLink>

            <NavLink
              to={`/collections/${user.username}`}
              className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : ''}`}>
              <div className='nav-item-icon'>
                <svg width='20' height='20' viewBox='0 0 24 24' fill='none'>
                  <path
                    d='M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z'
                    stroke='currentColor'
                    strokeWidth='2'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                  />
                </svg>
              </div>
              <span className='nav-item-text'>My Collections</span>
            </NavLink>
          </div>
        </section>
      </div>
    </nav>
  );
};

export default SideBarNav;
