import * as React from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './index.css';
import useProfileSettings from '../../hooks/useProfileSettings';
import logger from '../../utils/logger';

const ProfileSettings: React.FC = () => {
  const {
    userData,
    loading,
    editBioMode,
    newBio,
    editEmailMode,
    newEmail,
    newPassword,
    confirmNewPassword,
    successMessage,
    errorMessage,
    showConfirmation,
    pendingAction,
    canEditProfile,
    showPassword,
    togglePasswordVisibility,
    setEditBioMode,
    setNewBio,
    setEditEmailMode,
    setNewEmail,
    setNewPassword,
    setConfirmNewPassword,
    setShowConfirmation,
    handleResetPassword,
    handleUpdateBiography,
    handleUpdateEmail,
    handleDeleteUser,
    handleViewCollectionsPage,
    handleToggleOnlineStatus,
  } = useProfileSettings();

  if (loading) {
    return (
      <div className='profile-settings'>
        <div className='profile-card'>
          <h2>Loading user data...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className='profile-settings'>
      <div className='profile-card'>
        <h2>Profile</h2>

        {successMessage && <p className='success-message'>{successMessage}</p>}
        {errorMessage && <p className='error-message'>{errorMessage}</p>}

        {userData ? (
          <>
            <h4>General Information</h4>
            <p>
              <strong>Username:</strong> {userData.username}
            </p>

            {/* ---- Biography Section ---- */}
            <p>
              <strong>Biography:</strong>
            </p>
            <div className='bio-section'>
              {!editBioMode && (
                <>
                  <Markdown remarkPlugins={[remarkGfm]}>
                    {userData.biography || 'No biography yet.'}
                  </Markdown>
                  {canEditProfile && (
                    <button
                      className='button button-primary'
                      onClick={() => {
                        setEditBioMode(true);
                        setNewBio(userData.biography || '');
                      }}>
                      Edit
                    </button>
                  )}
                </>
              )}

              {editBioMode && canEditProfile && (
                <div className='bio-edit'>
                  <input
                    className='input-text'
                    type='text'
                    value={newBio}
                    onChange={e => setNewBio(e.target.value)}
                  />
                  <button className='button button-primary' onClick={handleUpdateBiography}>
                    Save
                  </button>
                  <button className='button button-danger' onClick={() => setEditBioMode(false)}>
                    Cancel
                  </button>
                </div>
              )}
            </div>

            {/* ---- Email Section ---- */}
            <p>
              <strong>Email:</strong>
            </p>

            <div className='bio-section'>
              {!editEmailMode && (
                <>
                  {userData.emailVerified ? (
                    <p>{userData.email}</p>
                  ) : userData.emailVerification?.pendingEmail ? (
                    <p className='unverified-email'>
                      {userData.emailVerification.pendingEmail} <em>(pending verification)</em>
                    </p>
                  ) : (
                    <p className='unverified-email'>
                      {userData.email || 'No email yet'} <em>(unverified)</em>
                    </p>
                  )}

                  {!userData.emailVerified && (
                    <p className='warning-message'>
                      Notifications will not be sent until the email is verified.
                    </p>
                  )}

                  {canEditProfile && (
                    <button
                      className='button button-primary'
                      onClick={() => {
                        setEditEmailMode(true);
                        setNewEmail(
                          userData.emailVerification?.pendingEmail || userData.email || '',
                        );
                      }}>
                      Edit
                    </button>
                  )}
                </>
              )}

              {editEmailMode && canEditProfile && (
                <div className='bio-edit'>
                  <input
                    className='input-text'
                    type='text'
                    value={newEmail}
                    onChange={e => setNewEmail(e.target.value)}
                  />

                  <button
                    className='button button-primary'
                    onClick={() => {
                      logger.info('Save button clicked. Current newEmail:', newEmail);
                      handleUpdateEmail();
                    }}>
                    Save
                  </button>

                  <button className='button button-danger' onClick={() => setEditEmailMode(false)}>
                    Cancel
                  </button>
                </div>
              )}
            </div>

            <p>
              <strong>Date Joined:</strong>{' '}
              {userData.dateJoined ? new Date(userData.dateJoined).toLocaleDateString() : 'N/A'}
            </p>

            {/* ---- Online Status Section ---- */}
            {canEditProfile && (
              <>
                <h4>Online Status</h4>
                <div className='bio-section'>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <label
                      htmlFor='online-status-toggle'
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                      }}>
                      <input
                        id='online-status-toggle'
                        type='checkbox'
                        checked={userData.showOnlineStatus ?? true}
                        onChange={handleToggleOnlineStatus}
                        style={{ cursor: 'pointer' }}
                      />
                      <span>Show my online status to others</span>
                    </label>
                  </div>
                  <p style={{ fontSize: '0.9em', color: '#666', marginTop: '8px' }}>
                    {userData.showOnlineStatus
                      ? 'Other users can see when you are online.'
                      : 'Your online status is hidden from others.'}
                  </p>
                </div>
              </>
            )}

            <button className='button button-primary' onClick={handleViewCollectionsPage}>
              View Collections
            </button>

            {/* ---- Reset Password Section ---- */}
            {canEditProfile && (
              <>
                <h4>Reset Password</h4>
                <input
                  className='input-text'
                  type={showPassword ? 'text' : 'password'}
                  placeholder='New Password'
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                />
                <input
                  className='input-text'
                  type={showPassword ? 'text' : 'password'}
                  placeholder='Confirm New Password'
                  value={confirmNewPassword}
                  onChange={e => setConfirmNewPassword(e.target.value)}
                />
                <div className='password-actions'>
                  <button className='button button-secondary' onClick={togglePasswordVisibility}>
                    {showPassword ? 'Hide Passwords' : 'Show Passwords'}
                  </button>
                  <button className='button button-primary' onClick={handleResetPassword}>
                    Reset
                  </button>
                </div>
              </>
            )}

            {/* ---- Danger Zone (Delete User) ---- */}
            {canEditProfile && (
              <>
                <h4>Danger Zone</h4>
                <button className='button button-danger' onClick={handleDeleteUser}>
                  Delete This User
                </button>
              </>
            )}
          </>
        ) : (
          <p>No user data found. Make sure the username parameter is correct.</p>
        )}

        {/* ---- Confirmation Modal for Delete ---- */}
        {showConfirmation && (
          <div className='modal'>
            <div className='modal-content'>
              <p>
                Are you sure you want to delete user <strong>{userData?.username}</strong>? This
                action cannot be undone.
              </p>
              <div className='modal-actions'>
                <button className='button button-danger' onClick={() => pendingAction?.()}>
                  Confirm
                </button>
                <button
                  className='button button-secondary'
                  onClick={() => setShowConfirmation(false)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileSettings;
