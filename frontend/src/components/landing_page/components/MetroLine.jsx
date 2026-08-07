//Metro line component 
const MetroLine = ({
  d,
  stroke = '#d1d1d1',
  strokeWidth = 4,
}) => (
  <path
    d={d}
    fill="none"
    stroke={stroke}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
  />
);

export default MetroLine;