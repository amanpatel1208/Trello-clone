import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMember } from '../context/MemberContext';
import { searchCards } from '../api';
import CreateBoardModal from './CreateBoardModal';

export default function Navbar({ boardTitle, onTogglePlanner, onToggleSidebar }) {
  const { members, currentMember, switchMember } = useMember();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [createDropdownOpen, setCreateDropdownOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const dropdownRef = useRef();
  const createRef = useRef();
  const searchRef = useRef();
  const searchDebounceRef = useRef();

  // Close member dropdown on outside click
  useEffect(() => {
    const h = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  // Close search on outside click
  useEffect(() => {
    const h = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setSearchOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  // Close create dropdown on outside click
  useEffect(() => {
    const h = (e) => {
      if (createRef.current && !createRef.current.contains(e.target)) setCreateDropdownOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  // Debounced search
  const handleSearchChange = (e) => {
    const q = e.target.value;
    setSearchQuery(q);
    setSearchOpen(true);
    clearTimeout(searchDebounceRef.current);
    if (!q.trim()) { setSearchResults([]); setSearchLoading(false); return; }
    setSearchLoading(true);
    searchDebounceRef.current = setTimeout(async () => {
      try {
        const results = await searchCards(q.trim());
        setSearchResults(results || []);
      } catch { setSearchResults([]); }
      setSearchLoading(false);
    }, 300);
  };

  const handleResultClick = (result) => {
    setSearchQuery('');
    setSearchResults([]);
    setSearchOpen(false);
    navigate(`/board/${result.board_id}`, { state: { openCardId: result.id } });
  };

  const isOverdue = (dueDate) => dueDate && new Date(dueDate) < new Date() && new Date(dueDate).toDateString() !== new Date().toDateString();

  // Group results by board
  const grouped = searchResults.reduce((acc, r) => {
    if (!acc[r.board_id]) acc[r.board_id] = { board_title: r.board_title, bg_value: r.bg_value, cards: [] };
    acc[r.board_id].cards.push(r);
    return acc;
  }, {});

  return (
    <nav className="navbar glass-heavy">
      <div className="navbar-left">
        <button className="mobile-menu-btn" onClick={onToggleSidebar} aria-label="Toggle menu">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        </button>
        <Link to="/" className="navbar-logo" style={{ display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none', color: 'inherit', marginRight: 12 }}>
          <svg width="22" height="18" viewBox="0 0 24 24" fill="currentColor">
            <rect x="2" y="2" width="20" height="20" rx="3" fill="rgba(255,255,255,0.15)"/>
            <rect x="5" y="5" width="6" height="11" rx="1" fill="#fff"/>
            <rect x="13" y="5" width="6" height="7" rx="1" fill="#fff"/>
          </svg>
          <span className="logo-text">Trello Clone</span>
        </Link>
      </div>

      {/* Search */}
      <div className="navbar-center">
        <div className="nav-search-wrapper" ref={searchRef}>
          <span className="search-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          </span>
          <input
            type="text"
            placeholder="Search cards across all boards…"
            className="nav-search-input"
            value={searchQuery}
            onChange={handleSearchChange}
            onFocus={() => { if (searchQuery.trim()) setSearchOpen(true); }}
            autoComplete="off"
          />
          {searchOpen && searchQuery.trim() && (
            <div className="search-dropdown glass-heavy">
              {searchLoading ? (
                <div className="search-empty">Searching…</div>
              ) : searchResults.length === 0 ? (
                <div className="search-empty">No cards found for "<strong>{searchQuery}</strong>"</div>
              ) : (
                <>
                  <div className="search-count">{searchResults.length} result{searchResults.length !== 1 ? 's' : ''} across {Object.keys(grouped).length} board{Object.keys(grouped).length !== 1 ? 's' : ''}</div>
                  {Object.entries(grouped).map(([boardId, group]) => (
                    <div key={boardId} className="search-board-group">
                      <div className="search-board-header">
                        <span className="search-board-swatch" style={{ background: group.bg_value }} />
                        <span className="search-board-name">{group.board_title}</span>
                      </div>
                      {group.cards.map(card => (
                        <button key={card.id} className="search-result-item" onClick={() => handleResultClick(card)}>
                          <div className="search-result-title">{card.title}</div>
                          <div className="search-result-meta">
                            <span className="search-result-list">in {card.list_title}</span>
                            {card.due_date && (
                              <span className={`search-result-due${isOverdue(card.due_date) ? ' overdue' : ''}`}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 4 }}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                                {new Date(card.due_date).toLocaleDateString()}
                                {isOverdue(card.due_date) && ' · Overdue'}
                              </span>
                            )}
                            {card.is_complete && <span className="search-result-done">✓ Done</span>}
                          </div>
                        </button>
                      ))}
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
        <div className="nav-create-wrapper" ref={createRef}>
          <button className="create-btn-themed" onClick={() => setCreateDropdownOpen(o => !o)}>Create</button>
          {createDropdownOpen && (
            <div className="create-dropdown">
              <button className="dropdown-item" onClick={() => { setShowCreateModal(true); setCreateDropdownOpen(false); }}>
                <span className="icon">
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                    <rect x="2" y="2" width="7" height="11" rx="1.5" />
                    <rect x="11" y="2" width="7" height="16" rx="1.5" />
                  </svg>
                </span>
                <div className="item-text">
                  <div className="item-title">Create board</div>
                  <div className="item-desc">A board is made up of cards ordered on lists. Use it to manage projects, track information, or organize anything.</div>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="navbar-right">
        {showCreateModal && (
          <CreateBoardModal 
            onClose={() => setShowCreateModal(false)} 
            memberId={currentMember?.id}
            onCreated={(b) => { setShowCreateModal(false); navigate(`/board/${b.id}`); }} 
          />
        )}


        {currentMember && (
          <div className="member-switcher" ref={dropdownRef}>
            <button
              className="current-member-btn"
              onClick={() => setOpen(o => !o)}
              title={`Signed in as ${currentMember.name}`}
            >
              <img src={currentMember.avatar_url} alt={currentMember.name} className="nav-avatar" />
              <div className="member-status-dot" />
            </button>

            {open && (
              <div className="member-dropdown glass-heavy">
                <div className="dropdown-header" style={{ padding: '12px 14px 8px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <img src={currentMember.avatar_url} alt={currentMember.name} className="nav-avatar" />
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-main)' }}>{currentMember.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-sub)' }}>Active account</div>
                    </div>
                  </div>
                </div>
                <div className="dropdown-label">Switch member</div>
                {members.map(m => (
                  <button
                    key={m.id}
                    className={`dropdown-item${currentMember.id === m.id ? ' active' : ''}`}
                    onClick={() => { switchMember(m); setOpen(false); navigate('/'); }}
                  >
                    <img src={m.avatar_url} alt={m.name} className="nav-avatar sm" />
                    <span style={{ flex: 1 }}>{m.name}</span>
                    {currentMember.id === m.id && <span className="check">✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
