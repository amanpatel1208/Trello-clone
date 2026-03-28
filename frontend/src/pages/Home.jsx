import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getBoards } from '../api';
import Navbar from '../components/Navbar';
import CreateBoardModal from '../components/CreateBoardModal';
import Sidebar from '../components/Sidebar';
import BoardCard from '../components/BoardCard';
import { useMember } from '../context/MemberContext';
import '../styles/home.css';

export default function Home() {
  const [boards, setBoards] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { currentMember } = useMember();
  const [view, setView] = useState('boards_global');

  useEffect(() => {
    if (!currentMember) return;
    getBoards(currentMember.id)
      .then(setBoards)
      .catch(err => setError(err.message || 'Failed to connect to backend database'));
  }, [currentMember]);

  const onStarredChanged = (boardId, isStarred) => {
    setBoards(prev => prev.map(b => b.id === boardId ? { ...b, is_starred: isStarred } : b));
  };

  const starredBoards = useMemo(() => boards.filter(b => b.is_starred), [boards]);
  const recentBoards = useMemo(() => boards.slice(0, 4), [boards]);

  return (
    <div className="home-page-container">
      <Navbar />
      
      <div className="app-body">
        <Sidebar currentView={view} onViewChange={setView} />
        
        <main className="home-main">
          {error && (
            <div className="api-error-alert glass" style={{ marginBottom: 24 }}>
              <strong>API Error:</strong> {error}.
            </div>
          )}

          {view.startsWith('boards') ? (
            <div className="boards-view-content animation-fade-in">
              {/* Starred Boards */}
              {starredBoards.length > 0 && (
                <section className="home-section">
                  <h2 className="home-section-title">
                    <i>⭐</i> Starred boards
                  </h2>
                  <div className="boards-grid">
                    {starredBoards.map(b => (
                      <BoardCard 
                        key={`starred-${b.id}`} 
                        board={b} 
                        onStarredChanged={onStarredChanged} 
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* Recently Viewed (Mocked as latest boards) */}
              <section className="home-section">
                <h2 className="home-section-title">
                  <i>🕒</i> Recently viewed
                </h2>
                <div className="boards-grid">
                  {recentBoards.map(b => (
                    <BoardCard 
                      key={`recent-${b.id}`} 
                      board={b} 
                      onStarredChanged={onStarredChanged} 
                    />
                  ))}
                </div>
              </section>

              {/* Your Workspaces */}
              <section className="home-section">
                <h2 className="home-section-title">
                  YOUR WORKSPACES
                </h2>
                <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div className="ws-icon" style={{ 
                    width: 32, height: 32, borderRadius: 4, background: '#22c55e', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', 
                    color: '#fff', fontWeight: 800 
                  }}>T</div>
                  <span style={{ fontWeight: 600, fontSize: 14 }}>TodiIst Workspace</span>
                </div>

                <div className="boards-grid">
                  {boards.map(b => (
                    <BoardCard 
                      key={`all-${b.id}`} 
                      board={b} 
                      onStarredChanged={onStarredChanged} 
                    />
                  ))}
                  <div className="create-board-card" onClick={() => setShowModal(true)}>
                    <span>Create new board</span>
                  </div>
                </div>
              </section>
            </div>
          ) : (
            <div className="billing-view-content animation-slide-up">
              <div className="billing-hero-card glass-heavy">
                <div className="billing-badge">PREMIUM ACCESS</div>
                <h1 className="billing-title">
                  We have decided to make it <span className="gradient-text">free for everyone.</span>
                </h1>
                <p className="billing-subtitle">
                  Enjoy unlimited boards, power-ups, and advanced team tools at zero cost. Forever.
                </p>
                <div className="billing-features">
                  <div className="feature-chip">✓ Unlimited Boards</div>
                  <div className="feature-chip">✓ Admin Tools</div>
                  <div className="feature-chip">✓ Priority Support</div>
                </div>
                <button className="btn-primary billing-btn" onClick={() => setView('boards_global')}>
                  Back to my boards
                </button>
              </div>
            </div>
          )}
        </main>
      </div>



      {showModal && (
        <CreateBoardModal 
          onClose={() => setShowModal(false)} 
          memberId={currentMember?.id}
          onCreated={b => { 
            setBoards(p => [b, ...p]); 
            setShowModal(false); 
            navigate(`/board/${b.id}`); 
          }} 
        />
      )}
    </div>
  );
}
