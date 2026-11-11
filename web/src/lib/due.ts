// Pure "what is due" logic. No I/O, so it is easy to test.
export const DAY = 86_400_000
/** After a regurgitation, wait this long before offering food again. */
export const REGURG_WAIT_DAYS = 14

export type DueState = 'never' | 'due' | 'ok' | 'wait'
export interface Due {
  state: DueState
  /** state 'due': days overdue (0 = due today). state 'ok': days until due. state 'wait': days left to wait. */
  days: number
}

export interface FeedInput {
  intervalDays: number
  /** Most recent feeding where the animal ate. A refusal does not reset the schedule. */
  lastAteAt?: string | null
  /** Most recent feeding of any outcome. */
  lastFeed?: { at: string; outcome: string } | null
}

export function feedingStatus(i: FeedInput, now = Date.now()): Due {
  if (i.lastFeed?.outcome === 'regurgitated') {
    const until = new Date(i.lastFeed.at).getTime() + REGURG_WAIT_DAYS * DAY
    if (until > now) return { state: 'wait', days: Math.ceil((until - now) / DAY) }
  }
  if (!i.lastAteAt) return { state: 'never', days: 0 }
  return dueFrom(i.lastAteAt, i.intervalDays, now)
}

export function cleaningStatus(intervalDays: number, lastCleanedAt?: string | null, now = Date.now()): Due {
  if (!lastCleanedAt) return { state: 'never', days: 0 }
  return dueFrom(lastCleanedAt, intervalDays, now)
}

function dueFrom(lastAt: string, intervalDays: number, now: number): Due {
  const dueAt = new Date(lastAt).getTime() + intervalDays * DAY
  return dueAt <= now
    ? { state: 'due', days: Math.floor((now - dueAt) / DAY) }
    : { state: 'ok', days: Math.floor((dueAt - now) / DAY) }
}

/** Consecutive refusals, newest first. `outcomes` must be sorted newest first. */
export function refusalStreak(outcomes: string[]): number {
  let n = 0
  for (const o of outcomes) { if (o !== 'refused') break; n++ }
  return n
}

/** Weight dropped by at least `threshold` since the previous weigh-in (within `maxGapDays`). `weights` newest first. */
export function weightDrop(
  weights: { at: string; grams: number }[], threshold = 0.1, maxGapDays = 45,
): { pct: number; from: number; to: number } | null {
  if (weights.length < 2) return null
  const [latest, prev] = weights
  const gap = (new Date(latest.at).getTime() - new Date(prev.at).getTime()) / DAY
  if (gap > maxGapDays || prev.grams <= 0) return null
  const drop = (prev.grams - latest.grams) / prev.grams
  return drop >= threshold ? { pct: Math.round(drop * 100), from: prev.grams, to: latest.grams } : null
}

export function describeDue(d: Due, what: string): string {
  switch (d.state) {
    case 'never': return `${what}: no record yet`
    case 'wait': return `${what}: wait ${d.days} more day${d.days === 1 ? '' : 's'}`
    case 'due': return d.days === 0 ? `${what} due today` : `${what} overdue by ${d.days} day${d.days === 1 ? '' : 's'}`
    case 'ok': return d.days === 0 ? `${what} due today` : `${what} due in ${d.days} day${d.days === 1 ? '' : 's'}`
  }
}
