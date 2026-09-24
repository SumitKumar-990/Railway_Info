/**
 * Time formatting utilities for passenger-friendly display.
 * Converts raw ISO 8601 strings (e.g. 2026-09-02T22:03:00+05:30) and railway times
 * into clean, readable 12-hour (AM/PM) or 24-hour formats with date/day difference badges.
 */

export interface FormattedTimeInfo {
  formatted: string;         // e.g. "10:03 PM" or "22:03"
  timeOnly: string;          // e.g. "10:03" or "22:03"
  period?: 'AM' | 'PM';      // AM or PM if 12h
  dateLabel?: string;        // e.g. "02 Sep"
  dayDiffLabel?: string;     // e.g. "+1 Day"
  isCrossMidnight?: boolean; // true if next day
  raw: string;
}

/**
 * Parses and formats any timestamp (ISO string, HH:MM:SS, HH:MM) into passenger-friendly time.
 * @param rawTime Raw timestamp string from API
 * @param use24Hour If true, formats as 24-hour railway time (e.g. 22:03); if false, formats as 12-hour (e.g. 10:03 PM)
 * @param baseJourneyDate Optional journey starting date (YYYY-MM-DD) to compute day difference
 */
export function formatPassengerTime(
  rawTime?: string | null,
  use24Hour: boolean = false,
  baseJourneyDate?: string | null
): FormattedTimeInfo {
  if (!rawTime || rawTime.trim() === '' || rawTime.trim() === '--') {
    return { formatted: '--', timeOnly: '--', raw: rawTime || '--' };
  }

  const str = rawTime.trim();

  // 1. Match ISO 8601 datetime pattern: YYYY-MM-DDTHH:MM(:SS)?
  const isoMatch = str.match(/^(\d{4}-\d{2}-\d{2})[T\s](\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (isoMatch) {
    const [, datePart, hStr, mStr] = isoMatch;
    let hours = parseInt(hStr, 10);
    const minutes = parseInt(mStr, 10);
    const mm = minutes.toString().padStart(2, '0');

    let dayDiffLabel: string | undefined;
    let isCrossMidnight = false;
    let dateLabel: string | undefined;

    if (datePart) {
      try {
        const [y, m, d] = datePart.split('-').map(Number);
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        dateLabel = `${d.toString().padStart(2, '0')} ${months[m - 1]}`;

        if (baseJourneyDate) {
          const baseParts = baseJourneyDate.split('-').map(Number);
          if (baseParts.length === 3) {
            const baseD = new Date(baseParts[0], baseParts[1] - 1, baseParts[2]);
            const curD = new Date(y, m - 1, d);
            const diffDays = Math.round((curD.getTime() - baseD.getTime()) / (1000 * 60 * 60 * 24));
            if (diffDays === 1) {
              dayDiffLabel = '+1 Day';
              isCrossMidnight = true;
            } else if (diffDays > 1) {
              dayDiffLabel = `+${diffDays} Days`;
              isCrossMidnight = true;
            }
          }
        }
      } catch {
        // Safe fallback on date calculation errors
      }
    }

    if (use24Hour) {
      const hh24 = hours.toString().padStart(2, '0');
      return {
        formatted: `${hh24}:${mm}`,
        timeOnly: `${hh24}:${mm}`,
        dateLabel,
        dayDiffLabel,
        isCrossMidnight,
        raw: str
      };
    } else {
      const period: 'AM' | 'PM' = hours >= 12 ? 'PM' : 'AM';
      let h12 = hours % 12;
      if (h12 === 0) h12 = 12;
      return {
        formatted: `${h12}:${mm} ${period}`,
        timeOnly: `${h12}:${mm}`,
        period,
        dateLabel,
        dayDiffLabel,
        isCrossMidnight,
        raw: str
      };
    }
  }

  // 2. Match standard HH:MM(:SS)? pattern (with or without AM/PM)
  const timeMatch = str.match(/^(\d{1,2}):(\d{2})(?::\d{2})?(?:\s*(AM|PM))?$/i);
  if (timeMatch) {
    let hours = parseInt(timeMatch[1], 10);
    const minutes = parseInt(timeMatch[2], 10);
    const mm = minutes.toString().padStart(2, '0');
    const existingPeriod = timeMatch[3] ? timeMatch[3].toUpperCase() : null;

    if (existingPeriod) {
      if (use24Hour) {
        if (existingPeriod === 'PM' && hours < 12) hours += 12;
        if (existingPeriod === 'AM' && hours === 12) hours = 0;
        const hh = hours.toString().padStart(2, '0');
        return { formatted: `${hh}:${mm}`, timeOnly: `${hh}:${mm}`, raw: str };
      } else {
        return {
          formatted: `${hours}:${mm} ${existingPeriod}`,
          timeOnly: `${hours}:${mm}`,
          period: existingPeriod as 'AM' | 'PM',
          raw: str
        };
      }
    }

    if (use24Hour) {
      const hh = hours.toString().padStart(2, '0');
      return { formatted: `${hh}:${mm}`, timeOnly: `${hh}:${mm}`, raw: str };
    } else {
      const period: 'AM' | 'PM' = hours >= 12 ? 'PM' : 'AM';
      let h12 = hours % 12;
      if (h12 === 0) h12 = 12;
      return {
        formatted: `${h12}:${mm} ${period}`,
        timeOnly: `${h12}:${mm}`,
        period,
        raw: str
      };
    }
  }

  return { formatted: str, timeOnly: str, raw: str };
}
