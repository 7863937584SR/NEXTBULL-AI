/**
 * Real-time market status calculator.
 * Computes actual OPEN / CLOSED / PRE-MKT / POST-MKT status
 * based on exchange operating hours and current time.
 */

export type MarketStatusType = 'OPEN' | 'CLOSED' | 'PRE-MKT' | 'POST-MKT' | '24/7';

export interface MarketStatusInfo {
  label: string;
  status: MarketStatusType;
  color: string;
  /** Next open or close time label, e.g. "Opens 09:15 IST" */
  nextEvent: string;
  /** Whether trading is active right now */
  isTrading: boolean;
}

/** Convert current time to minutes-since-midnight in a given UTC offset */
function minutesInOffset(now: Date, utcOffsetHours: number): number {
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60_000;
  const targetMs = utcMs + utcOffsetHours * 3_600_000;
  const target = new Date(targetMs);
  return target.getHours() * 60 + target.getMinutes();
}

/** Check if today is a weekday in the given UTC offset */
function isWeekdayInOffset(now: Date, utcOffsetHours: number): boolean {
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60_000;
  const targetMs = utcMs + utcOffsetHours * 3_600_000;
  const target = new Date(targetMs);
  const day = target.getDay();
  return day >= 1 && day <= 5;
}

/**
 * Determine if US is currently in Daylight Saving Time (EDT).
 * EDT: Second Sunday of March → First Sunday of November.
 */
function isUSdst(now: Date): boolean {
  const year = now.getUTCFullYear();
  // Second Sunday of March
  const march = new Date(Date.UTC(year, 2, 1));
  let marchSecondSun = 1;
  while (new Date(Date.UTC(year, 2, marchSecondSun)).getUTCDay() !== 0) marchSecondSun++;
  marchSecondSun += 7; // second Sunday
  const dstStart = Date.UTC(year, 2, marchSecondSun, 7); // 2 AM EST = 7 UTC

  // First Sunday of November
  const nov = new Date(Date.UTC(year, 10, 1));
  let novFirstSun = 1;
  while (new Date(Date.UTC(year, 10, novFirstSun)).getUTCDay() !== 0) novFirstSun++;
  const dstEnd = Date.UTC(year, 10, novFirstSun, 6); // 2 AM EDT = 6 UTC

  return now.getTime() >= dstStart && now.getTime() < dstEnd;
}

/**
 * Determine if UK is in British Summer Time (BST).
 * BST: Last Sunday of March → Last Sunday of October.
 */
function isUKbst(now: Date): boolean {
  const year = now.getUTCFullYear();
  // Last Sunday of March
  let day = 31;
  while (new Date(Date.UTC(year, 2, day)).getUTCDay() !== 0) day--;
  const bstStart = Date.UTC(year, 2, day, 1); // 1 AM UTC

  // Last Sunday of October
  day = 31;
  while (new Date(Date.UTC(year, 9, day)).getUTCDay() !== 0) day--;
  const bstEnd = Date.UTC(year, 9, day, 1); // 1 AM UTC

  return now.getTime() >= bstStart && now.getTime() < bstEnd;
}

function formatTimeInOffset(hours: number, minutes: number, tz: string): string {
  const hh = String(hours).padStart(2, '0');
  const mm = String(minutes).padStart(2, '0');
  return `${hh}:${mm} ${tz}`;
}

/* ═══════════════════════════════════════════════════════════════
   Individual market status calculators
   ═══════════════════════════════════════════════════════════════ */

function getNSEStatus(now: Date): MarketStatusInfo {
  const IST_OFFSET = 5.5;
  const mins = minutesInOffset(now, IST_OFFSET);
  const weekday = isWeekdayInOffset(now, IST_OFFSET);

  // NSE: Pre-open 9:00-9:15, Regular 9:15-15:30
  const PRE_OPEN_START = 9 * 60;       // 09:00
  const OPEN_START = 9 * 60 + 15;       // 09:15
  const CLOSE_TIME = 15 * 60 + 30;      // 15:30
  const POST_CLOSE = 15 * 60 + 40;      // 15:40 (closing session)

  if (!weekday) {
    return { label: 'NSE', status: 'CLOSED', color: 'red', nextEvent: 'Opens Mon 09:15 IST', isTrading: false };
  }

  if (mins >= OPEN_START && mins < CLOSE_TIME) {
    const closeH = 15, closeM = 30;
    return { label: 'NSE', status: 'OPEN', color: 'emerald', nextEvent: `Closes ${formatTimeInOffset(closeH, closeM, 'IST')}`, isTrading: true };
  }

  if (mins >= PRE_OPEN_START && mins < OPEN_START) {
    return { label: 'NSE', status: 'PRE-MKT', color: 'amber', nextEvent: `Opens ${formatTimeInOffset(9, 15, 'IST')}`, isTrading: false };
  }

  if (mins >= CLOSE_TIME && mins < POST_CLOSE) {
    return { label: 'NSE', status: 'POST-MKT', color: 'purple', nextEvent: 'Closing session', isTrading: false };
  }

  if (mins < PRE_OPEN_START) {
    return { label: 'NSE', status: 'CLOSED', color: 'red', nextEvent: `Opens ${formatTimeInOffset(9, 15, 'IST')}`, isTrading: false };
  }

  return { label: 'NSE', status: 'CLOSED', color: 'red', nextEvent: 'Opens 09:15 IST', isTrading: false };
}

