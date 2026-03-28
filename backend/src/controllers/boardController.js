const db = require('../db');
const validate = require('../middleware/validate');

exports.getBoards = async (req, res) => {
  const { member_id } = req.query;
  if (member_id) {
    const r = await db.query(`
      SELECT b.*, 
        EXISTS(SELECT 1 FROM starred_boards WHERE board_id = b.id AND member_id = $1) AS is_starred
      FROM boards b 
      WHERE b.member_id = $1 OR b.member_id IS NULL 
      ORDER BY b.created_at DESC`, 
      [member_id]
    );
    return res.json(r.rows);
  }
  const r = await db.query('SELECT *, FALSE as is_starred FROM boards ORDER BY created_at DESC');
  res.json(r.rows);
};

exports.createBoard = async (req, res) => {
  const err = validate({ title: { required: true, min: 1, max: 100 } }, req.body);
  if (err) return res.status(400).json(err);
  const { title, bg_type = 'color', bg_value = '#0052cc', member_id } = req.body;
  const r = await db.query(
    'INSERT INTO boards (member_id, title, bg_type, bg_value) VALUES ($1,$2,$3,$4) RETURNING *',
    [member_id || null, title.trim(), bg_type, bg_value]
  );
  res.status(201).json(r.rows[0]);
};

exports.getBoard = async (req, res) => {
  const { id } = req.params;
  const { member_id } = req.query;
  const board = await db.query(`
    SELECT b.*, 
      EXISTS(SELECT 1 FROM starred_boards WHERE board_id = b.id AND member_id = $2) AS is_starred
    FROM boards b WHERE b.id = $1`, 
    [id, member_id || null]
  );
  if (!board.rows.length) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Board not found' } });

  const listsResult = await db.query('SELECT * FROM lists WHERE board_id=$1 ORDER BY position', [id]);
  const activeLists = listsResult.rows.filter(l => !l.archived);
  const archivedLists = listsResult.rows.filter(l => l.archived);
  
  const allListIds = listsResult.rows.map(l => l.id);

  let activeCards = [];
  let archivedCards = [];
  
  if (allListIds.length) {
    const r = await db.query(
      `SELECT c.*,
        COALESCE(json_agg(DISTINCT jsonb_build_object('id',l.id,'name',l.name,'color',l.color)) FILTER (WHERE l.id IS NOT NULL), '[]') AS labels,
        COALESCE(json_agg(DISTINCT jsonb_build_object('id',m.id,'name',m.name,'avatar_url',m.avatar_url)) FILTER (WHERE m.id IS NOT NULL), '[]') AS members,
        (SELECT COUNT(*) FROM checklist_items ci WHERE ci.card_id = c.id) AS checklist_total,
        (SELECT COUNT(*) FROM checklist_items ci WHERE ci.card_id = c.id AND ci.is_complete = TRUE) AS checklist_done,
        (SELECT COUNT(*) FROM attachments a WHERE a.card_id = c.id) AS attachment_count,
        (SELECT COUNT(*) FROM comments co WHERE co.card_id = c.id) AS comment_count
       FROM cards c
       LEFT JOIN card_labels cl ON cl.card_id = c.id
       LEFT JOIN labels l ON l.id = cl.label_id
       LEFT JOIN card_members cm ON cm.card_id = c.id
       LEFT JOIN members m ON m.id = cm.member_id
       WHERE c.list_id = ANY($1::int[])
       GROUP BY c.id ORDER BY c.position`,
      [allListIds]
    );
    activeCards = r.rows.filter(c => !c.archived);
    archivedCards = r.rows.filter(c => c.archived);
  }

  res.json({ 
    ...board.rows[0], 
    lists: activeLists, 
    archived_lists: archivedLists,
    cards: activeCards,
    archived_cards: archivedCards
  });
};

exports.updateBoard = async (req, res) => {
  const { id } = req.params;
  const err = validate({ title: { min: 1, max: 100 } }, req.body);
  if (err) return res.status(400).json(err);
  const { title, bg_type, bg_value } = req.body;
  const r = await db.query(
    `UPDATE boards SET
      title=COALESCE($1,title), bg_type=COALESCE($2,bg_type), bg_value=COALESCE($3,bg_value)
     WHERE id=$4 RETURNING *`,
    [title?.trim(), bg_type, bg_value, id]
  );
  if (!r.rows.length) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Board not found' } });
  res.json(r.rows[0]);
};

exports.deleteBoard = async (req, res) => {
  await db.query('DELETE FROM boards WHERE id=$1', [req.params.id]);
  res.status(204).end();
};

exports.toggleStar = async (req, res) => {
  const { id } = req.params;
  const { member_id } = req.body;
  if (!member_id) return res.status(400).json({ error: { code: 'REQUIRED', message: 'member_id is required' } });

  const check = await db.query('SELECT 1 FROM starred_boards WHERE board_id = $1 AND member_id = $2', [id, member_id]);
  
  if (check.rows.length) {
    await db.query('DELETE FROM starred_boards WHERE board_id = $1 AND member_id = $2', [id, member_id]);
    res.json({ is_starred: false });
  } else {
    await db.query('INSERT INTO starred_boards (board_id, member_id) VALUES ($1, $2)', [id, member_id]);
    res.json({ is_starred: true });
  }
};

exports.getBoardActivity = async (req, res) => {
  const { id } = req.params;
  const mid = req.query.member_id;
  
  let query = `
    SELECT al.*, m.name AS performer_name, m.avatar_url AS performer_avatar, c.title AS card_title
    FROM activity_logs al
    JOIN cards c ON c.id = al.card_id
    JOIN lists l ON l.id = c.list_id
    LEFT JOIN members m ON m.id = al.performed_by
    WHERE l.board_id = $1`;
    
  const params = [id];
  
  if (mid && mid !== 'undefined') {
    query += ' AND al.performed_by = $2';
    params.push(parseInt(mid, 10));
  }
  
  query += ' ORDER BY al.created_at DESC LIMIT 50';
  
  const r = await db.query(query, params);
  res.json(r.rows);
};
