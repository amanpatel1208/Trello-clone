import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import ReactMarkdown from 'react-markdown';
import {
  getCard, updateCard,
  getLabels, getMembers,
  addCardLabel, removeCardLabel,
  addCardMember, removeCardMember,
  addChecklistItem, updateChecklistItem, deleteChecklistItem,
  addAttachment, deleteAttachment,
  addComment, deleteComment,
} from '../api';
import { COVER_COLORS, BOARD_GRADIENTS, BOARD_IMAGES } from '../constants';
import { useMember } from '../context/MemberContext';

const PANELS = ['Members', 'Labels', 'Checklist', 'Dates', 'Cover', 'Attachment'];

export default function CardModal({ cardId, listTitle, onClose, onUpdated }) {
  const memberCtx = useMember() || {};
  const currentMember = memberCtx.currentMember;
  const [card, setCard] = useState(null);
  const [allLabels, setAllLabels] = useState([]);
  const [allMembers, setAllMembers] = useState([]);
  const [panel, setPanel] = useState(null);
  const [editDesc, setEditDesc] = useState(false);
  const [desc, setDesc] = useState('');
  const [comment, setComment] = useState('');
  const [newItemText, setNewItemText] = useState('');
  const [newAttachUrl, setNewAttachUrl] = useState('');
  const [newAttachName, setNewAttachName] = useState('');
  const [newCoverUrl, setNewCoverUrl] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [titleEdit, setTitleEdit] = useState(false);
  const [titleVal, setTitleVal] = useState('');
  const panelRef = useRef();

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const [c, labels, members] = await Promise.allSettled([
          getCard(cardId),
          getLabels(),
          getMembers()
        ]);

        if (!active) return;

        if (c.status === 'fulfilled') {
          const cardData = c.value;
          setCard(cardData);
          setDesc(cardData.description || '');
          setDueDate(cardData.due_date ? cardData.due_date.slice(0, 10) : '');
          setTitleVal(cardData.title);
        } else {
          console.error('Card fetch failed', c.reason);
        }

        if (labels.status === 'fulfilled') setAllLabels(labels.value);
        if (members.status === 'fulfilled') setAllMembers(members.value);
      } catch (err) {
        console.error('CardModal fetch error', err);
      }
    };
    load();
    return () => { active = false; };
  }, [cardId]);

  useEffect(() => {
    if (!panel) return;
    const h = (e) => { if (panelRef.current && !panelRef.current.contains(e.target)) setPanel(null); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [panel]);

  if (!card) return createPortal(
    <div className="overlay">
      <div className="card-modal loading-state">
        <div className="loading-spinner">
          <svg className="anim-spin" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
        </div>
        <div style={{ color: 'var(--text-sub)', fontWeight: 600 }}>Loading card...</div>
      </div>
    </div>,
    document.body
  );

  const patch = async (data) => {
    const updated = await updateCard(cardId, data);
    const next = { ...card, ...updated };
    setCard(next);
    onUpdated(next);
    return next;
  };

  const saveTitle = () => {
    setTitleEdit(false);
    if (titleVal.trim() && titleVal.trim() !== card.title) patch({ title: titleVal.trim() });
    else setTitleVal(card.title);
  };

  const toggleLabel = async (labelId) => {
    const has = card.labels.find(l => l.id === labelId);
    if (has) {
      await removeCardLabel(cardId, labelId);
      const next = { ...card, labels: card.labels.filter(l => l.id !== labelId) };
      setCard(next); onUpdated(next);
    } else {
      await addCardLabel(cardId, { labelId, performed_by: currentMember?.id });
      const next = { ...card, labels: [...card.labels, allLabels.find(l => l.id === labelId)] };
      setCard(next); onUpdated(next);
    }
  };

  const toggleMember = async (memberId) => {
    const has = card.members.find(m => m.id === memberId);
    if (has) {
      await removeCardMember(cardId, memberId);
      const next = { ...card, members: card.members.filter(m => m.id !== memberId) };
      setCard(next); onUpdated(next);
    } else {
      await addCardMember(cardId, { memberId, performed_by: currentMember?.id });
      const next = { ...card, members: [...card.members, allMembers.find(m => m.id === memberId)] };
      setCard(next); onUpdated(next);
    }
  };

  const submitItem = async (e) => {
    e.preventDefault();
    if (!newItemText.trim()) return;
    const item = await addChecklistItem(cardId, { text: newItemText, performed_by: currentMember?.id });
    setCard(c => ({ ...c, checklist_items: [...c.checklist_items, item] }));
    setNewItemText('');
  };

  const toggleItem = async (item) => {
    const updated = await updateChecklistItem(item.id, { is_complete: !item.is_complete, performed_by: currentMember?.id });
    setCard(c => ({ ...c, checklist_items: c.checklist_items.map(i => i.id === item.id ? updated : i) }));
  };

  const removeItem = async (itemId) => {
    await deleteChecklistItem(itemId);
    setCard(c => ({ ...c, checklist_items: c.checklist_items.filter(i => i.id !== itemId) }));
  };

  const submitAttachment = async (e) => {
    e.preventDefault();
    if (!newAttachUrl.trim()) return;
    const att = await addAttachment(cardId, { url: newAttachUrl, name: newAttachName || null, performed_by: currentMember?.id });
    if (att?.error) return;
    setCard(c => ({ ...c, attachments: [...c.attachments, att] }));
    setNewAttachUrl(''); setNewAttachName('');
    setPanel(null);
  };

  const removeAttach = async (attId) => {
    await deleteAttachment(cardId, attId);
    setCard(c => ({ ...c, attachments: c.attachments.filter(a => a.id !== attId) }));
  };

  const submitComment = async (e) => {
    e.preventDefault();
    if (!comment.trim() || !currentMember) return;
    const c = await addComment(cardId, { authorId: currentMember.id, text: comment });
    setCard(prev => ({ ...prev, comments: [...prev.comments, c], activity: [{ action_type: 'ADD_COMMENT', performer_name: currentMember.name, details: { text: comment.slice(0, 50) }, created_at: new Date().toISOString() }, ...prev.activity] }));
    setComment('');
  };

  const removeCommentItem = async (commentId) => {
    await deleteComment(cardId, commentId);
    setCard(c => ({ ...c, comments: c.comments.filter(x => x.id !== commentId) }));
  };

  const done = card.checklist_items.filter(i => i.is_complete).length;
  const total = card.checklist_items.length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const coverStyle = card.cover_type === 'color' || card.cover_type === 'gradient' ? { background: card.cover_value }
    : card.cover_type === 'image' ? { backgroundImage: `url(${card.cover_value})`, backgroundSize: 'cover', backgroundPosition: 'center' }
      : null;

  return createPortal(
    <div className="overlay" onClick={onClose}>
      <div className="card-modal" onClick={e => e.stopPropagation()}>
        {coverStyle && (
          <div className="card-modal-cover" style={coverStyle}>
            <button className="cover-edit-btn" onClick={() => setPanel(p => p === 'Cover' ? null : 'Cover')}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
              Cover
            </button>
          </div>
        )}

        <div className="card-modal-inner">
          {/* Title */}
          <div className="cm-title-row">
            <input
              type="checkbox"
              className="card-complete-checkbox"
              checked={card.is_complete || false}
              onChange={async () => {
                const next = await patch({ is_complete: !card.is_complete });
                setCard(next);
              }}
              style={{ flexShrink: 0, marginTop: 4 }}
              title={card.is_complete ? "Mark incomplete" : "Mark complete"}
            />
            <div style={{ flex: 1 }}>
              {titleEdit
                ? <textarea className="cm-title-input" autoFocus value={titleVal}
                  onChange={e => setTitleVal(e.target.value)}
                  onBlur={saveTitle}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); saveTitle(); } if (e.key === 'Escape') { setTitleEdit(false); setTitleVal(card.title); } }} />
                : <h2 className="cm-title" onClick={() => setTitleEdit(true)}>{card.title}</h2>
              }
              <div className="cm-list-name">in list <strong>{listTitle}</strong></div>
            </div>
          </div>

          <div className="cm-body">
            <div className="cm-main">
              {/* Badges */}
              {(card.members?.length > 0 || card.labels?.length > 0 || card.due_date) && (
                <div className="cm-badges">
                  {card.members?.length > 0 && (
                    <div className="cm-badge-group">
                      <div className="cm-badge-label">Members</div>
                      <div className="cm-badge-content">
                        {card.members.map(m => (
                          <img
                            key={m.id}
                            src={m.avatar_url}
                            alt={m.name}
                            className="avatar-img"
                            title={m.name}
                            onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(m.name)}&background=random`; }}
                          />
                        ))}
                        <button className="avatar-add" onClick={() => setPanel(p => p === 'Members' ? null : 'Members')}>+</button>
                      </div>
                    </div>
                  )}
                  {card.labels?.length > 0 && (
                    <div className="cm-badge-group">
                      <div className="cm-badge-label">Labels</div>
                      <div className="cm-badge-content">
                        {card.labels.map(l => <span key={l.id} className="label-badge" style={{ background: l.color }}>{l.name}</span>)}
                        <button className="label-add-btn" onClick={() => setPanel(p => p === 'Labels' ? null : 'Labels')}>+</button>
                      </div>
                    </div>
                  )}
                  {card.due_date && (() => {
                    const due = new Date(card.due_date);
                    const now = new Date();
                    const isToday = due.toDateString() === now.toDateString();
                    const isOverdue = !card.is_complete && due < now && !isToday;
                    const isDueSoon = !card.is_complete && !isOverdue && (due - now) < 86400000;
                    return (
                      <div className="cm-badge-group">
                        <div className="cm-badge-label">Due date</div>
                        <div className="cm-badge-content">
                          <span
                            className={`due-badge${isOverdue ? ' overdue' : isToday ? ' due-today' : isDueSoon ? ' due-soon' : ''}${card.is_complete ? ' done' : ''}`}
                            onClick={() => setPanel(p => p === 'Dates' ? null : 'Dates')}
                            title={isOverdue ? 'Overdue' : isToday ? 'Due today' : ''}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 4 }}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                            {due.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                            {isOverdue && <span style={{ marginLeft: 4, fontWeight: 700 }}>· Overdue</span>}
                            {isToday && <span style={{ marginLeft: 4, fontWeight: 700 }}>· Today</span>}
                            {card.is_complete && <span style={{ marginLeft: 4 }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg></span>}
                          </span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Description */}
              <div className="cm-section">
                <div className="cm-section-header">
                  <span className="cm-icon" style={{ display: 'flex', alignItems: 'center', opacity: 0.8 }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="21" y1="10" x2="3" y2="10"></line><line x1="21" y1="6" x2="3" y2="6"></line><line x1="21" y1="14" x2="3" y2="14"></line><line x1="21" y1="18" x2="3" y2="18"></line></svg>
                  </span>
                  <h3>Description</h3>
                  {!editDesc && <button className="btn-sm" onClick={() => setEditDesc(true)}>Edit</button>}
                </div>
                {editDesc ? (
                  <div>
                    <textarea autoFocus value={desc} onChange={e => setDesc(e.target.value)}
                      placeholder="Add a description (Markdown supported)…" rows={6} maxLength={5000} />
                    <div className="char-count">{desc.length}/5000</div>
                    <div className="form-row" style={{ marginTop: 6 }}>
                      <button className="btn-primary" onClick={() => { patch({ description: desc }); setEditDesc(false); }}>Save</button>
                      <button className="btn-ghost" onClick={() => { setDesc(card.description || ''); setEditDesc(false); }}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div className={`desc-display${!desc ? ' empty' : ''}`} onClick={() => setEditDesc(true)} style={{ whiteSpace: 'pre-wrap' }}>
                    {desc || 'Add a more detailed description…'}
                  </div>
                )}
              </div>

              {/* Checklist */}
              {total > 0 && (
                <div className="cm-section">
                  <div className="cm-section-header">
                    <span className="cm-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>
                    </span>
                    <h3>Checklist</h3>
                  </div>
                  <div className="checklist-progress">
                    <span className="pct-label">{pct}%</span>
                    <div className="progress-track"><div className="progress-fill" style={{ width: pct + '%', background: pct === 100 ? '#61bd4f' : '#0079bf' }} /></div>
                  </div>
                  {card.checklist_items.map(item => (
                    <label key={item.id} className={`checklist-item${item.is_complete ? ' done' : ''}`}>
                      <input type="checkbox" checked={item.is_complete} onChange={() => toggleItem(item)} />
                      <span>{item.text}</span>
                      <button className="item-delete" onClick={() => removeItem(item.id)}>✕</button>
                    </label>
                  ))}
                </div>
              )}
              <form className="add-item-form" onSubmit={submitItem}>
                <input placeholder="Add a checklist item…" value={newItemText} onChange={e => setNewItemText(e.target.value)} maxLength={200} />
                <button type="submit" className="btn-primary btn-sm" disabled={!newItemText.trim()}>Add</button>
              </form>

              {/* Attachments */}
              {card.attachments?.length > 0 && (
                <div className="cm-section">
                  <div className="cm-section-header">
                    <span className="cm-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>
                    </span>
                    <h3>Attachments</h3>
                  </div>
                  {card.attachments.map(a => (
                    <div key={a.id} className="attachment-item">
                      <a href={a.url} target="_blank" rel="noreferrer" className="attachment-link">
                        <span className="attachment-icon">🔗</span>
                        <div>
                          <div className="attachment-name">{a.name || a.url}</div>
                          <div className="attachment-url">{a.url}</div>
                        </div>
                      </a>
                      <button className="item-delete" onClick={() => removeAttach(a.id)}>✕</button>
                    </div>
                  ))}
                </div>
              )}

              {/* Activity */}
              <div className="cm-section">
                <div className="cm-section-header">
                  <span className="cm-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
                  </span>
                  <h3>Activity</h3>
                </div>
                {currentMember && (
                  <form className="comment-form" onSubmit={submitComment}>
                    <img
                      src={currentMember.avatar_url}
                      alt={currentMember.name}
                      className="avatar-img"
                      onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(currentMember.name)}&background=random`; }}
                    />
                    <div style={{ flex: 1 }}>
                      <textarea placeholder="Write a comment…" value={comment} onChange={e => setComment(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitComment(e); } }} rows={2} />
                      {comment && <button type="submit" className="btn-primary btn-sm" style={{ marginTop: 6 }}>Save</button>}
                    </div>
                  </form>
                )}
                {/* Merge comments + activity, sorted by time */}
                {[
                  ...(card.comments || []).map(c => ({ ...c, _type: 'comment' })),
                  ...(card.activity || []).map(a => ({ ...a, _type: 'activity' })),
                ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).map((item, i) => (
                  item._type === 'comment' ? (
                    <div key={`c-${item.id}`} className="comment-item">
                      <img
                        src={item.author_avatar}
                        alt={item.author_name}
                        className="avatar-img"
                        onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(item.author_name)}&background=random`; }}
                      />
                      <div className="comment-body">
                        <div className="comment-meta">
                          <strong>{item.author_name}</strong>
                          <span className="comment-time">{new Date(item.created_at).toLocaleString()}</span>
                        </div>
                        <div className="comment-text">{item.text}</div>
                        {currentMember?.id === item.author_id && (
                          <button className="comment-delete" onClick={() => removeCommentItem(item.id)}>Delete</button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div key={`a-${item.id || i}`} className="activity-item">
                      {item.performer_avatar
                        ? <img src={item.performer_avatar} alt={item.performer_name} className="avatar-img sm" />
                        : <div className="avatar-placeholder sm" />
                      }
                      <div className="activity-text">
                        <strong>{item.performer_name || 'System'}</strong> {formatActivity(item)}
                        <span className="comment-time"> · {new Date(item.created_at).toLocaleString()}</span>
                      </div>
                    </div>
                  )
                ))}
              </div>
            </div>

            {/* Sidebar */}
            <div className="cm-sidebar" ref={panelRef}>
              <div className="cm-sidebar-heading">Add to card</div>
              {PANELS.map(p => (
                <button key={p} className={`sidebar-action-btn${panel === p ? ' active' : ''}`}
                  onClick={() => setPanel(x => x === p ? null : p)}>
                  {panelIcon(p)} {p}
                </button>
              ))}

              {panel === 'Members' && (
                <div className="sidebar-panel">
                  <div className="panel-header"><span>Members</span><button className="icon-btn" onClick={() => setPanel(null)}>✕</button></div>
                  {allMembers.map(m => {
                    const assigned = card.members.find(x => x.id === m.id);
                    return (
                      <button key={m.id} className={`member-option${assigned ? ' checked' : ''}`} onClick={() => toggleMember(m.id)}>
                        <img src={m.avatar_url} alt={m.name} className="avatar-img sm" />
                        <span>{m.name}</span>
                        {assigned && <span className="check">✓</span>}
                      </button>
                    );
                  })}
                </div>
              )}

              {panel === 'Labels' && (
                <div className="sidebar-panel">
                  <div className="panel-header"><span>Labels</span><button className="icon-btn" onClick={() => setPanel(null)}>✕</button></div>
                  {allLabels.map(l => {
                    const assigned = card.labels.find(x => x.id === l.id);
                    return (
                      <button key={l.id} className={`label-option${assigned ? ' checked' : ''}`} onClick={() => toggleLabel(l.id)}>
                        <span className="label-swatch" style={{ background: l.color }} />
                        <span>{l.name}</span>
                        {assigned && <span className="check">✓</span>}
                      </button>
                    );
                  })}
                </div>
              )}

              {panel === 'Checklist' && (
                <div className="sidebar-panel">
                  <div className="panel-header"><span>Add checklist item</span><button className="icon-btn" onClick={() => setPanel(null)}>✕</button></div>
                  <form onSubmit={e => { submitItem(e); setPanel(null); }}>
                    <input autoFocus placeholder="Item text…" value={newItemText} onChange={e => setNewItemText(e.target.value)} maxLength={200} />
                    <button type="submit" className="btn-primary full" style={{ marginTop: 8 }} disabled={!newItemText.trim()}>Add item</button>
                  </form>
                </div>
              )}

              {panel === 'Dates' && (
                <div className="sidebar-panel">
                  <div className="panel-header"><span>Due date</span><button className="icon-btn" onClick={() => setPanel(null)}>✕</button></div>
                  <label className="field-label" style={{ marginBottom: 6 }}>Select date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    style={{ width: '100%', marginBottom: 8 }}
                  />
                  <button
                    className="btn-primary full"
                    disabled={!dueDate}
                    onClick={() => { patch({ due_date: dueDate }); setPanel(null); }}
                  >Save due date</button>
                  {(dueDate || card.due_date) && (
                    <button className="btn-ghost full" style={{ marginTop: 6 }} onClick={() => { setDueDate(''); patch({ due_date: null }); setPanel(null); }}>Remove</button>
                  )}

                </div>
              )}

              {panel === 'Cover' && (
                <div className="sidebar-panel">
                  <div className="panel-header"><span>Cover</span><button className="icon-btn" onClick={() => setPanel(null)}>✕</button></div>
                  <p className="field-label" style={{ marginBottom: 6 }}>Colors</p>
                  <div className="cover-colors">
                    {COVER_COLORS.map(c => (
                      <button key={c} className={`cover-swatch${card.cover_value === c ? ' sel' : ''}`}
                        style={{ background: c }} onClick={() => { patch({ cover_type: 'color', cover_value: c }); setPanel(null); }} />
                    ))}
                  </div>
                  <p className="field-label" style={{ marginTop: 12, marginBottom: 6 }}>Gradients</p>
                  <div className="cover-colors" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
                    {BOARD_GRADIENTS.map(g => (
                      <button key={g} className={`cover-swatch${card.cover_value === g ? ' sel' : ''}`}
                        style={{ background: g }} onClick={() => { patch({ cover_type: 'gradient', cover_value: g }); setPanel(null); }} />
                    ))}
                  </div>
                  <p className="field-label" style={{ marginTop: 12, marginBottom: 6 }}>Photos</p>
                  <div className="cover-colors" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
                    {BOARD_IMAGES.map(img => (
                      <button key={img} className={`cover-swatch${card.cover_value === img ? ' sel' : ''}`}
                        style={{ backgroundImage: `url(${img})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
                        onClick={() => { patch({ cover_type: 'image', cover_value: img }); setPanel(null); }} />
                    ))}
                  </div>
                  <p className="field-label" style={{ marginTop: 12, marginBottom: 6 }}>Custom Image URL</p>
                  <div className="cover-image-form">
                    <input
                      placeholder="https://example.com/image.jpg"
                      value={newCoverUrl}
                      onChange={e => setNewCoverUrl(e.target.value)}
                    />
                    {newCoverUrl && (
                      <div
                        className="cover-image-preview"
                        style={{ backgroundImage: `url(${newCoverUrl})` }}
                      >
                        {!newCoverUrl.match(/\.(jpg|jpeg|png|gif|webp|svg)/i) && <span>Enter a direct image URL</span>}
                      </div>
                    )}
                    <button
                      className="btn-primary full"
                      style={{ marginTop: 8 }}
                      disabled={!newCoverUrl.trim()}
                      onClick={() => { patch({ cover_type: 'image', cover_value: newCoverUrl.trim() }); setNewCoverUrl(''); setPanel(null); }}
                    >Apply Image Cover</button>
                  </div>
                  {(card.cover_type || card.cover_value) && (
                    <button className="btn-ghost full" style={{ marginTop: 8 }} onClick={() => { patch({ cover_type: null, cover_value: null }); setPanel(null); }}>Remove cover</button>
                  )}
                </div>
              )}

              {panel === 'Attachment' && (
                <div className="sidebar-panel">
                  <div className="panel-header"><span>Attach link</span><button className="icon-btn" onClick={() => setPanel(null)}>✕</button></div>
                  <form onSubmit={submitAttachment}>
                    <label className="field-label">URL</label>
                    <input autoFocus placeholder="https://…" value={newAttachUrl} onChange={e => setNewAttachUrl(e.target.value)} />
                    <label className="field-label" style={{ marginTop: 8 }}>Display name (optional)</label>
                    <input placeholder="e.g. GitHub Repo" value={newAttachName} onChange={e => setNewAttachName(e.target.value)} />
                    <button type="submit" className="btn-primary full" style={{ marginTop: 8 }} disabled={!newAttachUrl.trim()}>Attach</button>
                  </form>
                </div>
              )}

              <div className="cm-sidebar-heading" style={{ marginTop: 16 }}>Actions</div>
              <button className="sidebar-action-btn danger" onClick={async () => {
                if (window.confirm('Archive this card?')) { await patch({ archived: true }); onClose(); }
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 8 }}><polyline points="21 8 21 21 3 21 3 8"></polyline><rect x="1" y="3" width="22" height="5"></rect><line x1="10" y1="12" x2="14" y2="12"></line></svg>
                Archive
              </button>
            </div>
          </div>
        </div>
        <button className="modal-close-btn" onClick={onClose}>✕</button>
      </div>
    </div>,
    document.body
  );
}

