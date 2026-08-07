const PillShapes = ({
    name, 
    x,
    y, 
    rotation = 0, 
    LabelOffset = { x: 0, y: -15 },
    style = {},
    colors = {},
}) => {
    const {
        width = 24,
        height = 10,
        borderRadius = 5,
        strokeWidth = 2,
    } = style;
    const {
        pillFill = 'white',
        pillStroke = '#c5c5c5'
    } = colors;

    return (
        <g> 
            {/* Station marker (pill shape) */}
            <g transform={`translate(${x}, ${y})${rotation ? ` rotate(${rotation})` : ''}`}>
                <rect
                    x={-width / 2}
                    y={-height / 2}
                    width={width}
                    height={height}
                    rx={borderRadius}
                    stroke={pillStroke}
                    strokeWidth={strokeWidth}
                    fill={pillFill}
                />
            </g>
        </g>
    );
};

export default PillShapes;