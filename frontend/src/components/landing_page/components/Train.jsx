const Train = ({
  id,
  path,
  duration = 10,
  delay = 0,
  size = 20,
  fill = 'white',
}) => (
  <g>
    {/* Train (top view modern metro style) */}
    <g
      filter="drop-shadow(0 1px 2px rgba(0,0,0,0.15))"
      transform={`translate(${-(size * 1.7)}, ${-(size * 0.75)})`}
    >
      {/* Motion */}
      <animateMotion
        dur={`${duration}s`}
        repeatCount="indefinite"
        begin={`${delay}s`}
        rotate="auto"
      >
        <mpath href={`#${id}-path`} />
      </animateMotion>

      {/* Main body (LONGER) */}
      <rect
        x="0"
        y={size * 0.2}
        width={size * 3.4}
        height={size * 1.1}
        rx={size * 0.3}
        fill={fill}
      />

      {/* Front nose */}
      <rect
        x={size * 3.15}
        y={size * 0.25}
        width={size * 0.65}
        height={size * 1.0}
        rx={size * 0.45}
        fill={fill}
      />

      {/* Windshield */}
      <rect
        x={size * 2.9}
        y={size * 0.35}
        width={size * 0.5}
        height={size * 0.75}
        rx={size * 0.2}
        fill="#60a5fa"
        opacity="0.85"
      />

      {/* Roof panels */}
      <rect
        x={size * 0.9}
        y={size * 0.3}
        width={size * 0.2}
        height={size * 0.9}
        fill="#9ca3af"
        opacity="0.45"
      />

      <rect
        x={size * 1.7}
        y={size * 0.3}
        width={size * 0.2}
        height={size * 0.9}
        fill="#9ca3af"
        opacity="0.45"
      />

      <rect
        x={size * 2.5}
        y={size * 0.3}
        width={size * 0.2}
        height={size * 0.9}
        fill="#9ca3af"
        opacity="0.45"
      />
    </g>

    {/* Hidden path */}
    <path id={`${id}-path`} d={path} fill="none" stroke="none" />
  </g>
);

export default Train;
