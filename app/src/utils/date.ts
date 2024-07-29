import { intervalToDuration } from 'date-fns';

// function to calculate the countdown time difference with priority 1d, 1h, 1m, 1s...
export function countdown(eventTime: Date): string {
  const currentTime = new Date();
  if (eventTime <= currentTime) {
    return 'live';
  }

  const duration = intervalToDuration({
    start: currentTime,
    end: eventTime
  });

  const { days, hours, minutes, seconds } = duration;

  if (days && days > 0) {
    return `${days}d`;
  } else if (hours && hours > 0) {
    return `${hours}h`;
  } else if (minutes && minutes > 0) {
    return `${minutes}m`;
  } else {
    return `${seconds}s`;
  }
}
