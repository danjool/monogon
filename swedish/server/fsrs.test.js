jest.mock('./db', () => {
  const mockGet = jest.fn((key) => {
    const defaults = {
      fsrs_request_retention: { value: '0.9' },
      fsrs_maximum_interval: { value: '36500' },
    };
    return defaults[key];
  });
  return {
    prepare: jest.fn(() => ({ get: mockGet })),
  };
});

const { scheduleReview, newCardDefaults, Rating, State } = require('./fsrs');

describe('newCardDefaults', () => {
  test('returns state=0 (New)', () => {
    const d = newCardDefaults();
    expect(d.state).toBe(State.New);
  });

  test('returns zero stability and difficulty', () => {
    const d = newCardDefaults();
    expect(d.stability).toBe(0);
    expect(d.difficulty).toBe(0);
  });

  test('due is a valid ISO string', () => {
    const d = newCardDefaults();
    expect(() => new Date(d.due)).not.toThrow();
    expect(new Date(d.due).getTime()).toBeGreaterThan(0);
  });
});

describe('scheduleReview', () => {
  const baseCard = {
    due: new Date().toISOString(),
    stability: 0,
    difficulty: 0,
    reps: 0,
    lapses: 0,
    state: State.New,
    last_review: null,
  };

  test('returns card and review_log', () => {
    const result = scheduleReview(baseCard, Rating.Good);
    expect(result).toHaveProperty('card');
    expect(result).toHaveProperty('review_log');
  });

  test('Good rating advances state beyond New', () => {
    const result = scheduleReview(baseCard, Rating.Good);
    expect(result.card.state).not.toBe(State.New);
  });

  test('Again rating on new card stays in Learning or Relearning', () => {
    const result = scheduleReview(baseCard, Rating.Again);
    expect([State.Learning, State.Relearning]).toContain(result.card.state);
  });

  test('Easy rating sets a positive stability', () => {
    const result = scheduleReview(baseCard, Rating.Easy);
    expect(result.card.stability).toBeGreaterThan(0);
  });

  test('Good rating on reviewed card increases reps', () => {
    const reviewedCard = {
      ...baseCard,
      reps: 2,
      stability: 5,
      difficulty: 5,
      state: State.Review,
      last_review: new Date(Date.now() - 86400000 * 3).toISOString(),
      due: new Date().toISOString(),
    };
    const result = scheduleReview(reviewedCard, Rating.Good);
    expect(result.card.reps).toBeGreaterThan(reviewedCard.reps);
  });

  test('Again rating on reviewed card increments lapses', () => {
    const reviewedCard = {
      ...baseCard,
      reps: 5,
      lapses: 1,
      stability: 10,
      difficulty: 4,
      state: State.Review,
      last_review: new Date(Date.now() - 86400000 * 5).toISOString(),
      due: new Date().toISOString(),
    };
    const result = scheduleReview(reviewedCard, Rating.Again);
    expect(result.card.lapses).toBeGreaterThan(reviewedCard.lapses);
  });

  test('review_log has elapsed_days and scheduled_days', () => {
    const result = scheduleReview(baseCard, Rating.Good);
    expect(result.review_log).toHaveProperty('elapsed_days');
    expect(result.review_log).toHaveProperty('scheduled_days');
  });

  test('due date is in the future for Good rating on mature card', () => {
    const matureCard = {
      ...baseCard,
      reps: 10,
      stability: 30,
      difficulty: 5,
      state: State.Review,
      last_review: new Date(Date.now() - 86400000 * 30).toISOString(),
      due: new Date().toISOString(),
    };
    const result = scheduleReview(matureCard, Rating.Good);
    expect(new Date(result.card.due).getTime()).toBeGreaterThan(Date.now());
  });
});