function formatActivity(item) {
  const d = item.details || {};
  switch (item.action_type) {
    case 'CREATE_CARD': return `created this card`;
    case 'MOVE_CARD': return `moved this card from "${d.from}" to "${d.to}"`;
    case 'ADD_LABEL': return `added label "${d.label}"`;
    case 'REMOVE_LABEL': return `removed label "${d.label}"`;
    case 'ADD_MEMBER': return `added ${d.member} to this card`;
    case 'REMOVE_MEMBER': return `removed ${d.member} from this card`;
    case 'COMPLETE_CHECKLIST_ITEM': return `${d.complete ? 'completed' : 'unchecked'} "${d.item}"`;
    case 'ADD_COMMENT': return `commented`;
    case 'ADD_ATTACHMENT': return `attached a link`;
    default: return item.action_type.toLowerCase().replace(/_/g, ' ');
  }
}

function panelIcon(p) {
  const props = { width: 14, height: 14, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round", style: { marginRight: 8 } };
  const icons = {
    Members: <svg {...props}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>,
    Labels: <svg {...props}><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>,
    Checklist: <svg {...props}><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>,
    Dates: <svg {...props}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>,
    Cover: <svg {...props}><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>,
    Attachment: <svg {...props}><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>
  };
  return icons[p] || null;
}