function getBSEStatus(now: Date): MarketStatusInfo {
  // BSE has same hours as NSE
  const nse = getNSEStatus(now);
  return { ...nse, label: 'BSE' };
}

function getNYSEStatus(now: Date): MarketStatusInfo {
  const isDST = isUSdst(now);
  const ET_OFFSET = isDST ? -4 : -5;
  const mins = minutesInOffset(now, ET_OFFSET);
  const weekday = isWeekdayInOffset(now, ET_OFFSET);
  const tzLabel = isDST ? 'EDT' : 'EST';

  // NYSE: Pre-market 4:00-9:30, Regular 9:30-16:00, After-hours 16:00-20:00
  const PRE_MKT = 4 * 60;               // 04:00
  const OPEN_START = 9 * 60 + 30;        // 09:30
  const CLOSE_TIME = 16 * 60;            // 16:00
  const AFTER_HOURS_END = 20 * 60;       // 20:00

  if (!weekday) {
    return { label: 'NYSE', status: 'CLOSED', color: 'red', nextEvent: `Opens Mon 09:30 ${tzLabel}`, isTrading: false };
  }

  if (mins >= OPEN_START && mins < CLOSE_TIME) {
    return { label: 'NYSE', status: 'OPEN', color: 'emerald', nextEvent: `Closes ${formatTimeInOffset(16, 0, tzLabel)}`, isTrading: true };
  }

  if (mins >= PRE_MKT && mins < OPEN_START) {
    return { label: 'NYSE', status: 'PRE-MKT', color: 'amber', nextEvent: `Opens ${formatTimeInOffset(9, 30, tzLabel)}`, isTrading: false };
  }

  if (mins >= CLOSE_TIME && mins < AFTER_HOURS_END) {
    return { label: 'NYSE', status: 'POST-MKT', color: 'purple', nextEvent: `After-hours until ${formatTimeInOffset(20, 0, tzLabel)}`, isTrading: false };
  }

  return { label: 'NYSE', status: 'CLOSED', color: 'red', nextEvent: `Opens ${formatTimeInOffset(9, 30, tzLabel)}`, isTrading: false };
}

function getLSEStatus(now: Date): MarketStatusInfo {
  const isBST = isUKbst(now);
  const UK_OFFSET = isBST ? 1 : 0;
  const mins = minutesInOffset(now, UK_OFFSET);
  const weekday = isWeekdayInOffset(now, UK_OFFSET);
  const tzLabel = isBST ? 'BST' : 'GMT';

  // LSE: 8:00-16:30
  const OPEN_START = 8 * 60;             // 08:00
  const CLOSE_TIME = 16 * 60 + 30;       // 16:30
  const PRE_MKT = 7 * 60;               // 07:00 auction

  if (!weekday) {
    return { label: 'LSE', status: 'CLOSED', color: 'red', nextEvent: `Opens Mon 08:00 ${tzLabel}`, isTrading: false };
  }

  if (mins >= OPEN_START && mins < CLOSE_TIME) {
    return { label: 'LSE', status: 'OPEN', color: 'emerald', nextEvent: `Closes ${formatTimeInOffset(16, 30, tzLabel)}`, isTrading: true };
  }

  if (mins >= PRE_MKT && mins < OPEN_START) {
    return { label: 'LSE', status: 'PRE-MKT', color: 'amber', nextEvent: `Opens ${formatTimeInOffset(8, 0, tzLabel)}`, isTrading: false };
  }

  return { label: 'LSE', status: 'CLOSED', color: 'red', nextEvent: `Opens ${formatTimeInOffset(8, 0, tzLabel)}`, isTrading: false };
}

function getCryptoStatus(): MarketStatusInfo {
  return { label: 'CRYPTO', status: '24/7', color: 'cyan', nextEvent: 'Always open', isTrading: true };
}

/* ═══════════════════════════════════════════════════════════════
   Public API
   ═══════════════════════════════════════════════════════════════ */

export function getAllMarketStatuses(now?: Date): MarketStatusInfo[] {
  const t = now || new Date();
  return [
    getNSEStatus(t),
    getBSEStatus(t),
    getNYSEStatus(t),
    getLSEStatus(t),
    getCryptoStatus(),
  ];
}
