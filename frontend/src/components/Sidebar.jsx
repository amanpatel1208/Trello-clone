import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const navItems = [
  { icon: '📋', label: 'Boards', path: '/' },
];

export default function Sidebar({ currentView = 'boards', onViewChange }) {
  const location = useLocation();
  const [isWorkspaceExpanded, setIsWorkspaceExpanded] = useState(true);

  // Helper for active state
  const isActive = (view) => currentView === view;

  return (
    <aside className="app-sidebar">
      <div className="sidebar-section">
        <Link 
          to="/" 
          className={`sidebar-item ${currentView === 'boards_global' && location.pathname === '/' ? 'active' : ''}`}
          onClick={() => onViewChange && onViewChange('boards_global')}
          style={{ borderRadius: 6 }}
        >
          <span className="sidebar-icon">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
              <rect x="2" y="2" width="7" height="11" rx="1.5" />
              <rect x="11" y="2" width="7" height="16" rx="1.5" />
            </svg>
          </span>
          <span className="sidebar-label">Boards</span>
        </Link>
      </div>

      <div className="sidebar-divider" />

      <div className="sidebar-section">
        <div 
          className="sidebar-heading" 
          style={{ display: 'flex', justifyContent: 'space-between', cursor: 'pointer', padding: '12px 16px', fontSize: '13px', fontWeight: 600, color: 'var(--text-sub)' }}
          onClick={() => setIsWorkspaceExpanded(!isWorkspaceExpanded)}
        >
          <span>WORKSPACES</span>
          <span>{isWorkspaceExpanded ? '▾' : '▸'}</span>
        </div>
        
        {isWorkspaceExpanded && (
          <div className="workspace-group">
            <div className="sidebar-item-ws active">
              <div className="ws-icon">T</div>
              <span className="sidebar-label">TodiIst Workspace</span>
            </div>
            
            <div className="workspace-sub-items" style={{ paddingLeft: 8 }}>
              {/* Differential Workspace Boards link */}
              <Link 
                to="/" 
                className={`sidebar-item ws-sub-link ${currentView === 'boards_workspace' && location.pathname === '/' ? 'active' : ''}`} 
                onClick={() => onViewChange && onViewChange('boards_workspace')}
                style={{ borderRadius: 6 }}
              >
                <span className="sidebar-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <line x1="9" y1="3" x2="9" y2="21" />
                  </svg>
                </span>
                <span className="sidebar-label">Boards</span>
              </Link>
              
              <div 
                className={`sidebar-item ${currentView === 'billing' ? 'active' : ''}`} 
                style={{ borderRadius: 6, cursor: 'pointer' }}
                onClick={() => onViewChange && onViewChange('billing')}
              >
                <span className="sidebar-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="5" width="20" height="14" rx="2" />
                    <line x1="2" y1="10" x2="22" y2="10" />
                  </svg>
                </span>
                <span className="sidebar-label">Billing</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="sidebar-footer">
        <div className="promo-box">
          <div className="promo-icon">✨</div>
          <div className="promo-text">Try TodiIst Premium for free!</div>
          <button className="promo-close" type="button">×</button>
        </div>
      </div>
    </aside>
  );
}
