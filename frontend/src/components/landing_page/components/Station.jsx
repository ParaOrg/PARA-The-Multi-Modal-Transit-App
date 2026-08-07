//  Station marker component - renders a pill-shaped station with label
const Station = ({
  name,
  x,
  y,
  rotation = 0,
  labelOffset = { x: 0, y: -15 },
  style = {},
  colors = {},
}) => {
  const {
    width = 24,
    height = 10,
    borderRadius = 2,
    strokeWidth = 0,
  } = style;

  const {
    stationFill = 'white',
    stationStroke = '#c5c5c5',
    stationText = '#b0b0b0',
  } = colors;

  return (
    <g>
      {/* Round shape */}
      <g transform={`translate(${x}, ${y})${rotation ? ` rotate(${rotation})` : ''}`}>
        <rect
          x={-width / 2}
          y={-height / 2}
          width={width}
          height={height}
          rx={borderRadius}
          fill={stationFill}
          stroke={stationStroke}
          strokeWidth={strokeWidth}
        />
      </g>

      {/* Station label */}
      <text
        x={x + labelOffset.x}
        y={y + labelOffset.y}
        fill={stationText}
        fontSize="11"
        fontWeight="500"
        fontFamily="Poppins"
        letterSpacing="0.1em"
        transform={rotation ? `rotate(${rotation}, ${x + labelOffset.x}, ${y + labelOffset.y})` : undefined}
      >
        {name}
      </text>
    </g>
  );
};

export default Station;