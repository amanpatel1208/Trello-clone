export default function BottomNav({ onTogglePlanner, onToggleBoards, plannerOpen, boardsOpen }) {
  const switches = [
    { 
      id: 'planner', 
      label: 'Planner', 
      onClick: onTogglePlanner, 
      active: plannerOpen,
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg> 
    },
    { 
      id: 'board', 
      label: 'Board', 
      active: true, // Permanently active as requested
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line><line x1="15" y1="3" x2="15" y2="21"></line></svg> 
    },
  ];

  const switchBoard = { 
    label: 'Switch boards', 
    onClick: onToggleBoards, 
    active: boardsOpen,
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg> 
  };

  return (
    <div className="bottom-nav-container">
      <nav className="bottom-switcher-bar">
        {switches.map((item) => (
          <button 
            key={item.label} 
            className={`bottom-switch-item${item.active ? ' active' : ''}`}
            onClick={item.onClick}
          >
            <div className="item-content">
              <span className="bottom-switch-icon">{item.icon}</span>
              <span className="bottom-switch-label">{item.label}</span>
            </div>
            {item.active && <div className="active-indicator" />}
          </button>
        ))}

        <div className="nav-divider" />

        <button 
          className={`bottom-switch-item${switchBoard.active ? ' active' : ''}`}
          onClick={switchBoard.onClick}
        >
          <div className="item-content">
            <span className="bottom-switch-icon">{switchBoard.icon}</span>
            <span className="bottom-switch-label">{switchBoard.label}</span>
          </div>
          {switchBoard.active && <div className="active-indicator" />}
        </button>
      </nav>
    </div>
  );
}
