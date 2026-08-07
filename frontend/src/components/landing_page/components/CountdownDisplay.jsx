// Format number with leading zero
const formatNum = (num) => String(num).padStart(2, '0');

// Single time unit display
const TimeUnit = ({ value, label }) => (
  <div className="flex flex-col items-center">
    <span className="text-3xl sm:text-5xl md:text-6xl font-bold">
      {typeof value === 'number' && value < 100 ? formatNum(value) : value}
    </span>
    <span className="text-[10px] sm:text-xs uppercase tracking-wider opacity-70">
      {label}
    </span>
  </div>
);

// Color separator
const Separator = () => (
  <span className="text-2xl sm:text-4xl md:text-5xl font-bold opacity-50 mx-0.5 sm:mx-1.5">:</span>
);

// Countdown display component - shows days, hours, minutes, seconds
const CountdownDisplay = ({
  days = 0,
  hours = 0,
  minutes = 0,
  seconds = 0,
  label = '',
}) => (
  <div className="text-center text-white z-10 px-4 sm:px-8">
    <div className="flex items-baseline justify-center gap-1">
      <TimeUnit value={days} label="days" />
      <Separator />
      <TimeUnit value={hours} label="hrs" />
      <Separator />
      <TimeUnit value={minutes} label="min" />
      <Separator />
      <TimeUnit value={seconds} label="sec" />
    </div>
    {label && (
      <div className="mt-4 text-sm sm:text-base uppercase tracking-widest opacity-80">
        {label}
      </div>
    )}
  </div>
);

export default CountdownDisplay;