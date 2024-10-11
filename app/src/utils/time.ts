import TimeAgo from 'javascript-time-ago';
import en from 'javascript-time-ago/locale/en';

TimeAgo.addDefaultLocale(en);
export const timeAgo = new TimeAgo('en-US');

type TimeUnit = 'days' | 'weeks' | 'months' | 'years';

interface TimeUnitResult {
  timeUnit: TimeUnit;
  unitValue: number;
}

export function secondsToTimeUnit(seconds: number): TimeUnitResult {
  const days = seconds / (24 * 60 * 60);
  
  if (days % 365 === 0) {
    return { timeUnit: 'years', unitValue: days / 365 };
  } else if (days % 30 === 0) {
    return { timeUnit: 'months', unitValue: days / 30 };
  } else if (days % 7 === 0) {
    return { timeUnit: 'weeks', unitValue: days / 7 };
  } else {
    return { timeUnit: 'days', unitValue: days };
  }
}
