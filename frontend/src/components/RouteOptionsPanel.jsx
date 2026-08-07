/**
 * RouteOptionsPanel - Display and compare multiple route options
 * Allows users to choose between Best, Average, and Normal routes
 */
import { useState } from "react";

export default function RouteOptionsPanel({ routeOptions, destination, onSelectRoute, onClose }) {
  const [expandedRoute, setExpandedRoute] = useState(null);
  const [showComparison, setShowComparison] = useState(true);

  if (!routeOptions || routeOptions.length === 0) {
    return null;
  }

  const handleSelectRoute = (routeId) => {
    if (onSelectRoute) {
      onSelectRoute(routeId);
    }
  };

  return (
    <>
      {/* Backdrop - click to close */}
      <div
        className="absolute inset-0 bg-black/20 z-25"
        onClick={onClose}
      />

      {/* Bottom Sheet */}
      <div className="absolute left-0 right-0 bottom-0 bg-white z-30 rounded-t-3xl shadow-2xl max-h-[85vh] overflow-y-auto">
        {/* Drag Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 pb-3 border-b border-gray-100">
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <h2 className="text-base font-medium text-gray-800 flex-1 ml-2">
            To {destination || "Destination"}
          </h2>
          <button className="p-2 hover:bg-gray-50 rounded-lg transition-colors">
            <svg className="w-6 h-6 transform rotate-90" fill="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="5" r="2" />
              <circle cx="12" cy="12" r="2" />
              <circle cx="12" cy="19" r="2" />
            </svg>
          </button>
        </div>

      {/* Comparison Table */}
      {showComparison && (
        <div className="mx-4 mt-4 mb-4 border-2 border-purple-300 rounded-xl bg-purple-50 p-4">
          <button
            onClick={() => setShowComparison(!showComparison)}
            className="flex items-center justify-between w-full mb-3"
          >
            <span className="text-xs text-purple-600 font-medium">See Analysis</span>
            <svg
              className={`w-5 h-5 text-purple-600 transition-transform ${showComparison ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Table Header */}
          <div className="grid grid-cols-4 gap-2 mb-3">
            <div></div>
            {routeOptions.slice(0, 3).map((route) => (
              <div key={route.route_id} className="text-center">
                <p className="text-xs font-medium text-gray-800">{route.route_label}</p>
              </div>
            ))}
          </div>

          {/* Time Row */}
          <div className="grid grid-cols-4 gap-2 mb-3 items-center">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
              <span className="text-xs font-medium text-gray-800">Time</span>
            </div>
            {routeOptions.slice(0, 3).map((route) => (
              <div key={route.route_id} className="text-center">
                <p className="text-xs text-gray-700">
                  {route.time_min}-{route.time_max} min
                </p>
              </div>
            ))}
          </div>

          {/* Fare Row */}
          <div className="grid grid-cols-4 gap-2 mb-3 items-center">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <span className="text-xs font-medium text-gray-800">Fare</span>
            </div>
            {routeOptions.slice(0, 3).map((route) => (
              <div key={route.route_id} className="text-center">
                <p className="text-xs text-gray-700">
                  ₱{route.fare_min}-{route.fare_max}
                </p>
              </div>
            ))}
          </div>

          {/* Transfer Row */}
          <div className="grid grid-cols-4 gap-2 mb-3 items-center">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              <span className="text-xs font-medium text-gray-800">Transfer</span>
            </div>
            {routeOptions.slice(0, 3).map((route) => (
              <div key={route.route_id} className="text-center">
                <p className="text-xs text-gray-700">{route.transfers}</p>
              </div>
            ))}
          </div>

          {/* Safety Row */}
          <div className="grid grid-cols-4 gap-2 items-center">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span className="text-xs font-medium text-gray-800">Safety</span>
            </div>
            {routeOptions.slice(0, 3).map((route) => (
              <div key={route.route_id} className="text-center">
                <p className="text-xs text-gray-700">{route.safety_rating}/5</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Route Options Section */}
      <div className="px-4">
        <h3 className="text-xl font-normal text-gray-800 mb-4">Route Options</h3>

        {/* Route Cards */}
        {routeOptions.map((route, index) => (
          <RouteCard
            key={route.route_id}
            route={route}
            isExpanded={expandedRoute === route.route_id}
            onToggleExpand={() => setExpandedRoute(expandedRoute === route.route_id ? null : route.route_id)}
            onSelectRoute={() => handleSelectRoute(route.route_id)}
            index={index}
          />
        ))}
      </div>
      </div>
    </>
  );
}

function RouteCard({ route, isExpanded, onToggleExpand, onSelectRoute, index }) {
  const getRouteTags = (route) => {
    const tags = [];
    if (route.route_label === "Best Route") {
      tags.push({ label: "Best", color: "bg-gray-100 text-gray-600" });
      tags.push({ label: "Safest", color: "bg-gray-100 text-gray-600" });
      if (route.transfers <= 2) {
        tags.push({ label: "Walkable", color: "bg-gray-100 text-gray-600" });
      }
    } else if (route.route_label === "Average Route") {
      if (route.transfers <= 2) {
        tags.push({ label: "Walkable", color: "bg-gray-100 text-gray-600" });
      }
    }
    return tags;
  };

  const getTransportSegments = (route) => {
    // Group consecutive lines by type to show transport sequence
    const segments = [];
    const seenTypes = new Set();

    route.lines?.forEach((line) => {
      if (!seenTypes.has(line.type)) {
        segments.push({
          type: line.type,
          name: line.name || line.type,
          color: line.color
        });
        seenTypes.add(line.type);
      }
    });

    return segments.slice(0, 3); // Limit to 3 segments for display
  };

  const tags = getRouteTags(route);
  const segments = getTransportSegments(route);

  return (
    <div className="mb-4 bg-gray-50 rounded-xl overflow-hidden">
      {/* Route Header */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h4 className="text-xl font-normal text-gray-800">{route.route_label}</h4>
          {index === 0 && (
            <div className="w-7 h-7 bg-gray-100 rounded-full"></div>
          )}
        </div>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex gap-2 mb-3">
            {tags.map((tag, idx) => (
              <span
                key={idx}
                className={`text-xs px-2 py-1 rounded ${tag.color}`}
              >
                {tag.label}
              </span>
            ))}
          </div>
        )}

        {/* Time and Fare Summary */}
        <div className="flex items-center gap-4 mb-3 text-gray-600 text-sm">
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
            <span>{route.time_min}-{route.time_max} min</span>
          </div>
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <span>₱{route.fare_min}-{route.fare_max}</span>
          </div>
        </div>

        {/* Transport Timeline */}
        {segments.length > 0 && (
          <div className="bg-white rounded-lg p-3 mb-3">
            <div className="flex items-center justify-between">
              {segments.map((segment, idx) => (
                <div key={idx} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className="w-10 h-10 rounded flex items-center justify-center text-xl"
                      style={{ backgroundColor: segment.color + "33" }}
                    >
                      {getTransportIcon(segment.type)}
                    </div>
                    <span className="text-xs text-gray-500 mt-1">
                      {route.time_min}-{route.time_max} min
                    </span>
                  </div>
                  {idx < segments.length - 1 && (
                    <div className="flex items-center mx-2">
                      <svg className="w-6 h-4" fill="none" stroke="#ccc" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </div>
                  )}
                </div>
              ))}
              <div className="text-2xl">🎯</div>
            </div>
          </div>
        )}

        {/* Route Description */}
        <div className="border-t border-gray-200 pt-3 mb-3">
          <p className="text-xs text-gray-600">
            {getRouteDescription(route)}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button className="flex-1 py-2 px-4 bg-white rounded-lg border border-gray-200 text-gray-600 text-sm hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            Like
          </button>
          <button
            onClick={onSelectRoute}
            className="flex-1 py-2 px-4 bg-purple-300 rounded-lg text-gray-800 text-sm hover:bg-purple-400 transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
            View Details
          </button>
        </div>
      </div>
    </div>
  );
}

function getTransportIcon(type) {
  const icons = {
    Jeepney: "🚐",
    Bus: "🚌",
    Train: "🚇",
    UV: "🚗",
    Walk: "🚶",
    Transit: "🚌"
  };
  return icons[type] || "🚌";
}

function getRouteDescription(route) {
  if (!route.lines || route.lines.length === 0) {
    return "No route details available";
  }

  const segments = [];
  const seenTypes = new Set();

  route.lines.forEach((line) => {
    if (!seenTypes.has(line.type)) {
      const name = line.name || line.type;
      segments.push(`${line.type} ${name !== line.type ? "through " + name : ""}`);
      seenTypes.add(line.type);
    }
  });

  return segments.join(" → ") || "Route details";
}
