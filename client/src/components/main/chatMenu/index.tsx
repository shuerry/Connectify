import React from 'react';
import useChatMute from '../../../hooks/useMuteChat';
import { PopulatedDatabaseChat, SafeDatabaseUser } from '../../../types/types';
import './index.css';

type ChatMenuProps = {
  chat: PopulatedDatabaseChat | null;
  user: SafeDatabaseUser | null;
  refreshChat: () => Promise<void>;
};

const ChatMenu: React.FC<ChatMenuProps> = ({ chat, user, refreshChat }) => {
  const { muteFor, muteIndefinitely, isMuting, canMute } = useChatMute({
    chat,
    user,
    refreshChat,
  });
  const [open, setOpen] = React.useState(false);
  const wrapperRef = React.useRef<HTMLDivElement | null>(null);

  const toggleOpen = () => {
    if (!canMute || isMuting) return;
    setOpen(prev => !prev);
  };

  React.useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  if (!canMute) return null;

  const handleAction = (fn: () => void) => {
    fn();
    setOpen(false);
  };

  return (
    <div className='chat-action-menu-wrapper' ref={wrapperRef}>
      <button
        className={`chat-action-btn ${open ? 'chat-action-btn--active' : ''}`}
        title='Chat options'
        onClick={toggleOpen}
        disabled={isMuting}
      >
        <svg width='20' height='20' viewBox='0 0 24 24' fill='none'>
          <circle cx='12' cy='12' r='1' stroke='currentColor' strokeWidth='2' />
          <circle cx='19' cy='12' r='1' stroke='currentColor' strokeWidth='2' />
          <circle cx='5' cy='12' r='1' stroke='currentColor' strokeWidth='2' />
        </svg>
      </button>

      {open && (
        <div className='chat-action-menu chat-action-menu--dropdown'>
          <div className='chat-action-menu-header'>
            <div className='chat-action-menu-title'>Mute notifications</div>
            <div className='chat-action-menu-subtitle'>
              Temporarily silence alerts for this chat
            </div>
          </div>

          <div className='chat-action-menu-divider' />

          <button
            className='chat-action-menu-item'
            onClick={() => handleAction(() => muteFor(60 * 60 * 1000))}
          >
            <span className='chat-action-menu-item-primary'>Mute for 1 hour</span>
            <span className='chat-action-menu-item-secondary'>Good for short focus blocks</span>
          </button>

          <button
            className='chat-action-menu-item'
            onClick={() => handleAction(() => muteFor(8 * 60 * 60 * 1000))}
          >
            <span className='chat-action-menu-item-primary'>Mute for 8 hours</span>
            <span className='chat-action-menu-item-secondary'>Covers a full work day</span>
          </button>

          <button
            className='chat-action-menu-item'
            onClick={() => handleAction(() => muteFor(24 * 60 * 60 * 1000))}
          >
            <span className='chat-action-menu-item-primary'>Mute for 24 hours</span>
            <span className='chat-action-menu-item-secondary'>Perfect for a day off</span>
          </button>

          <div className='chat-action-menu-divider' />

          <button
            className='chat-action-menu-item chat-action-menu-item--danger'
            onClick={() => handleAction(() => muteIndefinitely())}
          >
            <span className='chat-action-menu-item-primary'>
              Mute until I turn it back on
            </span>
            <span className='chat-action-menu-item-secondary'>
              You&apos;ll stay muted until you re-enable notifications
            </span>
          </button>
        </div>
      )}
    </div>
  );
};

export default ChatMenu;
