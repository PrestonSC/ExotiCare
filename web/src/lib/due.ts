// Pure "what is due" logic. No I/O, so it is easy to test.
export const DAY = 86_400_000
/** After a regurgitation, wait this long before offering food again. */
export const REGURG_WAIT_DAYS = 14

export type DueState = 'never' | 'due' | 'ok' | 'wait'
export interface Due {
  state: DueState
  /** state 'due': days overdue (0 = due today). state 'ok': days until due. state 'wait': days left to wait. */
  days: number
  /** The planned date (local midnight, ms) this status is counting towards. */
  nextDue?: number
}

export interface FeedInput {
  intervalDays: number
  /** A date on the planned feeding grid ('YYYY-MM-DD'): planned feedings fall on this date +/- whole intervals. */
  anchor?: string | null
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
  return planStatus({ intervalDays: i.intervalDays, anchor: i.anchor, lastAt: i.lastAteAt }, now)
}

const startOfDay = (ms: number) => { const d = new Date(ms); return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() }
/** Whole calendar days from b to a, in local time (so "cleaned this morning" is 0 days ago all day). */
const calendarDays = (a: number, b: number) => Math.round((startOfDay(a) - startOfDay(b)) / DAY)

// ---- Fixed planned schedule ------------------------------------------------------------------
// A task (feeding, spot clean, full clean) has planned days on a fixed grid: anchor + k * interval.
// Doing a task late does NOT move the grid: it stays due (rolls over) until it is done, and the next
// planned day is still the next grid day, so a feeding done a day late is followed by one 6 days
// later on a 7-day schedule. Doing one early counts for the nearest planned day.

/** 'YYYY-MM-DD' -> local midnight (ms). */
export const parseDay = (s: string) => {
  const [y, m, d] = s.slice(0, 10).split('-').map(Number)
  return new Date(y, m - 1, d).getTime()
}
export const toDayString = (ms: number) => {
  const d = new Date(ms)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
const addDays = (ms: number, n: number) => { const d = new Date(ms); return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n).getTime() }

export interface PlanInput {
  intervalDays: number
  /** A date on the planned grid. If absent, the grid starts at the last completion. */
  anchor?: string | null
  /** Most recent completion (ISO timestamp). */
  lastAt?: string | null
}

/**
 * Which planned slot a completion counts for. Slot k is planned for anchor + k*interval; a completion
 * belongs to the slot whose window contains it. Windows are centred on the planned day (a little early
 * counts, a late one still counts for the slot it was owed), so extra early completions do not also
 * satisfy the next slot.
 */
const slotOf = (anchorDay: number, intervalDays: number, atMs: number) =>
  Math.floor((calendarDays(atMs, anchorDay) + Math.floor((intervalDays - 1) / 2)) / intervalDays)

export function planStatus(input: PlanInput, now = Date.now()): Due {
  const today = startOfDay(now)
  const I = Math.max(1, Math.round(input.intervalDays))
  if (!input.lastAt) {
    if (!input.anchor) return { state: 'never', days: 0 }
    const a = parseDay(input.anchor)
    const diff = calendarDays(today, a)
    return diff >= 0 ? { state: 'never', days: diff, nextDue: a } : { state: 'ok', days: -diff, nextDue: a }
  }
  const last = new Date(input.lastAt).getTime()
  const anchorDay = input.anchor ? parseDay(input.anchor) : startOfDay(last)
  const next = Math.max(addDays(anchorDay, (slotOf(anchorDay, I, last) + 1) * I), anchorDay)
  const diff = calendarDays(today, next)
  return diff >= 0 ? { state: 'due', days: diff, nextDue: next } : { state: 'ok', days: -diff, nextDue: next }
}

/**
 * Every planned day from today up to (not including) `endMs`, assuming each is done on the day.
 * An overdue one shows on today. Used to draw upcoming due dates on the calendar.
 */
export function projectDueDays(input: PlanInput, now: number, endMs: number): number[] {
  const today = startOfDay(now)
  const I = Math.max(1, Math.round(input.intervalDays))
  const st = planStatus(input, now)
  const anchorDay = input.anchor ? parseDay(input.anchor) : input.lastAt ? startOfDay(new Date(input.lastAt).getTime()) : today
  let due = st.nextDue === undefined ? today : Math.max(st.nextDue, today)
  const out: number[] = []
  for (let n = 0; n < 400 && due < endMs; n++) {
    out.push(due)
    due = addDays(anchorDay, (slotOf(anchorDay, I, due) + 1) * I)
  }
  return out
}

/** The planned day numbers (slot) a completion counts for, on the grid starting at `anchor`. */
export const completionSlot = (anchor: string, intervalDays: number, at: string | number) =>
  slotOf(parseDay(anchor), Math.max(1, Math.round(intervalDays)), typeof at === 'number' ? at : new Date(at).getTime())

/** Planned days on the grid within [fromMs, toMs), with their slot numbers. Days before the anchor are not planned. */
export function plannedDays(input: { intervalDays: number; anchor: string }, fromMs: number, toMs: number): { ms: number; slot: number }[] {
  const I = Math.max(1, Math.round(input.intervalDays))
  const a = parseDay(input.anchor)
  const out: { ms: number; slot: number }[] = []
  for (let k = Math.max(0, Math.ceil(calendarDays(startOfDay(fromMs), a) / I)); out.length < 1000; k++) {
    const ms = addDays(a, k * I)
    if (ms >= toMs) break
    out.push({ ms, slot: k })
  }
  return out
}

export function cleaningStatus(
  intervalDays: number, lastCleanedAt?: string | null, now = Date.now(), anchor?: string | null,
): Due {
  return planStatus({ intervalDays, anchor, lastAt: lastCleanedAt }, now)
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

// ---- Cleaning: two schedules per enclosure -------------------------------------------------
/** Kinds that count as a "full" clean. Older entries logged as substrate/disinfect are full-level. */
export const FULL_KINDS = ['full', 'substrate', 'disinfect']
export const isFullKind = (kind: string) => FULL_KINDS.includes(kind)

export interface CleanStatus {
  spot: Due; full: Due
  lastSpotAt?: string; lastFullAt?: string
}

/**
 * Spot-clean and full-clean status for one enclosure. A full clean also counts as a spot clean
 * (the enclosure was just cleaned), but a spot clean never counts as a full clean.
 */
export function cleanStatus(
  cleanings: { cleaned_at: string; kind: string }[],
  spotIntervalDays: number, fullIntervalDays: number, now = Date.now(),
  anchors: { spot?: string | null; full?: string | null } = {},
): CleanStatus {
  const latest = (rows: { cleaned_at: string }[]) =>
    rows.reduce<string | undefined>((a, r) => (!a || r.cleaned_at > a ? r.cleaned_at : a), undefined)
  const lastSpotAt = latest(cleanings)
  const lastFullAt = latest(cleanings.filter((c) => isFullKind(c.kind)))
  return {
    spot: cleaningStatus(spotIntervalDays, lastSpotAt, now, anchors.spot),
    full: cleaningStatus(fullIntervalDays, lastFullAt, now, anchors.full),
    lastSpotAt, lastFullAt,
  }
}
