const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware');

const router = express.Router();

router.get('/', (req, res) => {
  const now = new Date().toISOString();
  const decks = db.prepare('SELECT * FROM decks ORDER BY name').all();
  const due = db.prepare(
    `SELECT deck_id, COUNT(*) as cnt FROM cards WHERE due <= ? AND state != 0 AND deleted_at IS NULL GROUP BY deck_id`
  ).all(now);
  const newCards = db.prepare(
    `SELECT deck_id, COUNT(*) as cnt FROM cards WHERE state = 0 AND deleted_at IS NULL GROUP BY deck_id`
  ).all();
  const total = db.prepare(
    `SELECT deck_id, COUNT(*) as cnt FROM cards WHERE deleted_at IS NULL GROUP BY deck_id`
  ).all();
  const dueMap = Object.fromEntries(due.map(r => [r.deck_id, r.cnt]));
  const newMap = Object.fromEntries(newCards.map(r => [r.deck_id, r.cnt]));
  const totalMap = Object.fromEntries(total.map(r => [r.deck_id, r.cnt]));
  res.json(decks.map(d => ({
    ...d,
    due_count: dueMap[d.id] ?? 0,
    new_count: newMap[d.id] ?? 0,
    total_count: totalMap[d.id] ?? 0,
  })));
});

router.post('/', requireAuth, (req, res) => {
  const { name, parent_id } = req.body;
  if (!name) return res.status(400).json({ error: 'name required' });

  const now = new Date().toISOString();
  const result = db
    .prepare('INSERT INTO decks (name, parent_id, created_at) VALUES (?, ?, ?)')
    .run(name, parent_id ?? null, now);

  res.status(201).json(db.prepare('SELECT * FROM decks WHERE id = ?').get(result.lastInsertRowid));
});

module.exports = router;
