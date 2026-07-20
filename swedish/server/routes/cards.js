const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware');

const router = express.Router();

router.get('/', (req, res) => {
  const { deck, tag, q } = req.query;
  let sql = 'SELECT * FROM cards WHERE deleted_at IS NULL';
  const params = [];

  if (deck) {
    sql += ' AND deck_id = ?';
    params.push(deck);
  }
  if (tag) {
    sql += " AND (',' || tags || ',' LIKE ?)";
    params.push(`%,${tag},%`);
  }
  if (q) {
    sql += ' AND (front LIKE ? OR back LIKE ?)';
    params.push(`%${q}%`, `%${q}%`);
  }

  sql += ' ORDER BY id';
  res.json(db.prepare(sql).all(...params));
});

router.patch('/:id', requireAuth, (req, res) => {
  const card = db.prepare('SELECT * FROM cards WHERE id = ?').get(req.params.id);
  if (!card) return res.status(404).json({ error: 'card not found' });

  const allowed = ['front', 'back', 'tags', 'deck_id'];
  const updates = Object.entries(req.body).filter(([k]) => allowed.includes(k));
  if (!updates.length) return res.status(400).json({ error: 'no valid fields to update' });

  const set = updates.map(([k]) => `${k} = ?`).join(', ');
  const vals = updates.map(([, v]) => v);
  db.prepare(`UPDATE cards SET ${set} WHERE id = ?`).run(...vals, req.params.id);

  res.json(db.prepare('SELECT * FROM cards WHERE id = ?').get(req.params.id));
});

router.delete('/:id', requireAuth, (req, res) => {
  const card = db.prepare('SELECT * FROM cards WHERE id = ? AND deleted_at IS NULL').get(req.params.id);
  if (!card) return res.status(404).json({ error: 'card not found' });

  // Soft-delete: the card disappears from study/browse, but the row and its
  // review history are preserved (reviews are the crown jewels — never deleted).
  db.prepare('UPDATE cards SET deleted_at = ? WHERE id = ?').run(new Date().toISOString(), req.params.id);
  res.json({ deleted: true });
});

module.exports = router;
