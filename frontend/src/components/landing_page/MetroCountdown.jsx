import { MetroMap, Countdown } from './components';
import { CONFIG, STATIONS, LINES, TRAINS } from './data';

// Main MetroCountdown component
const MetroCountdown = ({
  // Override default config
  targetDate = CONFIG.targetDate,
  dateLabel = CONFIG.dateLabel,
  // Override default data
  stations = STATIONS,
  lines = LINES,
  trains = TRAINS,
  // Override default styling
  config = CONFIG,
}) => {
  const { colors, ticketStyle } = config;

  return (
    <div
      className="relative w-full h-screen overflow-hidden"
      style={{ backgroundColor: colors.background }}
    >
      {/* Metro Map Background */}
      <MetroMap
        lines={lines}
        stations={stations}
        trains={trains}
        config={config}
      />

      {/* Countdown Overlay (fullscreen center; Countdown itself is flow-sized) */}
      <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
        <Countdown
          targetDate={targetDate}
          dateLabel={dateLabel}
          backgroundColor={colors.ticketBackground}
          scallopsColor={colors.background}
          ticketStyle={ticketStyle}
        />
      </div>
    </div>
  );
};

export default MetroCountdown;