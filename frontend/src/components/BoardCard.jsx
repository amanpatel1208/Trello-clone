import { useNavigate } from 'react-router-dom';
import { toggleStarBoard } from '../api';
import { useMember } from '../context/MemberContext';

export default function BoardCard({ board, onStarredChanged }) {
  const navigate = useNavigate();
  const { currentMember } = useMember();

  const handleToggleStar = async (e) => {
    e.stopPropagation();
    try {
      const { is_starred } = await toggleStarBoard(board.id, currentMember.id);
      onStarredChanged(board.id, is_starred);
    } catch (err) {
      console.error('Failed to toggle star:', err);
    }
  };

  const boardStyle = {
    background: board.bg_type === 'image' 
      ? `url(${board.bg_value}) center/cover` 
      : board.bg_value
  };

  return (
    <div className="board-card" onClick={() => navigate(`/board/${board.id}`)}>
      <div className="board-card-top" style={boardStyle}>
        <button 
          className={`board-card-star ${board.is_starred ? 'is-starred' : ''}`}
          onClick={handleToggleStar}
          title={board.is_starred ? "Click to unstar board" : "Click to star board"}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill={board.is_starred ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        </button>
      </div>
      <div className="board-card-bottom">
        <div className="board-card-name">{board.title}</div>
        <div className="board-card-workspace">TodiIst Workspace</div>
      </div>
    </div>
  );
}
