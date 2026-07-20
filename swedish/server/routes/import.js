const express = require('express');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const db = require('../db');
const { newCardDefaults } = require('../fsrs');
const { requireAuth } = require('../middleware');

const router = express.Router();

const MEDIA_DIR = path.join(__dirname, '..', '..', 'media');

// Returns { ok: true } | { ok: false, reason } | { ok: true, missing: relPath }
// for a media field's value. Hard-rejects traversal/absolute/URL paths;
// well-formed-but-absent files are allowed (flagged as missing for backfill).
function checkMediaPath(value) {
  if (typeof value !== 'string' || !value.trim()) {
    return { ok: false, reason: 'media path must be a non-empty string' };
  }
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(value) || value.startsWith('//')) {
    return { ok: false, reason: `media path must be local, got "${value}"` };
  }
  if (path.isAbsolute(value)) {
    return { ok: false, reason: `media path must be relative, got "${value}"` };
  }
  const rel = value.startsWith('media/') ? value : `media/${value}`;
  const resolved = path.resolve(MEDIA_DIR, rel.slice('media/'.length));
  if (resolved !== MEDIA_DIR && !resolved.startsWith(MEDIA_DIR + path.sep)) {
    return { ok: false, reason: `media path escapes /media: "${value}"` };
  }
  return { ok: true, missing: fs.existsSync(resolved) ? null : rel };
}

const FIELD_TYPES_WITH_MEDIA = new Set(['image', 'audio']);

// Validate an already-expanded side (array of field objects). Collects any
// missing-but-valid media paths into `missing`. Returns reason string on failure.
function validateSide(fields, sideName, missing) {
  if (!Array.isArray(fields) || fields.length === 0) {
    return `${sideName} must be a non-empty array of fields`;
  }
  for (const f of fields) {
    if (!f || typeof f !== 'object' || Array.isArray(f)) {
      return `${sideName} has a field that is not an object`;
    }
    if (typeof f.type !== 'string' || !f.type) {
      return `${sideName} has a field missing a string "type"`;
    }
    if (typeof f.value !== 'string' || !f.value.trim()) {
      return `${sideName} has a "${f.type}" field with an empty/non-string value`;
    }
    if (FIELD_TYPES_WITH_MEDIA.has(f.type)) {
      const r = checkMediaPath(f.value);
      if (!r.ok) return r.reason;
      if (r.missing) missing.push(r.missing);
    }
  }
  return null;
}

// Expand one shorthand side into a field array. A bare string becomes a text
// field; an existing array is taken verbatim; anything else is an error.
// Returns { fields } or { error }.
function expandSide(value, sideName) {
  if (typeof value === 'string') {
    if (!value.trim()) return { error: `${sideName} is an empty string` };
    return { fields: [{ type: 'text', value: value.trim() }] };
  }
  if (Array.isArray(value)) {
    return { fields: value.slice() };
  }
  return { error: `${sideName} must be a string or a field array` };
}

// Returns { front, back } or { error }.
function expandFields(card) {
  const f = expandSide(card.front, 'front');
  if (f.error) return { error: f.error };
  const b = expandSide(card.back, 'back');
  if (b.error) return { error: b.error };

  const front = f.fields;
  const back = b.fields;

  if (card.note) back.push({ type: 'note', value: card.note });
  if (card.image) back.push({ type: 'image', value: card.image });
  if (card.audio) back.push({ type: 'audio', value: card.audio });
  if (card.front_image) front.push({ type: 'image', value: card.front_image });
  if (card.front_audio) front.push({ type: 'audio', value: card.front_audio });

  return { front, back };
}

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

function getOrCreateDeckPath(pathStr) {
  const parts = pathStr.split('/').map((p) => p.trim()).filter(Boolean);
  let parentId = null;
  let deckId = null;
  const now = new Date().toISOString();

  for (const part of parts) {
    const existing = db
      .prepare('SELECT id FROM decks WHERE name = ? AND parent_id IS ?')
      .get(part, parentId);
    if (existing) {
      deckId = existing.id;
    } else {
      const res = db
        .prepare('INSERT INTO decks (name, parent_id, created_at) VALUES (?, ?, ?)')
        .run(part, parentId, now);
      deckId = res.lastInsertRowid;
    }
    parentId = deckId;
  }
  return deckId;
}

