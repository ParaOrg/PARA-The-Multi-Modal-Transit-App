// Ticket component - renders a ticket shape with scalloped edges and side notches
const Ticket = ({
  children,
  backgroundColor = '#3b009a',
  style = {},
}) => {
  const {
    width = 320,
    height = 180,
    scallopsCount = Math.floor(320 / 24),
    scallopsRadius = 8,
    notchRadius = 20,
  } = style;

  const generateTicketPath = () => {
    const spacing = width / scallopsCount;
    
    let path = '';
    
    path += `M 0 ${notchRadius}`;
    
    path += ` L 0 0`;
    for (let i = 0; i < scallopsCount; i++) {
      const startX = i * spacing;
      const midX = startX + spacing / 2;
      const endX = (i + 1) * spacing;
      path += ` L ${startX} 0`;
      path += ` Q ${midX} ${scallopsRadius * 2}, ${endX} 0`;
    }
    
    path += ` L ${width} 0`;
    path += ` L ${width} ${height / 2 - notchRadius}`;
    
    path += ` Q ${width - notchRadius * 1.5} ${height / 2}, ${width} ${height / 2 + notchRadius}`;
    
    path += ` L ${width} ${height}`;
    
    for (let i = scallopsCount; i > 0; i--) {
      const startX = i * spacing;
      const midX = startX - spacing / 2;
      const endX = (i - 1) * spacing;
      path += ` L ${startX} ${height}`;
      path += ` Q ${midX} ${height - scallopsRadius * 2}, ${endX} ${height}`;
    }
    
    path += ` L 0 ${height}`;
    path += ` L 0 ${height / 2 + notchRadius}`;
    
    path += ` Q ${notchRadius * 1.5} ${height / 2}, 0 ${height / 2 - notchRadius}`;
    
    // Close path
    path += ` Z`;
    
    return path;
  };

  return (
    <div className="relative drop-shadow-xl">
      <svg
        width={width}
        height={height}
        className="drop-shadow-2xl"
      >
        <path
          d={generateTicketPath()}
          fill={backgroundColor}
        />
        {/* For content, we use foreignObject */}
        <foreignObject x="0" y="0" width={width} height={height}>
          <div className="w-full h-full flex items-center justify-center">
            {children}
          </div>
        </foreignObject>
      </svg>
    </div>
  );
};

export default Ticket;