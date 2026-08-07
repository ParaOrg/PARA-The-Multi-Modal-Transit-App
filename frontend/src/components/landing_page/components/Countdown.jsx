import React from 'react';
import Ticket from './Ticket';
import CountdownDisplay from './CountdownDisplay';
import { useCountdown } from '../hooks';

// Countdown component - ticket-shaped countdown timer
const Countdown = ({
  targetDate,
  dateLabel = '',
  backgroundColor = '#3b009a',
  scallopsColor = '#f0f0f0',
  ticketStyle = {},
}) => {
  const timeLeft = useCountdown(targetDate);

  return (
    <div className="flex shrink-0 justify-center pointer-events-none">
      <div className="pointer-events-auto scale-100 sm:scale-105 md:scale-110 lg:scale-[1.12] origin-center">
        <Ticket
          backgroundColor={backgroundColor}
          scallopsColor={scallopsColor}
          style={ticketStyle}
        >
          <CountdownDisplay
            days={timeLeft.days}
            hours={timeLeft.hours}
            minutes={timeLeft.minutes}
            seconds={timeLeft.seconds}
            label={dateLabel}
          />
        </Ticket>
      </div>
    </div>
  );
};

export default Countdown;