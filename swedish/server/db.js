const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

// In production (monogon) this points at a mounted volume so review data
// survives redeploys; locally it defaults to alongside the server code.
const DB_PATH = process.env.SWEDISH_DB_PATH || path.join(__dirname, 'swedish.db');

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS decks (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    parent_id INTEGER REFERENCES decks(id),
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS cards (
    id INTEGER PRIMARY KEY,
    deck_id INTEGER NOT NULL REFERENCES decks(id),
    front TEXT NOT NULL,
    back TEXT NOT NULL,
    tags TEXT,
    due TEXT NOT NULL,
    stability REAL NOT NULL DEFAULT 0,
    difficulty REAL NOT NULL DEFAULT 0,
    reps INTEGER NOT NULL DEFAULT 0,
    lapses INTEGER NOT NULL DEFAULT 0,
    state INTEGER NOT NULL DEFAULT 0,
    last_review TEXT,
    created_at TEXT NOT NULL,
    content_hash TEXT UNIQUE
  );

  CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY,
    card_id INTEGER NOT NULL REFERENCES cards(id),
    reviewed_at TEXT NOT NULL,
    rating INTEGER NOT NULL,
    stability REAL NOT NULL,
    difficulty REAL NOT NULL,
    state INTEGER NOT NULL,
    elapsed_days REAL NOT NULL,
    scheduled_days REAL NOT NULL
  );

  CREATE TABLE IF NOT EXISTS config (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_cards_due ON cards(due);
  CREATE INDEX IF NOT EXISTS idx_cards_deck ON cards(deck_id);
  CREATE INDEX IF NOT EXISTS idx_reviews_card ON reviews(card_id);
`);

// Soft-delete column: cards are never hard-deleted (reviews reference them and
// the review log is append-only). Added via migration for pre-existing DBs.
const cardColumns = db.prepare(`PRAGMA table_info(cards)`).all();
if (!cardColumns.some((c) => c.name === 'deleted_at')) {
  db.exec(`ALTER TABLE cards ADD COLUMN deleted_at TEXT`);
}

const configDefaults = {
  new_cards_per_day: '15',
  fsrs_request_retention: '0.9',
  fsrs_maximum_interval: '36500',
};

const insertConfig = db.prepare(
  'INSERT OR IGNORE INTO config (key, value) VALUES (?, ?)'
);
for (const [key, value] of Object.entries(configDefaults)) {
  insertConfig.run(key, value);
}

module.exports = db;
