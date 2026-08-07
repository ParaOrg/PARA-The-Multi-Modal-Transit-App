/**
 * RouteLegend - Shows legend for map markers and lines
 */
import { MARKER_COLORS } from "./map_constants";

export default function RouteLegend({ markers = [], lines = [] }) {
    // Get unique transport types from markers and lines
    const transportTypes = new Set();
    
    markers.forEach(m => {
        if (m.type !== "User_Location" && m.type !== "End_Destination") {
            transportTypes.add(m.type);
        }
    });
    
    lines.forEach(l => {
        if (l.type) transportTypes.add(l.type);
    });

    // Don't show legend if no transport types
    if (transportTypes.size === 0 && markers.length < 2) {
        return null;
    }

    return (
        <div className="absolute top-2 right-2 z-[1000] bg-white/90 backdrop-blur rounded-lg shadow-lg p-3 max-w-xs text-xs">
            <h4 className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">
                Route Legend
            </h4>
            <div className="space-y-1.5">
                {/* Always show origin and destination if markers exist */}
                {markers.some(m => m.type === "User_Location") && (
                    <LegendItem 
                        color={MARKER_COLORS.User_Location} 
                        label="Your Location" 
                        icon="●"
                    />
                )}
                {markers.some(m => m.type === "End_Destination") && (
                    <LegendItem 
                        color={MARKER_COLORS.End_Destination} 
                        label="Destination" 
                        icon="▼"
                    />
                )}
                
                {/* Transport types */}
                {Array.from(transportTypes).map(type => (
                    <LegendItem 
                        key={type}
                        color={MARKER_COLORS[type] || MARKER_COLORS.Default}
                        label={getTypeLabel(type)}
                        icon="—"
                        isLine
                    />
                ))}
            </div>
        </div>
    );
}

function LegendItem({ color, label, icon, isLine = false }) {
    return (
        <div className="flex items-center gap-2 text-sm">
            {isLine ? (
                <span 
                    className="w-5 h-1 rounded"
                    style={{ backgroundColor: color }}
                />
            ) : (
                <span 
                    className="text-sm"
                    style={{ color }}
                >
                    {icon}
                </span>
            )}
            <span className="text-gray-700">{label}</span>
        </div>
    );
}

function getTypeLabel(type) {
    const labels = {
        Jeepney: "Jeepney",
        Bus: "Bus",
        Train: "Train/LRT/MRT",
        UV: "UV Express",
        Walk: "Walking",
        Transit: "Transit"
    };
    return labels[type] || type;
}
