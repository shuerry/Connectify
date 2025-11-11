import './index.css';
import { useNavigate } from 'react-router-dom';
import useAllGamesPage from '../../../../hooks/useAllGamesPage';
import GameCard from './gameCard';

/**
 * Component to display the "All Games" page, which provides functionality to view, create, and join games.
 * @returns A React component that includes:
 * - A "Create Game" button to open a modal for selecting a game type.
 * - A list of available games, each rendered using the `GameCard` component.
 * - A refresh button to reload the list of available games from the server.
 */
const AllGamesPage = () => {
  const navigate = useNavigate();
  const {
    availableGames,
    handleJoin,
    fetchGames,
    isModalOpen,
    handleToggleModal,
    handleSelectGameType,
    error,
  } = useAllGamesPage();

  return (
    <div className='game-page'>
      <div className='game-controls'>
        <button className='btn-create-game' onClick={handleToggleModal}>
          Create Game
        </button>
        {/* Added Connect Four Button */}
        <button className='btn-connect-four' onClick={() => navigate('/games/connectfour')}>
          Play Connect Four
        </button>
      </div>
      {/* Modal for selecting game type */}
      {isModalOpen && (
        <div className='game-modal'>
          <div className='modal-content'>
            <h2>Select Game Type</h2>
            <button onClick={() => handleSelectGameType('Nim')}>Nim</button>
            <button onClick={handleToggleModal}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllGamesPage;
