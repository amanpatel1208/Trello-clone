import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors,
  closestCorners, pointerWithin, rectIntersection, getFirstCollision,
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core';
import {
  SortableContext, useSortable, arrayMove,
  horizontalListSortingStrategy, verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getBoard, updateBoard, createList, updateList, reorderList, deleteList, createCard, moveCard, updateCard, deleteCard, toggleStarBoard, getBoardActivity } from '../api';
import CardModal from '../components/CardModal';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import CalendarPanel from '../components/CalendarPanel';
import BoardSwitcherPanel from '../components/BoardSwitcherPanel';
import BottomNav from '../components/BottomNav';
import MemberActivityDropdown from '../components/MemberActivityDropdown';
import { useMember } from '../context/MemberContext';
import { BOARD_COLORS, BOARD_GRADIENTS, BOARD_IMAGES, LIST_COLORS, LIST_GRADIENTS } from '../constants';

export default function Board() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentMember } = useMember();
  const [board, setBoard] = useState(null);
  const [lists, setLists] = useState([]);
  const [cards, setCards] = useState({}); // { listId: [card] }
  const [activeId, setActiveId] = useState(null);
  const [activeType, setActiveType] = useState(null);
  const [selectedCardId, setSelectedCardId] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [editBoardTitle, setEditBoardTitle] = useState(false);
  const [boardTitle, setBoardTitle] = useState('');
  const [starred, setStarred] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [plannerOpen, setPlannerOpen] = useState(false);
  const [boardsOpen, setBoardsOpen] = useState(false);
  const [showMemberActivity, setShowMemberActivity] = useState(false);
  const [archiveStack, setArchiveStack] = useState([]); // For Undo
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const fetchBoardData = useCallback(() => {
    getBoard(id, currentMember?.id).then(data => {
      setBoard(data);
      setBoardTitle(data.title);
      setStarred(data.is_starred);
      setLists(data.lists);
      const byList = {};
      data.lists.forEach(l => { byList[l.id] = []; });
      data.cards.forEach(c => { if (byList[c.list_id]) byList[c.list_id].push(c); });
      setCards(byList);
    });
  }, [id, currentMember]);

  useEffect(() => {
    fetchBoardData();
  }, [fetchBoardData]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const findContainer = (id) => {
    if (lists.find(l => `list-${l.id}` === id)) return id;
    const list = lists.find(l => (cards[l.id] || []).some(c => `card-${c.id}` === id));
    return list ? `list-${list.id}` : null;
  };

  const onDragOver = ({ active, over }) => {
    if (!over) return;
    const activeId = active.id;
    const overId = over.id;
    if (activeId === overId) return;
    const activeContainer = findContainer(activeId);
    const overContainer = findContainer(overId);
    if (!activeContainer || !overContainer || activeContainer === overContainer) return;
    const actIdNum = active.data.current.id;
    const overIdNum = over.data.current.id;
    const actListId = parseInt(activeContainer.replace('list-', ''));
    const overListId = parseInt(overContainer.replace('list-', ''));

    setCards(prev => {
      const activeItems = prev[actListId] || [];
      const overItems = prev[overListId] || [];
      const activeIndex = activeItems.findIndex(c => c.id === actIdNum);
      const overIndex = over.data.current.type === 'list' ? overItems.length : overItems.findIndex(c => c.id === overIdNum);
      let newIndex = overIndex in overItems ? overIndex : overItems.length;
      const movedCard = activeItems[activeIndex];
      if (!movedCard) return prev;
      return {
        ...prev,
        [actListId]: activeItems.filter(c => c.id !== actIdNum),
        [overListId]: [
          ...overItems.slice(0, newIndex),
          { ...movedCard, list_id: overListId },
          ...overItems.slice(newIndex)
        ]
      };
    });
  };

  const onDragStart = ({ active }) => {
    setActiveId(active.data.current?.id);
    setActiveType(active.data.current?.type);
  };

  const onDragEnd = ({ active, over, cancelled }) => {
    setActiveId(null);
    setActiveType(null);
    if (!over || cancelled) return;
    const type = active.data.current?.type;
    const activeIdNum = active.data.current?.id;
    const overIdNum = over.data.current?.id;
    const overType = over.data.current?.type;

    if (type === 'list') {
      const oldIdx = lists.findIndex(l => l.id === activeIdNum);
      const newIdx = lists.findIndex(l => l.id === overIdNum);
      if (oldIdx !== -1 && newIdx !== -1 && oldIdx !== newIdx) {
        setLists(prev => arrayMove(prev, oldIdx, newIdx));
        reorderList(activeIdNum, { newPosition: newIdx + 1 });
      }
      return;
    }

    if (type === 'card') {
      const activeId = active.id;
      const overId = over.id;
      const activeContainer = findContainer(activeId);
      const overContainer = findContainer(overId);
      if (!activeContainer || !overContainer) return;

      const actListId = parseInt(activeContainer.replace('list-', ''));
      const overListId = parseInt(overContainer.replace('list-', ''));
      const listCards = cards[overListId] || [];
      const oldIdx = listCards.findIndex(c => c.id === activeIdNum);
      const newIdx = overType === 'list' ? listCards.length - 1 : listCards.findIndex(c => c.id === overIdNum);

      if (oldIdx !== -1 && newIdx !== -1 && oldIdx !== newIdx) {
        const reordered = arrayMove(listCards, oldIdx, newIdx);
        setCards(prev => ({ ...prev, [overListId]: reordered }));
        moveCard(activeIdNum, { newListId: overListId, newPosition: Math.max(0, newIdx) + 1, performed_by: currentMember?.id });
      } else if (oldIdx !== -1 || activeContainer !== overContainer) {
        moveCard(activeIdNum, { newListId: overListId, newPosition: Math.max(0, newIdx) + 1, performed_by: currentMember?.id });
      }
    }
  };

  useEffect(() => {
    const handleUndo = async (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        if (archiveStack.length === 0) return;
        const last = archiveStack[archiveStack.length - 1];
        setArchiveStack(prev => prev.slice(0, -1));
        const restored = await updateCard(last.id, { archived: false, list_id: last.list_id, position: last.position });
        handleCardUpdated(restored);
      }
    };
    window.addEventListener('keydown', handleUndo);
    return () => window.removeEventListener('keydown', handleUndo);
  }, [archiveStack]);

  const handleCardUpdated = async (updated) => {
    let patchData = updated;
    if (updated.is_complete) {
      const doneList = lists.find(l => l.title.toLowerCase() === 'done');
      if (doneList && updated.list_id !== doneList.id) {
        patchData = await updateCard(updated.id, { list_id: doneList.id });
      }
    }
    setCards(prev => {
      const next = { ...prev };
      // Find existing card to preserve join data (labels, members, etc.)
      let existingCard = null;
      Object.values(next).forEach(list => {
        const found = list.find(c => c.id === patchData.id);
        if (found) existingCard = found;
      });
      const finalCard = existingCard ? { ...existingCard, ...patchData } : patchData;
      Object.keys(next).forEach(lid => { next[lid] = next[lid].filter(c => c.id !== finalCard.id); });
      const targetLid = finalCard.list_id;
      if (next[targetLid]) {
        next[targetLid] = [...next[targetLid], finalCard].sort((a, b) => a.position - b.position);
      } else {
        next[targetLid] = [finalCard];
      }
      return next;
    });
  };

  const collisionDetectionStrategy = useCallback((args) => {
    const pointerCollisions = pointerWithin(args);
    if (pointerCollisions.length > 0) return pointerCollisions;
    return closestCorners(args);
  }, []);

  const listIds = useMemo(() => lists.map(l => `list-${l.id}`), [lists]);
  const activeCard = activeType === 'card' ? Object.values(cards).flat().find(c => c.id === activeId) : null;
  const activeList = activeType === 'list' ? lists.find(l => l.id === activeId) : null;
  const selectedCard = selectedCardId ? Object.values(cards).flat().find(c => c.id === selectedCardId) : null;
  const selectedListTitle = selectedCard ? lists.find(l => l.id === selectedCard.list_id)?.title : '';

  const handleToggleStar = async () => {
    const { is_starred } = await toggleStarBoard(id, currentMember?.id);
    setStarred(is_starred);
  };

  if (!board) return <div className="board-loading"><div className="spinner" /></div>;

  return (
    <div className="app-container" style={{ 
      background: board.bg_type === 'image' ? `url(${board.bg_value}) center/cover fixed` : board.bg_value 
    }}>
      <Navbar boardTitle={board.title} onToggleSidebar={() => setSidebarOpen(o => !o)} />
      <CalendarPanel isOpen={plannerOpen} onClose={() => setPlannerOpen(false)} boardId={id} lists={lists} onCardAdded={handleCardUpdated} />
      <BoardSwitcherPanel isOpen={boardsOpen} onClose={() => setBoardsOpen(false)} currentBoardId={id} />
      
      <div className={`sidebar-backdrop${sidebarOpen ? ' visible' : ''}`} onClick={() => setSidebarOpen(false)} />
      <div className="app-body">
        <main className="board-page">
          <div className="board-header">
            <div className="bh-left">
              {editBoardTitle
                ? <input className="board-title-input" autoFocus value={boardTitle}
                    onChange={e => setBoardTitle(e.target.value)}
                    onBlur={() => { setEditBoardTitle(false); if (boardTitle.trim()) { updateBoard(id, { title: boardTitle.trim() }); setBoard(b => ({ ...b, title: boardTitle.trim() })); } else setBoardTitle(board.title); }}
                    onKeyDown={e => { if (e.key === 'Enter') e.target.blur(); if (e.key === 'Escape') { setEditBoardTitle(false); setBoardTitle(board.title); } }} />
                : <h1 className="board-title-btn" onClick={() => setEditBoardTitle(true)}>{board.title}</h1>
              }
              <button className={`icon-btn bh-star${starred ? ' is-starred' : ''}`} style={{ marginLeft: 8 }} onClick={handleToggleStar}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill={starred ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </button>
            </div>
            <div className="bh-right">
              <button className="icon-btn bh-activity-toggle" onClick={() => setShowMemberActivity(o => !o)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}>
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
                Member Activity
              </button>
              {showMemberActivity && <MemberActivityDropdown boardId={id} onClose={() => setShowMemberActivity(false)} />}
              <button className="btn-primary bh-share" onClick={() => setShowShare(true)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}>
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="8.5" cy="7" r="4" />
                  <line x1="20" y1="8" x2="20" y2="14" />
                  <line x1="17" y1="11" x2="23" y2="11" />
                </svg>
                Share
              </button>
              <button className="icon-btn bh-menu active-adaptive" onClick={() => setMenuOpen(o => !o)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="1" />
                  <circle cx="19" cy="12" r="1" />
                  <circle cx="5" cy="12" r="1" />
                </svg>
              </button>
              {menuOpen && (
                <BoardMenuPanel 
                  board={board} 
                  boardId={id} 
                  onClose={() => setMenuOpen(false)} 
                  onUpdated={updated => setBoard(b => ({ ...b, ...updated }))} 
                  onRestored={fetchBoardData}
                  isStarred={starred}
                  onToggleStar={async () => {
                    const { is_starred } = await toggleStarBoard(id, currentMember.id);
                    setStarred(is_starred);
                  }}
                />
              )}
            </div>
          </div>

          <DndContext sensors={sensors} collisionDetection={collisionDetectionStrategy} onDragStart={onDragStart} onDragOver={onDragOver} onDragEnd={onDragEnd}>
            <SortableContext items={listIds} strategy={horizontalListSortingStrategy}>
              <div className="lists-row">
                {lists.map(list => (
                  <SortableList key={list.id} list={list} cards={cards[list.id] || []}
                    onCardClick={setSelectedCardId}
                    onCardAdded={(card) => setCards(prev => ({ ...prev, [list.id]: [...(prev[list.id]||[]), card] }))}
                    onCardArchive={async (card) => {
                      setArchiveStack(prev => [...prev, card]);
                      await updateCard(card.id, { archived: true });
                      setCards(prev => ({ ...prev, [card.list_id]: (prev[card.list_id]||[]).filter(c => c.id !== card.id) }));
                    }}
                    onCardToggleComplete={async (card) => {
                      const newComplete = !card.is_complete;
                      setCards(prev => {
                        const next = { ...prev };
                        next[card.list_id] = next[card.list_id].map(c => c.id === card.id ? { ...c, is_complete: newComplete } : c);
                        return next;
                      });
                      const updated = await updateCard(card.id, { is_complete: newComplete });
                      handleCardUpdated(updated);
                    }}
                    onListArchived={async () => {
                      await updateList(list.id, { archived: true });
                      setLists(ls => ls.filter(l => l.id !== list.id));
                    }}
                    onListRenamed={(title) => setLists(ls => ls.map(l => l.id === list.id ? { ...l, title } : l))}
                    onListColorChanged={(listId, color) => setLists(ls => ls.map(l => l.id === listId ? { ...l, color } : l))}
                    currentMember={currentMember}
                  />
                ))}
                <AddListForm boardId={id} onAdded={(list) => { setLists(ls => [...ls, list]); setCards(prev => ({ ...prev, [list.id]: [] })); }} />
              </div>
            </SortableContext>
            <DragOverlay dropAnimation={{ sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.5' } } }) }}>
              {activeCard && <CardItemOverlay card={activeCard} />}
              {activeList && <ListOverlay list={activeList} cards={cards[activeList.id] || []} />}
            </DragOverlay>
          </DndContext>
          <BottomNav 
            onTogglePlanner={() => setPlannerOpen(o => !o)} 
            onToggleBoards={() => setBoardsOpen(o => !o)} 
            plannerOpen={plannerOpen}
            boardsOpen={boardsOpen}
          />
        </main>
      </div>
      {showShare && (
        <div className="overlay" onClick={() => setShowShare(false)}>
          <div className="card-modal" style={{ width: 400, padding: 24 }} onClick={e => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setShowShare(false)}>✕</button>
            <h2 style={{ marginBottom: 16 }}>Share Board</h2>
            <div style={{ display: 'flex', gap: 8 }}>
              <input readOnly value={window.location.href} style={{ flex: 1 }} />
              <button className="btn-primary" onClick={() => navigator.clipboard.writeText(window.location.href)}>Copy</button>
            </div>
          </div>
        </div>
      )}
      {selectedCardId && (
        <CardModal cardId={selectedCardId} listTitle={selectedListTitle} onClose={() => setSelectedCardId(null)} onUpdated={handleCardUpdated} />
      )}
    </div>
  );
}

const SortableList = React.memo(({ list, cards, onCardClick, onCardAdded, onCardArchive, onCardToggleComplete, onListArchived, onListRenamed, onListColorChanged, currentMember }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: `list-${list.id}`, data: { type: 'list', id: list.id } });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 };
  const [listMenu, setListMenu] = useState(false);
  const [colorPicker, setColorPicker] = useState(false);
  const [editTitle, setEditTitle] = useState(false);
  const [titleVal, setTitleVal] = useState(list.title);
  const [addingCard, setAddingCard] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const cardInputRef = useRef();
  const menuRef = useRef();
  useEffect(() => { if (addingCard && cardInputRef.current) cardInputRef.current.focus(); }, [addingCard]);

  // Click-outside-to-close for list menu
  useEffect(() => {
    if (!listMenu) return;
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setListMenu(false);
        setColorPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [listMenu]);

  const saveTitle = () => {
    setEditTitle(false);
    if (titleVal.trim() && titleVal.trim() !== list.title) {
      updateList(list.id, { title: titleVal.trim() });
      onListRenamed(titleVal.trim());
    } else setTitleVal(list.title);
  };

  const submitCard = async () => {
    if (!newCardTitle.trim()) return;
    const card = await createCard(list.id, { title: newCardTitle.trim(), performed_by: currentMember?.id });
    onCardAdded(card);
    setNewCardTitle('');
    cardInputRef.current?.focus();
  };

  const handleColorChange = async (color) => {
    await updateList(list.id, { color });
    onListColorChanged(list.id, color);
  };

  const sortableItems = useMemo(() => cards.map(c => `card-${c.id}`), [cards]);

  const listBg = list.color || '#000000';

  return (
    <div ref={setNodeRef} style={style} className={`list-wrapper${isDragging ? ' dragging' : ''}${isCollapsed ? ' collapsed' : ''}`}>
      <div className="list" style={{ background: listBg }} {...attributes} {...listeners}>
        <div className="list-header">
          {editTitle
            ? <input className="list-title-input" autoFocus value={titleVal} onChange={e => setTitleVal(e.target.value)} onBlur={saveTitle} onKeyDown={e => { if (e.key === 'Enter') saveTitle(); if (e.key === 'Escape') { setEditTitle(false); setTitleVal(list.title); } }} onClick={e => e.stopPropagation()} />
            : <span className="list-title" onClick={e => { e.stopPropagation(); setEditTitle(true); }}>
                {list.title}
                {isCollapsed && <span style={{ opacity: 0.6, fontSize: '13px' }}> ({cards.length})</span>}
              </span>
          }
          <button className="collapse-btn" title={isCollapsed ? "Expand list" : "Collapse list"} onClick={e => { e.stopPropagation(); setIsCollapsed(!isCollapsed); }}>
            {isCollapsed ? '⤢' : '⤡'}
          </button>
          <button className={`icon-btn list-menu-btn${listMenu ? ' menu-open' : ''}`} title="List actions" onClick={e => { e.stopPropagation(); setListMenu(o => !o); setColorPicker(false); }}>···</button>
          {listMenu && (
            <div ref={menuRef} className="list-context-menu glass-heavy" onClick={e => e.stopPropagation()}>
              <div className="lcm-header"><span>{colorPicker ? 'List color' : 'List actions'}</span><button className="icon-btn" onClick={() => { if (colorPicker) setColorPicker(false); else setListMenu(false); }}>{colorPicker ? '←' : '✕'}</button></div>
              {!colorPicker ? (
                <div className="lcm-body">
                  <button className="lcm-item" onClick={() => { setAddingCard(true); setIsCollapsed(false); setListMenu(false); }}><span className="lcm-icon">➕</span> Add card...</button>
                  <button className="lcm-item" onClick={() => { setEditTitle(true); setListMenu(false); }}><span className="lcm-icon">✏️</span> Rename list</button>
                  <button className="lcm-item" onClick={() => setColorPicker(true)}><span className="lcm-icon">🎨</span> List color</button>
                  <div className="lcm-divider" />
                  <button className="lcm-item" onClick={() => { onListArchived(); setListMenu(false); }}><span className="lcm-icon">🗄️</span> Archive list</button>
                </div>
              ) : (
                <div className="lcm-body">
                  <div className="lcm-color-section">
                    <div className="lcm-color-section-title">Solid</div>
                    <div className="lcm-color-grid">
                      {LIST_COLORS.map(c => (
                        <button key={c} className={`lcm-color-swatch${list.color === c ? ' selected' : ''}`} style={{ background: c }} onClick={() => handleColorChange(c)} />
                      ))}
                    </div>
                  </div>
                  <div className="lcm-color-section">
                    <div className="lcm-color-section-title">Gradient</div>
                    <div className="lcm-color-grid">
                      {LIST_GRADIENTS.map(g => (
                        <button key={g} className={`lcm-color-swatch${list.color === g ? ' selected' : ''}`} style={{ background: g }} onClick={() => handleColorChange(g)} />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        {!isCollapsed && (
          <>
            <SortableContext items={sortableItems} strategy={verticalListSortingStrategy}>
              <div className={`cards-container${cards.length > 0 ? ' has-cards' : ''}`}>
                {cards.map(card => <SortableCard key={card.id} card={card} onClick={() => onCardClick(card.id)} onArchive={() => onCardArchive(card)} onToggleComplete={() => onCardToggleComplete(card)} />)}
              </div>
            </SortableContext>
            {addingCard ? (
              <div className="add-card-form">
                <textarea ref={cardInputRef} placeholder="Enter title..." value={newCardTitle} onChange={e => setNewCardTitle(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitCard(); } if (e.key === 'Escape') setAddingCard(false); }} />
                <div className="form-row">
                  <button className="btn-primary" onClick={submitCard}>Add card</button>
                  <button className="icon-btn" onClick={() => setAddingCard(false)}>✕</button>
                </div>
              </div>
            ) : <button className="add-card-trigger" onClick={() => setAddingCard(true)}>+ Add a card</button>}
          </>
        )}
      </div>
    </div>
  );
});

const SortableCard = React.memo(({ card, onClick, onArchive, onToggleComplete }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: `card-${card.id}`, data: { type: 'card', id: card.id } });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className={`card${card.is_complete ? ' completed' : ''}`} onClick={onClick}>
      <CardContent card={card} onArchive={onArchive} onToggleComplete={onToggleComplete} />
    </div>
  );
});

const CardContent = React.memo(({ card, onArchive, onToggleComplete }) => {
  const coverStyle = card.cover_type === 'image' ? { backgroundImage: `url(${card.cover_value})`, backgroundSize: 'cover' } 
    : card.cover_type === 'color' || card.cover_type === 'gradient' ? { background: card.cover_value } : null;
  const hasBadges = card.description || card.comment_count > 0 || card.due_date;
  return (
    <>
      {coverStyle && <div className="card-cover" style={coverStyle} />}
      {/* Labels row */}
      {card.labels?.length > 0 && (
        <div className="card-labels-row">
          {card.labels.map(l => <span key={l.id} className="card-label-pip" style={{ background: l.color }} title={l.name} />)}
        </div>
      )}
      {/* Title + checkbox */}
      <div className="card-title-row">
        <input type="checkbox" checked={card.is_complete || false} onChange={e => { e.stopPropagation(); onToggleComplete(); }} className="card-complete-checkbox" onClick={e => e.stopPropagation()} />
        <div className="card-title-text">{card.title}</div>
      </div>
      {/* Badges: description icon, due date, comments */}
      {hasBadges && (
        <div style={{ padding: '0 12px 10px', marginTop: '-4px', display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          {card.description && (
            <span title="Has description" style={{ opacity: 0.6, display: 'flex', alignItems: 'center' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h10v2H4z"/></svg>
            </span>
          )}
          {card.due_date && (() => {
            const due = new Date(card.due_date);
            const now = new Date();
            const isToday = due.toDateString() === now.toDateString();
            const isOverdue = !card.is_complete && due < now && !isToday;
            const color = card.is_complete ? '#22c55e' : isOverdue ? '#f87171' : isToday ? '#f59e0b' : 'inherit';
            const label = isOverdue ? ' · Overdue' : isToday ? ' · Today' : '';
            return (
              <span title={`Due: ${due.toLocaleDateString()}`} style={{ opacity: isOverdue || isToday ? 1 : 0.7, display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11px', fontWeight: 600, color, background: isOverdue ? 'rgba(248,113,113,0.12)' : isToday ? 'rgba(245,158,11,0.12)' : 'transparent', borderRadius: 4, padding: isOverdue || isToday ? '1px 5px' : 0 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z"/></svg>
                {due.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}{label}
              </span>
            );
          })()}
          {card.comment_count > 0 && (
            <span title={`${card.comment_count} comment${card.comment_count > 1 ? 's' : ''}`} style={{ opacity: 0.7, display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11px', fontWeight: 600 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>
              {card.comment_count}
            </span>
          )}
        </div>
      )}
    </>
  );
});

function CardItemOverlay({ card }) { return <div className="card dragging"><CardContent card={card} /></div>; }
function ListOverlay({ list, cards }) {
  return (
    <div className="list-wrapper" style={{ opacity: 0.9 }}>
      <div className="list">
        <div className="list-header"><span className="list-title">{list.title}</span></div>
        <div className="cards-container">{cards.map(c => <div key={c.id} className="card"><div className="card-title-text">{c.title}</div></div>)}</div>
      </div>
    </div>
  );
}

function AddListForm({ boardId, onAdded }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const submit = async () => { if (title.trim()) { const list = await createList(boardId, { title: title.trim() }); onAdded(list); setTitle(''); setOpen(false); } };
  if (!open) return <button className="add-list-trigger" onClick={() => setOpen(true)}>+ Add another list</button>;
  return (
    <div className="add-list-form">
      <input autoFocus placeholder="Enter list title..." value={title} onChange={e => setTitle(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') submit(); if (e.key === 'Escape') setOpen(false); }} />
      <div className="form-row"><button className="btn-primary" onClick={submit}>Add list</button><button className="icon-btn" onClick={() => setOpen(false)}>✕</button></div>
    </div>
  );
}

function BoardMenuPanel({ board, boardId, onClose, onUpdated, onRestored, isStarred, onToggleStar }) {
  const [view, setView] = useState('main');
  const [archiveSearch, setArchiveSearch] = useState('');
  const [archiveType, setArchiveType] = useState('cards');
  const [activities, setActivities] = useState([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const panelRef = useRef();
  
  useEffect(() => {
    if (view === 'activity') {
      setActivityLoading(true);
      getBoardActivity(boardId).then(setActivities).finally(() => setActivityLoading(false));
    }
  }, [view, boardId]);
  const archivedCards = (board.archived_cards || []).filter(c => c.title.toLowerCase().includes(archiveSearch.toLowerCase()));
  const archivedLists = (board.archived_lists || []).filter(l => l.title.toLowerCase().includes(archiveSearch.toLowerCase()));

  // Click-outside-to-close
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const changeBg = async (val, type) => { const updated = await updateBoard(board.id, { bg_type: type, bg_value: val }); onUpdated(updated); };
  const restoreCard = async (cid) => { await updateCard(cid, { archived: false }); onRestored(); };
  const deleteC = async (cid) => { if (window.confirm('Delete permanently?')) { await deleteCard(cid); onRestored(); } };
  const restoreL = async (lid) => { await updateList(lid, { archived: false }); onRestored(); };
  const deleteL = async (lid) => { if (window.confirm('Delete permanently?')) { await deleteList(lid); onRestored(); } };

  return (
    <div ref={panelRef} className="bg-menu-popover glass-heavy">
      <div className="bg-menu-header">
        {view !== 'main' && <button className="icon-btn" onClick={() => setView('main')}>←</button>}
        <span className="bg-menu-title">
          {view === 'main' ? 'Menu'
            : view === 'background' ? 'Background'
            : view === 'archives' ? 'Archived'
            : 'Activity'}
        </span>
        <button className="icon-btn" onClick={onClose}>✕</button>
      </div>
      <div className="bg-menu-body">
        {view === 'main' && (
          <div className="board-menu-items">
            <button className="sidebar-item" onClick={() => setView('background')}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 10 }}>
                <circle cx="13.5" cy="6.5" r=".5" />
                <circle cx="17.5" cy="10.5" r=".5" />
                <circle cx="8.5" cy="7.5" r=".5" />
                <circle cx="6.5" cy="12.5" r=".5" />
                <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.92 0 1.7-.72 1.7-1.61 0-.43-.17-.81-.44-1.1-.28-.27-.46-.64-.46-1.06 0-.88.72-1.6 1.6-1.6H17c2.76 0 5-2.24 5-5 0-4.42-4.03-8-10-8z" />
              </svg>
              Background
            </button>
            <button className="sidebar-item" onClick={() => setView('archives')}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 10 }}>
                <polyline points="21 8 21 21 3 21 3 8" />
                <rect x="1" y="3" width="22" height="5" />
                <line x1="10" y1="12" x2="14" y2="12" />
              </svg>
              Archived Items
            </button>
            <button className="sidebar-item" onClick={() => setView('powerups')}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 10 }}>
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
              Power-ups
            </button>
          </div>
        )}
        {view === 'powerups' && (
          <div className="powerups-promo animation-fade-in" style={{ padding: '32px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⚡</div>
            <h3 style={{ fontWeight: 850, marginBottom: 12, letterSpacing: '-0.5px' }}>Power-ups are on the way!</h3>
            <p style={{ color: 'var(--text-sub)', fontSize: 13, lineHeight: 1.5, opacity: 0.8 }}>
              Get ready to supercharge your workflow. Our team is building a library of integrations to help you automate and optimize your boards.
            </p>
            <div style={{ marginTop: 24, padding: '10px', background: 'rgba(var(--accent-rgb), 0.1)', borderRadius: 8, fontSize: 11, fontWeight: 700, color: 'var(--accent)' }}>
              FEATURE COMING SOON
            </div>
          </div>
        )}
        {view === 'background' && (
          <div className="background-picker">
            <p className="bg-menu-section-title">Colors</p>
            <div className="bg-grid">
              {BOARD_COLORS.map(c => <button key={c} className={`bg-swatch${board.bg_value===c?' sel':''}`} style={{ background: c }} onClick={() => changeBg(c,'color')} />)}
            </div>
            <p className="bg-menu-section-title">Gradients</p>
            <div className="bg-grid">
              {BOARD_GRADIENTS.map(g => <button key={g} className={`bg-swatch${board.bg_value===g?' sel':''}`} style={{ background: g }} onClick={() => changeBg(g,'gradient')} />)}
            </div>
            <p className="bg-menu-section-title">Photos</p>
            <div className="bg-grid">
              {BOARD_IMAGES.map(img => (
                <button key={img} className={`bg-swatch${board.bg_value===img?' sel':''}`} 
                  style={{ backgroundImage: `url(${img})`, backgroundSize: 'cover' }} 
                  onClick={() => changeBg(img,'image')} />
              ))}
            </div>
          </div>
        )}
        {view === 'archives' && (
          <div className="archives-view">
            <input placeholder="Search..." value={archiveSearch} onChange={e => setArchiveSearch(e.target.value)} className="archive-search" />
            <div className="archive-tabs">
              <button className={archiveType==='cards'?'active':''} onClick={() => setArchiveType('cards')}>Cards</button>
              <button className={archiveType==='lists'?'active':''} onClick={() => setArchiveType('lists')}>Lists</button>
            </div>
            <div className="archive-list-results">
              {archiveType === 'cards' ? archivedCards.map(c => (
                <div key={c.id} className="archive-item">
                  <span>{c.title}</span><div><button onClick={() => restoreCard(c.id)}>↺</button><button className="delete" onClick={() => deleteC(c.id)}>🗑</button></div>
                </div>
              )) : archivedLists.map(l => (
                <div key={l.id} className="archive-item">
                  <span>{l.title}</span><div><button onClick={() => restoreL(l.id)}>↺</button><button className="delete" onClick={() => deleteL(l.id)}>🗑</button></div>
                </div>
              ))}
            </div>
          </div>
        )}
        {view === 'activity' && (
          <div className="board-activity-list" style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 100px)' }}>
            {activityLoading ? <div className="loading" style={{ padding: 20, textAlign: 'center', opacity: 0.6 }}>Loading activity...</div> : (
              !Array.isArray(activities) || activities.length === 0 ? <div className="empty" style={{ padding: 20, textAlign: 'center', opacity: 0.6 }}>No activity yet.</div> : (
                activities.map((a, idx) => (
                  <div key={`activity-${a.id || idx}`} className="activity-item" style={{ display: 'flex', gap: 12, padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <img src={a.performer_avatar || '/default-avatar.png'} className="activity-avatar" style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0 }} />
                    <div className="activity-content" style={{ flex: 1, minWidth: 0 }}>
                      <div className="activity-header" style={{ fontSize: 13, color: 'var(--text-main)', wordWrap: 'break-word' }}>
                        <strong>{a.performer_name || 'Someone'}</strong>
                        <span style={{ opacity: 0.7 }}> {String(a.action_type || 'action').toLowerCase().replace(/_/g, ' ')} </span>
                        <strong>{a.card_title || 'a card'}</strong>
                      </div>
                      <div className="time" style={{ fontSize: 11, color: 'var(--text-sub)', marginTop: 4, opacity: 0.6 }}>
                        {a.created_at ? new Date(a.created_at).toLocaleString() : 'Recent activity'}
                      </div>
                    </div>
                  </div>
                ))
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}
