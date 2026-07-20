const express = require('express');
const db = require('../db');
const { scheduleReview, Rating } = require('../fsrs');
const { requireAuth } = require('../middleware');

const router = express.Router();

function getAllSubdeckIds(deckId) {
  const ids = [deckId];
  const children = db.prepare('SELECT id FROM decks WHERE parent_id = ?').all(deckId);
  for (const child of children) {
    ids.push(...getAllSubdeckIds(child.id));
  }
  return ids;
}

function getConfig(key, fallback) {
  return db.prepare('SELECT value FROM config WHERE key = ?').get(key)?.value ?? fallback;
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

// Today's effective new-card budget: the standing daily limit plus any extra
// the user added via the "do more today" override (auto-expires next day).
function effectiveNewLimit() {
  const base = parseInt(getConfig('new_cards_per_day', '15'));
  const extraDate = getConfig('new_extra_date', '');
  const extra = extraDate === todayStr() ? parseInt(getConfig('new_extra_today', '0')) : 0;
  return base + (Number.isFinite(extra) ? extra : 0);
}

// How many new cards were *introduced* today across ALL decks (the limit is
// global, not deck-scoped). "Introduced today" = the card's first-ever review
// happened today. We can't key off current state: a new card reviewed today has
// already advanced past state 0, so counting state=0 would undercount.
function newSeenTodayGlobal() {
  const start = todayStr() + 'T00:00:00.000Z';
  return (
    db
      .prepare(
        `SELECT COUNT(*) as cnt FROM (
           SELECT card_id, MIN(reviewed_at) as first_review
           FROM reviews
           GROUP BY card_id
         ) WHERE first_review >= ?`
      )
      .get(start)?.cnt ?? 0
  );
}

router.get('/:deckId/next', (req, res) => {
  const deckId = parseInt(req.params.deckId);
  const deckIds = getAllSubdeckIds(deckId);
  const placeholders = deckIds.map(() => '?').join(',');
  const now = new Date().toISOString();

  const newLimit = effectiveNewLimit();
  const newSeenToday = newSeenTodayGlobal();
  const progress = { new_done_today: newSeenToday, new_limit_today: newLimit };

  // Due cards first.
  const dueCard = db
    .prepare(
      `SELECT * FROM cards
       WHERE deck_id IN (${placeholders})
         AND due <= ?
         AND state != 0
         AND deleted_at IS NULL
       ORDER BY due ASC
       LIMIT 1`
    )
    .get(...deckIds, now);

  if (dueCard) {
    return res.json({ card: dueCard, queue: 'review', ...progress });
  }

  // Next new card in this deck (used both to serve and to detect existence).
  const newCard = db
    .prepare(
      `SELECT * FROM cards
       WHERE deck_id IN (${placeholders})
         AND state = 0
         AND deleted_at IS NULL
       ORDER BY RANDOM()
       LIMIT 1`
    )
    .get(...deckIds);

  if (newCard && newSeenToday < newLimit) {
    return res.json({ card: newCard, queue: 'new', ...progress });
  }

  // No card to serve. Distinguish "budget spent but new cards remain" (offer
  // the override) from "genuinely nothing left".
  const reason = newCard ? 'new_limit_reached' : null;
  res.json({ card: null, queue: null, reason, ...progress });
});

router.post('/card/:cardId/review', requireAuth, (req, res) => {
  const cardId = parseInt(req.params.cardId);
  const { rating } = req.body;

  if (![1, 2, 3, 4].includes(rating)) {
    return res.status(400).json({ error: 'rating must be 1-4 (Again/Hard/Good/Easy)' });
  }

  const card = db.prepare('SELECT * FROM cards WHERE id = ?').get(cardId);
  if (!card) return res.status(404).json({ error: 'card not found' });

  const ratingKey = { 1: Rating.Again, 2: Rating.Hard, 3: Rating.Good, 4: Rating.Easy }[rating];
  const { card: newFsrsCard, review_log } = scheduleReview(card, ratingKey);

  const now = new Date().toISOString();

  const updateCard = db.prepare(`
    UPDATE cards SET
      due = ?,
      stability = ?,
      difficulty = ?,
      reps = ?,
      lapses = ?,
      state = ?,
      last_review = ?
    WHERE id = ?
  `);

  const insertReview = db.prepare(`
    INSERT INTO reviews (card_id, reviewed_at, rating, stability, difficulty, state, elapsed_days, scheduled_days)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  db.transaction(() => {
    updateCard.run(
      newFsrsCard.due.toISOString(),
      newFsrsCard.stability,
      newFsrsCard.difficulty,
      newFsrsCard.reps,
      newFsrsCard.lapses,
      newFsrsCard.state,
      now,
      cardId
    );
    insertReview.run(
      cardId,
      now,
      rating,
      newFsrsCard.stability,
      newFsrsCard.difficulty,
      newFsrsCard.state,
      review_log.elapsed_days,
      review_log.scheduled_days
    );
  })();

  res.json(db.prepare('SELECT * FROM cards WHERE id = ?').get(cardId));
});

// Raise today's global new-card budget by n (default 10). Scoped to today's
// date, so it auto-resets tomorrow. Lets the user deliberately study ahead.
router.post('/new-limit/bump', requireAuth, (req, res) => {
  const n = Number.isInteger(req.body?.n) ? req.body.n : 10;
  if (n <= 0 || n > 1000) {
    return res.status(400).json({ error: 'n must be between 1 and 1000' });
  }

  const today = todayStr();
  const setConfig = db.prepare(
    'INSERT INTO config (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value'
  );

  db.transaction(() => {
    const curDate = getConfig('new_extra_date', '');
    const curExtra = curDate === today ? parseInt(getConfig('new_extra_today', '0')) : 0;
    setConfig.run('new_extra_date', today);
    setConfig.run('new_extra_today', String((Number.isFinite(curExtra) ? curExtra : 0) + n));
  })();

  res.json({
    new_done_today: newSeenTodayGlobal(),
    new_limit_today: effectiveNewLimit(),
  });
});

module.exports = router;
