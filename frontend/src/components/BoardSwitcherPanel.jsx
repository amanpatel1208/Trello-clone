import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getBoards } from '../api';
import { useMember } from '../context/MemberContext';

export default function BoardSwitcherPanel({ isOpen, onClose, currentBoardId }) {
  const { currentMember } = useMember();
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen && currentMember) {
      setLoading(true);
      getBoards(currentMember.id)
        .then(setBoards)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [isOpen, currentMember]);

  if (!isOpen) return null;

  return (
    <div className={`board-switcher-panel glass-heavy ${isOpen ? 'open' : ''}`}>
      <div className="cp-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
            <rect x="2" y="2" width="7" height="11" rx="1.5" />
            <rect x="11" y="2" width="7" height="16" rx="1.5" />
          </svg>
          <h3 style={{ margin: 0 }}>Switch Board</h3>
        </div>
        <button className="icon-btn" onClick={onClose}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>

      <div className="cp-list-choice" style={{ marginTop: 20 }}>
        {loading ? (
          <div style={{ padding: 20, textAlign: 'center', opacity: 0.6 }}>Loading boards...</div>
        ) : (
          <div className="boards-list-vertical">
            {boards.map(board => (
              <button 
                key={board.id} 
                className={`board-list-item${currentBoardId === board.id ? ' active' : ''}`}
                onClick={() => { navigate(`/board/${board.id}`); onClose(); }}
              >
                <div className="board-sw-tile" style={{ background: board.bg_type === 'image' ? `url(${board.bg_value}) center/cover` : board.bg_value }} />
                <span>{board.title}</span>
                {currentBoardId === board.id && (
                  <span className="check">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="cp-footer" style={{ marginTop: 'auto', padding: '20px 0' }}>
        <button className="btn-primary" style={{ width: '100%' }} onClick={() => navigate('/')}>
          Go to Home
        </button>
      </div>
    </div>
  );
}
