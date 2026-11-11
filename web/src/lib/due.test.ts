import { describe, expect, it } from 'vitest'
import { cleaningStatus, DAY, feedingStatus, refusalStreak, weightDrop } from './due'

const now = Date.parse('2026-06-15T12:00:00Z')
const ago = (d: number) => new Date(now - d * DAY).toISOString()

describe('feedingStatus', () => {
  it('never fed', () => expect(feedingStatus({ intervalDays: 7 }, now).state).toBe('never'))
  it('ok before the interval', () =>
    expect(feedingStatus({ intervalDays: 7, lastAteAt: ago(3) }, now)).toEqual({ state: 'ok', days: 4 }))
  it('due once the interval has passed', () =>
    expect(feedingStatus({ intervalDays: 7, lastAteAt: ago(9) }, now)).toEqual({ state: 'due', days: 2 }))
  it('a refusal does not reset the schedule', () =>
    expect(
      feedingStatus({ intervalDays: 7, lastAteAt: ago(10), lastFeed: { at: ago(1), outcome: 'refused' } }, now).state,
    ).toBe('due'))
  it('waits after a regurgitation', () =>
    expect(
      feedingStatus({ intervalDays: 7, lastAteAt: ago(10), lastFeed: { at: ago(4), outcome: 'regurgitated' } }, now),
    ).toEqual({ state: 'wait', days: 10 }))
  it('resumes the schedule after the regurgitation wait', () =>
    expect(
      feedingStatus({ intervalDays: 7, lastAteAt: ago(30), lastFeed: { at: ago(20), outcome: 'regurgitated' } }, now).state,
    ).toBe('due'))
})

describe('cleaningStatus', () => {
  it('never cleaned', () => expect(cleaningStatus(14, null, now).state).toBe('never'))
  it('due after the interval', () => expect(cleaningStatus(14, ago(20), now)).toEqual({ state: 'due', days: 6 }))
  it('ok before the interval', () => expect(cleaningStatus(14, ago(2), now)).toEqual({ state: 'ok', days: 12 }))
})

describe('refusalStreak', () => {
  it('counts leading refusals only', () => expect(refusalStreak(['refused', 'refused', 'ate', 'refused'])).toBe(2))
  it('zero when the latest ate', () => expect(refusalStreak(['ate', 'refused'])).toBe(0))
})

describe('weightDrop', () => {
  it('flags a 10% drop', () =>
    expect(weightDrop([{ at: ago(0), grams: 1800 }, { at: ago(10), grams: 2000 }])).toEqual({ pct: 10, from: 2000, to: 1800 }))
  it('ignores small drops and gains', () => {
    expect(weightDrop([{ at: ago(0), grams: 1900 }, { at: ago(10), grams: 2000 }])).toBeNull()
    expect(weightDrop([{ at: ago(0), grams: 2100 }, { at: ago(10), grams: 2000 }])).toBeNull()
  })
  it('ignores stale comparisons', () =>
    expect(weightDrop([{ at: ago(0), grams: 1000 }, { at: ago(100), grams: 2000 }])).toBeNull())
  it('needs two weights', () => expect(weightDrop([{ at: ago(0), grams: 1000 }])).toBeNull())
})
