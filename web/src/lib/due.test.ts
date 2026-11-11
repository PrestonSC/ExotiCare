import { describe, expect, it } from 'vitest'
import { cleaningStatus, DAY, feedingStatus, refusalStreak, weightDrop } from './due'

const now = Date.parse('2026-06-15T12:00:00Z')
const ago = (d: number) => new Date(now - d * DAY).toISOString()

describe('feedingStatus', () => {
  it('never fed', () => expect(feedingStatus({ intervalDays: 7 }, now).state).toBe('never'))
  it('ok before the interval', () =>
    expect(feedingStatus({ intervalDays: 7, lastAteAt: ago(3) }, now)).toMatchObject({ state: 'ok', days: 4 }))
  it('due once the interval has passed', () =>
    expect(feedingStatus({ intervalDays: 7, lastAteAt: ago(9) }, now)).toMatchObject({ state: 'due', days: 2 }))
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
  it('due after the interval', () => expect(cleaningStatus(14, ago(20), now)).toMatchObject({ state: 'due', days: 6 }))
  it('ok before the interval', () => expect(cleaningStatus(14, ago(2), now)).toMatchObject({ state: 'ok', days: 12 }))
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

import { cleanStatus, completionSlot, isFullKind, planStatus, plannedDays, projectDueDays, toDayString, parseDay } from './due'

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
    expect(s.spot).toMatchObject({ state: 'ok', days: 1 })
  })
  it('spot clean yesterday is due again today, even if under 24h ago', () => {
    const lateYesterday = new Date(new Date(now).setHours(0, 30, 0, 0) - 60 * 60 * 1000).toISOString()
    expect(cleanStatus([{ cleaned_at: lateYesterday, kind: 'spot' }], spotDaily, fullMonthly, now).spot).toMatchObject({ state: 'due', days: 0 })
  })
  it('a full clean also satisfies the spot schedule', () => {
    const s = cleanStatus([{ cleaned_at: ago(0.2), kind: 'full' }, { cleaned_at: ago(3), kind: 'spot' }], spotDaily, fullMonthly, now)
    expect(s.spot.state).toBe('ok')
    expect(s.full).toMatchObject({ state: 'ok', days: 30 })
  })
  it('daily spot cleans never satisfy the monthly full clean', () => {
    const rows = Array.from({ length: 40 }, (_, i) => ({ cleaned_at: ago(i), kind: 'spot' }))
    expect(cleanStatus(rows, spotDaily, fullMonthly, now).full.state).toBe('never')
  })
  it('full clean 32 days ago is overdue', () => {
    const s = cleanStatus([{ cleaned_at: ago(32), kind: 'full' }], spotDaily, fullMonthly, now)
    expect(s.full).toMatchObject({ state: 'due', days: 2 })
  })
  it('treats legacy substrate/disinfect as full-level', () => {
    expect(isFullKind('substrate')).toBe(true); expect(isFullKind('disinfect')).toBe(true); expect(isFullKind('spot')).toBe(false)
  })
})

