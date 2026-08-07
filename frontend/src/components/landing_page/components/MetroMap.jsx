import React from 'react';
import Station from './Station';
import MetroLine from './MetroLine';
import Train from './Train';

/**
 * Metro Map component - renders the complete SVG map with lines, stations, and trains
 */
const MetroMap = ({
  lines = [],
  stations = [],
  pillShapes = [],
  trains = [],
  config = {},
}) => {
  const {
    viewBox = { width: 1200, height: 800 },
    colors = {},
    lineStyle = {},
    trainStyle = {},
    stationStyle = {},
    pillShapeStyle = {},
  } = config;

  return (
    <svg
      className="absolute inset-0 w-full h-full z-0"
      viewBox={`0 0 ${viewBox.width} ${viewBox.height}`}
      preserveAspectRatio="xMidYMid slice"
    >
      {/* Render Lines */}
      {lines.map((line) => (
        <MetroLine
          key={line.id}
          d={line.d}
          stroke={colors.lines}
          strokeWidth={lineStyle.strokeWidth}
        />
      ))}

      {/* Render Stations */}
      {stations.map((station) => (
        <Station
          key={station.id}
          name={station.name}
          x={station.x}
          y={station.y}
          rotation={station.rotation}
          labelOffset={station.labelOffset}
          style={stationStyle}
          colors={colors}
        />
      ))}

      {/* Pill Shape Stations */}
      {pillShapes.map((pillShape) => (
        <PillShapes
          key={pillShape.id}
          name={pillShape.name}
          x={pillShape.x}
          y={pillShape.y}
          colors ={colors}
          style = {pillShapeStyle}
        />
      ))}

      {/* Render Trains */}
      {trains.map((train) => (
        <Train
          key={train.id}
          id={train.id}
          path={train.path}
          duration={train.duration}
          delay={train.delay}
          size={trainStyle.size}
          fill={colors.trainFill}
        />
      ))}
    </svg>
  );
};

export default MetroMap;