// Validate + expand every card. Returns { errors } if any card is invalid
// (all-or-nothing; nothing is created), else { prepared, missingMedia }.
function validateAndExpand(cards) {
  const errors = [];
  const prepared = [];
  const missingMedia = [];

  cards.forEach((card, index) => {
    if (!card || typeof card !== 'object' || Array.isArray(card)) {
      errors.push({ index, reason: 'card must be an object' });
      return;
    }
    const expanded = expandFields(card);
    if (expanded.error) {
      errors.push({ index, reason: expanded.error });
      return;
    }
    const { front, back } = expanded;
    const missing = [];
    const frontErr = validateSide(front, 'front', missing);
    if (frontErr) { errors.push({ index, reason: frontErr }); return; }
    const backErr = validateSide(back, 'back', missing);
    if (backErr) { errors.push({ index, reason: backErr }); return; }

    missingMedia.push(...missing);
    prepared.push({ front, back, tags: card.tags ?? null });
  });

  if (errors.length) return { errors };
  return { prepared, missingMedia: [...new Set(missingMedia)] };
}

function importCards(deckPath, cards) {
  if (!Array.isArray(cards)) {
    return { errors: [{ index: -1, reason: 'cards must be an array' }] };
  }
  const validation = validateAndExpand(cards);
  if (validation.errors) return { errors: validation.errors };

  const { prepared, missingMedia } = validation;
  const defaults = newCardDefaults();
  const now = new Date().toISOString();

  const insertCard = db.prepare(`
    INSERT OR IGNORE INTO cards
      (deck_id, front, back, tags, due, stability, difficulty, reps, lapses, state, last_review, created_at, content_hash)
    VALUES
      (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const findByHash = db.prepare('SELECT id, deleted_at FROM cards WHERE content_hash = ?');
  const resurrect = db.prepare('UPDATE cards SET deleted_at = NULL WHERE id = ?');

  // Deck creation + all inserts in one transaction: a valid batch is all-or-nothing.
  let result;
  db.transaction(() => {
    const deckId = getOrCreateDeckPath(deckPath);
    let inserted = 0, skipped = 0, resurrected = 0;

    for (const { front, back, tags } of prepared) {
      const hash = stableHash(front, back);
      const r = insertCard.run(
        deckId,
        JSON.stringify(front),
        JSON.stringify(back),
        tags,
        defaults.due, defaults.stability, defaults.difficulty,
        defaults.reps, defaults.lapses, defaults.state, defaults.last_review,
        now, hash
      );
      if (r.changes > 0) {
        inserted++;
      } else {
        // Hash already exists. If that row was soft-deleted, re-importing the same
        // content resurrects it (history intact); otherwise it's a genuine no-op.
        const existing = findByHash.get(hash);
        if (existing?.deleted_at) { resurrect.run(existing.id); resurrected++; }
        else skipped++;
      }
    }
    result = { inserted, skipped, resurrected, deck_id: deckId };
  })();

  if (missingMedia.length) result.missing_media = missingMedia;
  return result;
}

function parseCsvLine(line) {
  const fields = [];
  let cur = '';
  let inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuote && line[i + 1] === '"') { cur += '"'; i++; }
      else inQuote = !inQuote;
    } else if (ch === ',' && !inQuote) {
      fields.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  fields.push(cur);
  return fields;
}

function parseCsv(text) {
  const lines = text.trim().split('\n');
  const headers = parseCsvLine(lines[0]).map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const vals = parseCsvLine(line);
    return Object.fromEntries(headers.map((h, i) => [h, vals[i]?.trim() ?? '']));
  });
}

router.post('/', requireAuth, (req, res) => {
  const contentType = req.headers['content-type'] ?? '';

  if (contentType.includes('text/csv')) {
    if (!req.body) return res.status(400).json({ error: 'missing body' });
    const cards = parseCsv(req.body);
    const deck = req.query.deck ?? 'Imported';
    const result = importCards(deck, cards);
    return res.status(result.errors ? 400 : 200).json(result);
  }

  const { deck, cards } = req.body;
  if (!deck || !Array.isArray(cards)) {
    return res.status(400).json({ error: 'deck and cards[] required' });
  }

  const result = importCards(deck, cards);
  res.status(result.errors ? 400 : 200).json(result);
});

module.exports = router;