describe('fixed planned schedule (late completions do not move the grid)', () => {
  // `now` is "today". day(n) = the date n days from today as 'YYYY-MM-DD' (negative = past).
  const day = (n: number) => toDayString(now + n * DAY)
  const at = (n: number) => new Date(now + n * DAY).toISOString()
  const weekly = (anchor: number, lastAt?: number) =>
    planStatus({ intervalDays: 7, anchor: day(anchor), lastAt: lastAt === undefined ? null : at(lastAt) }, now)

  it('a feeding done a day late is followed by one 6 days later, not 7', () => {
    // Planned for yesterday (anchor -1); done today.
    expect(weekly(-1, 0)).toMatchObject({ state: 'ok', days: 6 })
  })
  it('a missed day rolls over: still due, and counts up', () => {
    // Planned 2 days ago, last done on the previous planned day (-9).
    expect(weekly(-9, -9)).toMatchObject({ state: 'due', days: 2 })
  })
  it('once done late, the following planned day is unchanged', () => {
    const planned = parseDay(day(-2)) + 7 * DAY // the originally planned next day, 5 days from today
    expect(weekly(-9, 0).nextDue).toBe(planned)
  })
  it('a completion a few days early counts for the upcoming planned day', () => {
    // Planned in 2 days; done today -> next planned is a week after that (9 days away).
    expect(weekly(2, 0)).toMatchObject({ state: 'ok', days: 9 })
  })
  it('a second completion inside the same window does not skip another planned day', () => {
    const twice = planStatus({ intervalDays: 7, anchor: day(-1), lastAt: at(0.01) }, now)
    expect(twice).toMatchObject({ state: 'ok', days: 6 })
  })
  it('missing several planned days does not leave you owing all of them', () => {
    // Grid: -20, -13, -6, +1, +8. Done on the anchor 20 days ago, missed -13 and -6, done again today:
    // today counts for the nearest planned day (+1), so the next one is +8. The two missed days are not owed.
    expect(weekly(-20, 0)).toMatchObject({ state: 'ok', days: 8 })
  })
  it('an explicit planned date in the future wins over older history', () => {
    expect(weekly(5, -30)).toMatchObject({ state: 'ok', days: 5 })
  })
  it('never done: due once the planned day arrives, counting up', () => {
    expect(weekly(-3)).toMatchObject({ state: 'never', days: 3 })
    expect(weekly(4)).toMatchObject({ state: 'ok', days: 4 })
  })
  it('daily schedules behave per calendar day regardless of the anchor', () => {
    const daily = (last: number) => planStatus({ intervalDays: 1, anchor: day(-30), lastAt: at(last) }, now)
    expect(daily(0)).toMatchObject({ state: 'ok', days: 1 })
    expect(daily(-1)).toMatchObject({ state: 'due', days: 0 })
    expect(daily(-3)).toMatchObject({ state: 'due', days: 2 })
  })
  it('monthly full clean keeps its planned days after a late one', () => {
    const full = planStatus({ intervalDays: 30, anchor: day(-31), lastAt: at(0) }, now)
    expect(full).toMatchObject({ state: 'ok', days: 29 })
  })
})

describe('projectDueDays', () => {
  const day = (n: number) => toDayString(now + n * DAY)
  const fromToday = (list: number[]) => list.map((ms) => Math.round((ms - parseDay(day(0))) / DAY))
  it('lists future planned days on the grid', () => {
    const out = projectDueDays({ intervalDays: 30, anchor: day(10) }, now, parseDay(day(80)))
    expect(fromToday(out)).toEqual([10, 40, 70])
  })
  it('puts an overdue day on today and keeps the grid after it', () => {
    const out = projectDueDays({ intervalDays: 7, anchor: day(-5) }, now, parseDay(day(20)))
    expect(fromToday(out)).toEqual([0, 9, 16])
  })
})

describe('plannedDays / completionSlot', () => {
  const day = (n: number) => toDayString(now + n * DAY)
  it('lists planned days in a range, none before the anchor', () => {
    const out = plannedDays({ intervalDays: 7, anchor: day(-10) }, now - 30 * DAY, now + 12 * DAY)
    expect(out.map((p) => Math.round((p.ms - parseDay(day(0))) / DAY))).toEqual([-10, -3, 4, 11])
    expect(out.map((p) => p.slot)).toEqual([0, 1, 2, 3])
  })
  it('maps a late completion to the planned day it was owed', () => {
    // planned -10, -3, 4: done at -2 (a day late for -3) counts for slot 1
    expect(completionSlot(day(-10), 7, now - 2 * DAY)).toBe(1)
    // done at -8 (two days early... for the first slot is -10, so -8 is a late slot 0)
    expect(completionSlot(day(-10), 7, now - 8 * DAY)).toBe(0)
  })
})
