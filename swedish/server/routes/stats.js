const express = require('express');
const db = require('../db');

const router = express.Router();

function datesForLastN(days) {
  const dates = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

router.get('/', (req, res) => {
  const last30 = datesForLastN(30);

  const reviewsRaw = db.prepare(`
    SELECT substr(reviewed_at, 1, 10) as date, state, COUNT(*) as count
    FROM reviews
    WHERE reviewed_at >= ?
    GROUP BY date, state
  `).all(last30[0] + 'T00:00:00.000Z');

  const STATE_KEYS = { 0: 'new', 1: 'learning', 2: 'review', 3: 'relearning' };
  const reviewsMap = {};
  for (const r of reviewsRaw) {
    if (!reviewsMap[r.date]) reviewsMap[r.date] = { new: 0, learning: 0, review: 0, relearning: 0 };
    const key = STATE_KEYS[r.state] ?? 'new';
    reviewsMap[r.date][key] += r.count;
  }
  const reviews_per_day = last30.map((date) => ({ date, ...(reviewsMap[date] ?? { new: 0, learning: 0, review: 0, relearning: 0 }) }));

  const retentionRow = db.prepare(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN rating >= 3 THEN 1 ELSE 0 END) as passed
    FROM reviews
    WHERE reviewed_at >= ?
  `).get(last30[0] + 'T00:00:00.000Z');

  const retention_rate = retentionRow.total > 0
    ? Math.round((retentionRow.passed / retentionRow.total) * 10000) / 100
    : null;

  const { mature_count } = db.prepare(`
    SELECT COUNT(*) as mature_count FROM cards WHERE stability > 21 AND deleted_at IS NULL
  `).get();

  res.json({
    reviews_per_day,
    retention_rate,
    mature_count,
  });
});

module.exports = router;
