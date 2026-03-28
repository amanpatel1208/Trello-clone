import { useState, useEffect } from 'react';
import { createCard, createList, getBoards, getBoard } from '../api';

export default function CalendarPanel({ isOpen, onClose, boardId: initialBoardId, lists: initialLists, onCardAdded }) {
  const [boardId, setBoardId] = useState(initialBoardId);
  const [lists, setLists] = useState(initialLists || []);
  const [boards, setBoards] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [addingToDate, setAddingToDate] = useState(null);
  const [newCardTitle, setNewCardTitle] = useState('');
  const [selectedListId, setSelectedListId] = useState('');
  const [createNewList, setCreateNewList] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');

  useEffect(() => {
    if (!initialBoardId && isOpen) {
      getBoards().then(setBoards).catch(console.error);
    }
  }, [initialBoardId, isOpen]);

  useEffect(() => {
    if (boardId && boardId !== initialBoardId) {
      getBoard(boardId).then(data => {
        setLists(data.lists);
        if (data.lists.length > 0) setSelectedListId(data.lists[0].id);
      });
    }
  }, [boardId]);

  useEffect(() => {
    if (initialLists?.length > 0 && !selectedListId) {
      setSelectedListId(initialLists[0].id);
    }
  }, [initialLists]);

  const daysInMonth = (month, year) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (month, year) => new Date(year, month, 1).getDay();

  const month = currentDate.getMonth();
  const year = currentDate.getFullYear();
  const days = daysInMonth(month, year);
  const firstDay = firstDayOfMonth(month, year);

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const handleCreateCard = async () => {
    if (!newCardTitle.trim()) return;
    
    let listId = selectedListId;
    if (createNewList && newListTitle.trim()) {
      const newList = await createList(boardId, { title: newListTitle.trim() });
      listId = newList.id;
      // Note: In a real app we'd refresh lists here, but for now we rely on the parent or next navigation
    }

    const card = await createCard(listId, { 
      title: newCardTitle.trim(),
      due_date: new Date(year, month, addingToDate).toISOString()
    });
    
    onCardAdded(card);
    setAddingToDate(null);
    setNewCardTitle('');
    setCreateNewList(false);
    setNewListTitle('');
  };

  if (!isOpen) return null;

  return (
    <div className={`calendar-panel glass-heavy ${isOpen ? 'open' : ''}`}>
      <div className="cp-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
          <h3 style={{ margin: 0 }}>Planner</h3>
        </div>
        <button className="icon-btn" onClick={onClose}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>

      <div className="cp-month-nav">
        <button className="icon-btn" onClick={() => setCurrentDate(new Date(year, month - 1))}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
        </button>
        <span className="cp-month-label">{monthNames[month]} {year}</span>
        <button className="icon-btn" onClick={() => setCurrentDate(new Date(year, month + 1))}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
        </button>
      </div>

      <div className="cp-calendar-grid">
        {['S','M','T','W','T','F','S'].map(d => <div key={d} className="cp-day-head">{d}</div>)}
        {Array(firstDay).fill(null).map((_, i) => <div key={`empty-${i}`} className="cp-day empty" />)}
        {Array(days).fill(null).map((_, i) => {
          const day = i + 1;
          const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();
          return (
            <div key={day} className={`cp-day${isToday ? ' today' : ''}`} onClick={() => setAddingToDate(day)}>
              {day}
            </div>
          );
        })}
      </div>

      {addingToDate && (
        <div className="cp-add-popover glass-heavy">
          <h4>Plan card for {monthNames[month]} {addingToDate}</h4>
          <input autoFocus placeholder="Card title..." value={newCardTitle} onChange={e => setNewCardTitle(e.target.value)} />
          
          {!initialBoardId && (
            <div className="cp-list-choice">
              <label>Target Board:</label>
              <select value={boardId} onChange={e => setBoardId(e.target.value)}>
                <option value="">-- Select board --</option>
                {boards.map(b => <option key={b.id} value={b.id}>{b.title}</option>)}
              </select>
            </div>
          )}
          
          <div className="cp-list-choice">
            <label>
              <input type="radio" checked={!createNewList} onChange={() => setCreateNewList(false)} />
              Add to existing list
            </label>
            {!createNewList && (
              <select value={selectedListId} onChange={e => setSelectedListId(e.target.value)}>
                {lists.map(l => <option key={l.id} value={l.id}>{l.title}</option>)}
              </select>
            )}
            
            <label>
              <input type="radio" checked={createNewList} onChange={() => setCreateNewList(true)} />
              Create new list
            </label>
            {createNewList && (
              <input placeholder="New list title..." value={newListTitle} onChange={e => setNewListTitle(e.target.value)} />
            )}
          </div>

          <div className="form-row">
            <button className="btn-primary" onClick={handleCreateCard}>Add to Board</button>
            <button className="icon-btn" onClick={() => setAddingToDate(null)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
