const db = require('./db');

const now = new Date().toISOString();
const crypto = require('crypto');

function stableHash(front, back) {
  const normalize = (fields) =>
    fields.map((f) =>
      Object.fromEntries(
        Object.entries(f)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([k, v]) => [k, typeof v === 'string' ? v.trim() : v])
      )
    );
  const payload = JSON.stringify({ back: normalize(back), front: normalize(front) });
  return crypto.createHash('sha256').update(payload).digest('hex');
}

function getOrCreateDeck(name, parentId = null) {
  const existing = db.prepare('SELECT id FROM decks WHERE name = ? AND parent_id IS ?').get(name, parentId);
  if (existing) return existing.id;
  return db.prepare('INSERT INTO decks (name, parent_id, created_at) VALUES (?, ?, ?)').run(name, parentId, now).lastInsertRowid;
}

const swedishId = getOrCreateDeck('Swedish');
const verbsId = getOrCreateDeck('Verbs', swedishId);
const nounsId = getOrCreateDeck('Nouns', swedishId);

const cards = [
  {
    deck_id: verbsId,
    front: [{ type: 'text', value: 'to run' }],
    back: [{ type: 'text', value: 'att springa', speak: true }],
    tags: 'verb,motion',
  },
  {
    deck_id: verbsId,
    front: [{ type: 'text', value: 'to eat' }],
    back: [{ type: 'text', value: 'att äta', speak: true }, { type: 'note', value: 'irregular past: åt' }],
    tags: 'verb,irregular',
  },
  {
    deck_id: verbsId,
    front: [{ type: 'text', value: 'to drink' }],
    back: [{ type: 'text', value: 'att dricka', speak: true }, { type: 'note', value: 'irregular past: drack' }],
    tags: 'verb,irregular',
  },
  {
    deck_id: verbsId,
    front: [{ type: 'text', value: 'to speak' }],
    back: [{ type: 'text', value: 'att tala', speak: true } ],
    tags: 'verb,communication',
  },
  {
    deck_id: verbsId,
    front: [{ type: 'text', value: 'to get dressed' }],
    back: [{ type: 'text', value: 'att klä på sig', speak: true }, { type: 'note', value: 'reflexive verb' }],
    tags: 'verb,reflexive',
  },
  {
    deck_id: nounsId,
    front: [{ type: 'text', value: 'house (n.)' }],
    back: [{ type: 'text', value: 'huset', speak: true }, { type: 'note', value: 'ett-word; plural: husen' }],
    tags: 'noun,ett',
  },
  {
    deck_id: nounsId,
    front: [{ type: 'text', value: 'cat (n.)' }],
    back: [{ type: 'text', value: 'katten', speak: true }, { type: 'image', value: 'img/cat.jpg' }],
    tags: 'noun,en,animal',
  },
  {
    deck_id: nounsId,
    front: [{ type: 'text', value: 'car (n.)' }],
    back: [{ type: 'text', value: 'bilen', speak: true }, { type: 'note', value: 'en-word; plural: bilarna' }],
    tags: 'noun,en',
  },
  {
    deck_id: nounsId,
    front: [{ type: 'text', value: 'water (n.)' }],
    back: [{ type: 'text', value: 'vattnet', speak: true } ],
    tags: 'noun,ett',
  },
  {
    deck_id: nounsId,
    front: [{ type: 'text', value: 'book (n.)' }],
    back: [{ type: 'text', value: 'boken', speak: true }, { type: 'note', value: 'en-word; plural: böcker' }],
    tags: 'noun,en',
  },
];

const insert = db.prepare(`
  INSERT OR IGNORE INTO cards
    (deck_id, front, back, tags, due, stability, difficulty, reps, lapses, state, last_review, created_at, content_hash)
  VALUES
    (?, ?, ?, ?, ?, 0, 0, 0, 0, 0, null, ?, ?)
`);

let inserted = 0;
for (const card of cards) {
  const hash = stableHash(card.front, card.back);
  const result = insert.run(
    card.deck_id,
    JSON.stringify(card.front),
    JSON.stringify(card.back),
    card.tags,
    now,
    now,
    hash
  );
  if (result.changes > 0) inserted++;
}

console.log(`Seeded ${inserted} cards (${cards.length - inserted} skipped as duplicates)`);
