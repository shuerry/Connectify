import { useState } from 'react';
import './index.css';
import { ConnectFourRoomSettings } from '../../../../../types/types';

interface CreateRoomModalProps {
  onClose: () => void;
  onCreate: (roomSettings: ConnectFourRoomSettings) => void;
}

/**
 * Modal component for creating a new Connect Four room
 */
const CreateRoomModal = ({ onClose, onCreate }: CreateRoomModalProps) => {
  const [roomName, setRoomName] = useState('');
  const [privacy, setPrivacy] = useState<'PUBLIC' | 'PRIVATE' | 'FRIENDS_ONLY'>('PUBLIC');
  const [allowSpectators, setAllowSpectators] = useState(true);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!roomName.trim()) {
      setError('Room name is required');
      return;
    }

    if (roomName.trim().length < 3) {
      setError('Room name must be at least 3 characters');
      return;
    }

    if (roomName.trim().length > 50) {
      setError('Room name must be less than 50 characters');
      return;
    }

    const roomSettings: ConnectFourRoomSettings = {
      roomName: roomName.trim(),
      privacy,
      allowSpectators,
    };

    onCreate(roomSettings);
  };

  return (
    <div className='modal-overlay' onClick={onClose}>
      <div className='create-room-modal' onClick={e => e.stopPropagation()}>
        <div className='modal-header'>
          <h2>Create Connect Four Room</h2>
          <button className='btn-close' onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className='form-group'>
            <label htmlFor='roomName'>Room Name *</label>
            <input
              id='roomName'
              type='text'
              value={roomName}
              onChange={e => {
                setRoomName(e.target.value);
                setError('');
              }}
              placeholder='Enter room name'
              maxLength={50}
            />
            {error && <span className='error-message'>{error}</span>}
          </div>

          <div className='form-group'>
            <label>Privacy Setting</label>
            <div className='privacy-options'>
              <label
                className={`privacy-option public-option ${privacy === 'PUBLIC' ? 'selected' : ''}`}>
                <input
                  type='radio'
                  name='privacy'
                  value='PUBLIC'
                  checked={privacy === 'PUBLIC'}
                  onChange={() => setPrivacy('PUBLIC')}
                />
                <div>
                  <strong> Public</strong>
                  <p>Anyone can see and join this room</p>
                </div>
              </label>

              <label
                className={`privacy-option private-option ${privacy === 'PRIVATE' ? 'selected' : ''}`}>
                <input
                  type='radio'
                  name='privacy'
                  value='PRIVATE'
                  checked={privacy === 'PRIVATE'}
                  onChange={() => setPrivacy('PRIVATE')}
                />
                <div>
                  <strong> Private</strong>
                  <p>Only accessible with room code</p>
                </div>
              </label>

              <label
                className={`privacy-option friends-only-option ${privacy === 'FRIENDS_ONLY' ? 'selected' : ''}`}>
                <input
                  type='radio'
                  name='privacy'
                  value='FRIENDS_ONLY'
                  checked={privacy === 'FRIENDS_ONLY'}
                  onChange={() => setPrivacy('FRIENDS_ONLY')}
                />
                <div>
                  <strong> Friends Only</strong>
                  <p>Accessible via code (future feature)</p>
                </div>
              </label>
            </div>
          </div>

          <div className='form-group'>
            <label className='checkbox-label'>
              <input
                type='checkbox'
                checked={allowSpectators}
                onChange={e => setAllowSpectators(e.target.checked)}
              />
              <span>Allow Spectators</span>
            </label>
            <p className='help-text'>Let other players watch your game without interfering</p>
          </div>

          <div className='modal-actions'>
            <button type='button' className='btn-cancel' onClick={onClose}>
              Cancel
            </button>
            <button type='submit' className='btn-create'>
              Create Room
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateRoomModal;
