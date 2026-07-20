const { createEmptyCard, fsrs, generatorParameters, Rating, State } = require('ts-fsrs');
const db = require('./db');

function getFsrsParams() {
  const retention = parseFloat(
    db.prepare('SELECT value FROM config WHERE key = ?').get('fsrs_request_retention')?.value ?? '0.9'
  );
  const maxInterval = parseInt(
    db.prepare('SELECT value FROM config WHERE key = ?').get('fsrs_maximum_interval')?.value ?? '36500'
  );
  return generatorParameters({ request_retention: retention, maximum_interval: maxInterval });
}

function scheduleReview(card, rating) {
  const params = getFsrsParams();
  const f = fsrs(params);

  const fsrsCard = {
    due: card.due ? new Date(card.due) : new Date(),
    stability: card.stability ?? 0,
    difficulty: card.difficulty ?? 0,
    elapsed_days: 0,
    scheduled_days: 0,
    reps: card.reps ?? 0,
    lapses: card.lapses ?? 0,
    state: card.state ?? State.New,
    last_review: card.last_review ? new Date(card.last_review) : undefined,
  };

  const now = new Date();
  const schedulingCards = f.repeat(fsrsCard, now);
  const result = schedulingCards[rating];

  return {
    card: result.card,
    review_log: result.log,
  };
}

function newCardDefaults() {
  return {
    stability: 0,
    difficulty: 0,
    reps: 0,
    lapses: 0,
    state: State.New,
    due: new Date().toISOString(),
    last_review: null,
  };
}

module.exports = { scheduleReview, newCardDefaults, Rating, State };
