import { useState, useEffect, useRef } from 'react';
import { getMembers, getBoardActivity } from '../api';

export default function MemberActivityDropdown({ boardId, onClose }) {
  const [members, setMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    getMembers().then(setMembers).catch(console.error);
    
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  useEffect(() => {
    if (selectedMember) {
      setLoading(true);
      getBoardActivity(boardId, selectedMember.id)
        .then(setActivity)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [selectedMember, boardId]);

  return (
    <div className="member-activity-dropdown glass-heavy" ref={dropdownRef}>
      <div className="dropdown-header">
        <div className="header-top">
          {selectedMember ? (
            <button className="back-btn" onClick={() => setSelectedMember(null)}>← Members</button>
          ) : (
            <span className="dropdown-title">Member Activity</span>
          )}
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
      </div>

      <div className="dropdown-content">
        {!selectedMember ? (
          <div className="member-list">
            {members.map(m => (
              <button key={m.id} className="member-item" onClick={() => setSelectedMember(m)}>
                <img src={m.avatar_url} alt={m.name} className="nav-avatar sm" />
                <span className="member-name">{m.name}</span>
                <span className="chevron">›</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="activity-feed">
            <div className="selected-member-info">
              <img src={selectedMember.avatar_url} alt={selectedMember.name} className="nav-avatar" />
              <div>
                <div className="name">{selectedMember.name}</div>
                <div className="meta">Recent actions</div>
              </div>
            </div>
            
            {loading ? (
              <div className="loading">Loading...</div>
            ) : activity.length === 0 ? (
              <div className="no-activity">No recent activity detected.</div>
            ) : (
              <div className="activity-list">
                {activity.map(a => (
                  <div key={a.id} className="activity-mini-item">
                    <div className="activity-desc">
                      <span className="card-link">{a.card_title || 'a card'}</span>
                      <span className="action"> {a.action_type.replace('_', ' ')}</span>
                    </div>
                    <div className="activity-date">{new Date(a.created_at).toLocaleDateString()}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
