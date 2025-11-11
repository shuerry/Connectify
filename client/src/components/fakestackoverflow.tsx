import { JSX, useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './layout';
import Login from './auth/login';
import { FakeSOSocket, SafeDatabaseUser } from '../types/types';
import LoginContext from '../contexts/LoginContext';
import UserContext from '../contexts/UserContext';
import QuestionPage from './main/questionPage';
import TagPage from './main/tagPage';
import NewQuestionPage from './main/newQuestion';
import NewAnswerPage from './main/newAnswer';
import AnswerPage from './main/answerPage';
import MessagingPage from './main/messagingPage';
import DirectMessage from './main/directMessage';
import Signup from './auth/signup';
import UsersListPage from './main/usersListPage';
import ProfileSettings from './profileSettings';
import AllGamesPage from './main/games/allGamesPage';
import GamePage from './main/games/gamePage';
import AllCommunitiesPage from './main/communities/allCommunitiesPage';
import NewCommunityPage from './main/communities/newCommunityPage';
import CommunityPage from './main/communities/communityPage';
import AllCollectionsPage from './main/collections/allCollectionsPage';
import CollectionPage from './main/collections/collectionPage';
import NewCollectionPage from './main/collections/newCollectionPage';
import ConnectFourPage from './main/games/connectFourPage';
import FriendsListPage from './main/friendsList';
import BlockedListPage from './main/blockedList';
import VerifyEmail from './main/verifyEmailPage/verifyEmail';
import NotificationsPage from './main/notificationsPage';

const ProtectedRoute = ({
  user,
  socket,
  children,
}: {
  user: SafeDatabaseUser | null;
  socket: FakeSOSocket | null;
  children: JSX.Element;
}) => {
  if (!user || !socket) {
    return <Navigate to='/' />;
  }

  return <UserContext.Provider value={{ user, socket }}>{children}</UserContext.Provider>;
};

/**
 * Represents the main component of the applications.
 * It manages the state for search terms and the main title.
 */
const FakeStackOverflow = ({ socket }: { socket: FakeSOSocket | null }) => {
  const [user, setUser] = useState<SafeDatabaseUser | null>(null);

  // Logout function to clear user and remembered session
  const logout = () => {
    setUser(null);
    localStorage.removeItem('rememberedUser');
  };

  // Check for remembered user on app startup
  useEffect(() => {
    const checkRememberedUser = () => {
      try {
        const rememberedData = localStorage.getItem('rememberedUser');
        if (rememberedData) {
          const { user: rememberedUser, expiresAt } = JSON.parse(rememberedData);
          
          // Check if the remembered session is still valid
          if (Date.now() < expiresAt) {
            setUser(rememberedUser);
          } else {
            // Remove expired session
            localStorage.removeItem('rememberedUser');
          }
        }
      } catch (error) {
        // Silent error handling for localStorage issues
        localStorage.removeItem('rememberedUser');
      }
    };

    checkRememberedUser();
  }, []);

  return (
    <LoginContext.Provider value={{ setUser, logout }}>
      <Routes>
        {/* Public Route */}
        <Route path='/' element={<Login />} />
        <Route path='/signup' element={<Signup />} />
        <Route path='/verify-email' element={<VerifyEmail />} />
        {/* Protected Routes */}
        {
          <Route
            element={
              <ProtectedRoute user={user} socket={socket}>
                <Layout />
              </ProtectedRoute>
            }>
            <Route path='/home' element={<QuestionPage />} />
            <Route path='tags' element={<TagPage />} />
            <Route path='/messaging' element={<MessagingPage />} />
            <Route path='/messaging/direct-message' element={<DirectMessage />} />
            <Route path='/question/:qid' element={<AnswerPage />} />
            <Route path='/new/question' element={<NewQuestionPage />} />
            <Route path='/new/answer/:qid' element={<NewAnswerPage />} />
            <Route path='/users' element={<UsersListPage />} />
            <Route path='/user/:username' element={<ProfileSettings />} />
            <Route path='/new/collection' element={<NewCollectionPage />} />
            <Route path='/collections/:username' element={<AllCollectionsPage />} />
            <Route path='/collections/:username/:collectionId' element={<CollectionPage />} />
            <Route path='/games' element={<AllGamesPage />} />
            <Route path='/games/connectfour' element={<ConnectFourPage />} />
            <Route path='/games/:gameID' element={<GamePage />} />
            <Route path='/communities' element={<AllCommunitiesPage />} />
            <Route path='/new/community' element={<NewCommunityPage />} />
            <Route path='/communities/:communityID' element={<CommunityPage />} />
            <Route path='/friends' element={<FriendsListPage />} />
            <Route path='/blocked' element={<BlockedListPage />} />
            <Route
              path='/notifications'
              element={<NotificationsPage username={user?.username || ''} />}
            />
          </Route>
        }
      </Routes>
    </LoginContext.Provider>
  );
};

export default FakeStackOverflow;
