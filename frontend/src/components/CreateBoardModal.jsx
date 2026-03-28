import { useState } from 'react';
import { createBoard } from '../api';
import { BOARD_COLORS, BOARD_GRADIENTS, BOARD_IMAGES } from '../constants';

export default function CreateBoardModal({ onClose, onCreated, memberId }) {
  const [title, setTitle] = useState('');
  const [bgType, setBgType] = useState('image');
  const [bgValue, setBgValue] = useState(BOARD_IMAGES[0]);
  const [error, setError] = useState('');
  const [touched, setTouched] = useState(false);

  const submit = async (e) => {
    if (e) e.preventDefault();
    setTouched(true);
    if (!title.trim()) return;
    try {
      const board = await createBoard({ title: title.trim(), bg_type: bgType, bg_value: bgValue, member_id: memberId || null });
      if (board?.error) return setError(board.error.message);
      onCreated(board);
    } catch (err) {
      setError(err.message || 'API Error');
    }
  };

  const pickBg = (val, type) => { setBgValue(val); setBgType(type); };

  const showTitleError = touched && !title.trim();

  return (
    <div className="popover-overlay" onClick={onClose}>
      <div className="create-board-popover glass-heavy" onClick={e => e.stopPropagation()}>
        <div className="popover-header">
          <button className="icon-btn pop-header-btn" title="Back">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
          </button>
          <span className="pop-header-title">Create board</span>
          <button className="icon-btn pop-header-btn" onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>

        <div className="popover-body">
          <div className="board-preview-container">
            <div className="board-preview-mockup" style={{ background: bgType === 'image' ? `url(${bgValue}) center/cover` : bgValue }}>
              <div className="mock-cols">
                <div className="mock-col" />
                <div className="mock-col" />
                <div className="mock-col" />
              </div>
            </div>
          </div>

          <div className="popover-section">
            <label className="popover-label">Background</label>
            <div className="bg-rows">
              <div className="bg-row-images">
                {BOARD_IMAGES.slice(0, 4).map(img => (
                  <button key={img} className={`bg-thumb${bgValue===img?' sel':''}`} 
                    style={{ backgroundImage: `url(${img})` }} onClick={() => pickBg(img, 'image')} />
                ))}
              </div>
              <div className="bg-row-colors">
                {BOARD_COLORS.slice(0, 5).map(c => (
                  <button key={c} className={`bg-thumb-small${bgValue===c?' sel':''}`} 
                    style={{ background: c }} onClick={() => pickBg(c, 'color')} />
                ))}
                <button className="bg-thumb-small more-btn">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="2" /><circle cx="19" cy="12" r="2" /><circle cx="5" cy="12" r="2" /></svg>
                </button>
              </div>
            </div>
          </div>

          <div className="popover-section">
            <label className="popover-label">Board title <span className="req">*</span></label>
            <input 
              autoFocus 
              className={`pop-input ${showTitleError ? 'error' : ''}`}
              value={title} 
              onChange={e => { setTitle(e.target.value); setTouched(true); }}
              onKeyDown={e => { if (e.key === 'Enter') submit(); }}
            />
            {showTitleError && <div className="pop-error-msg">👋 Board title is required</div>}
            {error && <div className="pop-error-msg">{error}</div>}
          </div>

          <div className="popover-section">
            <label className="popover-label">Visibility</label>
            <div className="pop-select">
              <span>Workspace</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
            </div>
          </div>

          <button 
            className="btn-primary full pop-submit-btn" 
            disabled={!title.trim()}
            onClick={submit}
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
}
