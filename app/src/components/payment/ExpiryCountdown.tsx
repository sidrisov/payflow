import { useState, useEffect } from 'react';
import { Typography } from '@mui/material';

interface ExpiryCountdownProps {
  expiresAt: Date;
}

export function ExpiryCountdown({ expiresAt }: ExpiryCountdownProps) {
  const [timeLeft, setTimeLeft] = useState('00:00');

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const expiryDate = new Date(expiresAt);
      const difference = expiryDate.getTime() - now.getTime();

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        let timeString = '';
        if (days > 0) timeString += `${days}d `;
        if (hours > 0 || days > 0) timeString += `${hours}h `;
        timeString += `${minutes}m ${seconds}s`;

        setTimeLeft(timeString.trim());
        return true;
      }
    };

    // Initial update
    updateCountdown();

    // Set up the interval
    const timer = setInterval(() => {
      const shouldContinue = updateCountdown();
      if (!shouldContinue) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [expiresAt]);

  return (
    <Typography variant="body1" fontWeight="bold" color="textSecondary">
      {timeLeft}
    </Typography>
  );
}
