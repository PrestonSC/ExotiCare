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

import { cleanStatus, isFullKind } from './due'

describe('cleanStatus', () => {
  const spotDaily = 1, fullMonthly = 30
  it('never cleaned', () => {
    const s = cleanStatus([], spotDaily, fullMonthly, now)
    expect(s.spot.state).toBe('never'); expect(s.full.state).toBe('never')
  })
  it('spot clean yesterday is due again today; full is untouched', () => {
    const s = cleanStatus([{ cleaned_at: ago(1), kind: 'spot' }], spotDaily, fullMonthly, now)
    expect(s.spot.state).toBe('due')
    expect(s.full.state).toBe('never')
  })
  it('spot clean this morning is done until tomorrow', () => {
    const s = cleanStatus([{ cleaned_at: ago(0.2), kind: 'spot' }], spotDaily, fullMonthly, now)
    expect(s.spot).toEqual({ state: 'ok', days: 1 })
  })
  it('spot clean yesterday is due again today, even if under 24h ago', () => {
    const lateYesterday = new Date(new Date(now).setHours(0, 30, 0, 0) - 60 * 60 * 1000).toISOString()
    expect(cleanStatus([{ cleaned_at: lateYesterday, kind: 'spot' }], spotDaily, fullMonthly, now).spot).toEqual({ state: 'due', days: 0 })
  })
  it('a full clean also satisfies the spot schedule', () => {
    const s = cleanStatus([{ cleaned_at: ago(0.2), kind: 'full' }, { cleaned_at: ago(3), kind: 'spot' }], spotDaily, fullMonthly, now)
    expect(s.spot.state).toBe('ok')
    expect(s.full).toEqual({ state: 'ok', days: 30 })
  })
  it('daily spot cleans never satisfy the monthly full clean', () => {
    const rows = Array.from({ length: 40 }, (_, i) => ({ cleaned_at: ago(i), kind: 'spot' }))
    expect(cleanStatus(rows, spotDaily, fullMonthly, now).full.state).toBe('never')
  })
  it('full clean 32 days ago is overdue', () => {
    const s = cleanStatus([{ cleaned_at: ago(32), kind: 'full' }], spotDaily, fullMonthly, now)
    expect(s.full).toEqual({ state: 'due', days: 2 })
  })
  it('treats legacy substrate/disinfect as full-level', () => {
    expect(isFullKind('substrate')).toBe(true); expect(isFullKind('disinfect')).toBe(true); expect(isFullKind('spot')).toBe(false)
  })
})
