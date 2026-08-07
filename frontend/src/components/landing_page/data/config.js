// Main configuration
export const CONFIG = {
  // Target date for countdown
  targetDate: '2026-04-04T00:00:00',

  // Display text below countdown
  dateLabel: 'April 4, 2026',

  // Colors
  colors: {
    background: '#f0f0f0',
    lines: '#d1d1d1',
    stationFill: 'white',
    stationStroke: '#c5c5c5',
    stationText: '#b0b0b0',
    ticketBackground: '#3b009a',
    trainFill: 'white',
  },

  // SVG viewBox dimensions
  viewBox: { 
    width: 1200, 
    height: 800 
  },

  // Line styling
  lineStyle: { 
    strokeWidth: 4 
  },

  // Train styling
  trainStyle: { 
    size: 10 
  },

  // Station marker styling
  stationStyle: {
    width: 24,
    height: 10,
    borderRadius: 5,
    strokeWidth: 2,
  },

  // Ticket styling (larger ticket for landing hero)
  ticketStyle: {
    width: 440,
    height: 248,
    scallopsCount: 34,
    scallopsSize: 10,
    notchWidth: 16,
    notchHeight: 40,
  },
};