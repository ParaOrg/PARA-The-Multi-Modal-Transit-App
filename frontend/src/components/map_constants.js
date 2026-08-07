// Marker colors matching backend types
export const MARKER_COLORS = {
    User_Location: "#4285F4",
    End_Destination: "#EA4335",
    Jeepney: "#FBBC05",
    Bus: "#34A853",
    UV: "#9C27B0",
    Train: "#FF6D00",
    Walk: "#757575",
    Default: "#666666"
};

// Line colors for polylines
export const LINE_COLORS = {
    Jeepney: "#FBBC05",
    Bus: "#34A853",
    UV: "#9C27B0",
    Train: "#FF6D00",
    Walk: "#757575",
    Transit: "#34A853",
    Default: "#4285F4"
};

// Create Leaflet divIcon for markers
export const getMarkerIcon = (type) => {
    const color = MARKER_COLORS[type] || MARKER_COLORS.Default;
    const size = type === "User_Location" || type === "End_Destination" ? 16 : 10;
    return L.divIcon({
        className: 'custom-marker',
        html: `<div style="width:${size}px;height:${size}px;background:${color};border:2px solid white;border-radius:50%;box-shadow:0 2px 4px rgba(0,0,0,0.3);${type==='End_Destination'?'width:14px;height:14px;border:3px solid white;':''}"></div>`,
        iconSize: [size, size],
        iconAnchor: [size/2, size/2],
    });
};

// Get line color for a transport type
export const getLineColor = (type) => {
    return LINE_COLORS[type] || LINE_COLORS.Default;
};

// Get line style options for Leaflet
export const getLineOptions = (type) => {
    const color = getLineColor(type);
    if (type === "Walk") {
        return { color, weight: 3, opacity: 0.7, dashArray: "8 6" };
    }
    return { color, weight: 5, opacity: 0.8 };
};