/**
 * TripSummaryCard.jsx — Route itinerary with visual segment connectors.
 */

export default function TripSummaryCard({ routeData }) {
  if (!routeData) return null;
  const { segments = [], total_fare, total_time_min, message } = routeData;

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
      {/* Header */}
      <div className="px-4 py-3 bg-purple-50 border-b border-purple-100">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-purple-900">{message || "Route found"}</p>
          {routeData.biyahe_score != null && (
            <span className="text-[10px] font-bold bg-purple-200 text-purple-900 px-2 py-0.5 rounded-full" title="Biyahe Score — composite rating based on time, cost, hassle, safety, reliability, and community preference">
              🏷️ {(typeof routeData.biyahe_score === 'object' ? routeData.biyahe_score.biyahe_score : routeData.biyahe_score) * 100:.0f}%
            </span>
          )}
        </div>
        <div className="flex gap-4 mt-1 text-xs text-purple-700">
          <span>⏱ {total_time_min} min</span>
          <span>💰 ₱{total_fare}</span>
          <span>🔄 {segments.filter((s) => s.is_transfer).length} transfer(s)</span>
        </div>
      </div>

      {/* Segments with connectors */}
      <div className="px-4 py-2">
        {segments.map((seg, i) => {
          const isWalk = seg.is_transfer || seg.type === "walk";
          const isLast = i === segments.length - 1;
          const emoji = isWalk ? "🚶" : seg.type === "train" || seg.type === "lrt" || seg.type === "mrt" ? "🚆" : "🚌";
          const bg = isWalk ? "bg-gray-100" : "bg-purple-50";
          const textColor = isWalk ? "text-gray-600" : "text-purple-900";

          return (
            <div key={i}>
              {/* Connector line from previous segment */}
              {i > 0 && (
                <div className="flex justify-center py-0.5">
                  <div className="w-0.5 h-4 bg-gray-300 rounded" />
                </div>
              )}

              {/* Segment row */}
              <div className={`flex items-center gap-3 px-3 py-2.5 rounded-lg ${bg}`}>
                <span className="text-lg shrink-0">{emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${textColor}`}>
                    {isWalk
                      ? isLast ? "Walk to destination" : "Walk transfer"
                      : seg.route || "Transit"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {seg.time_min} min · {seg.distance_m}m{!isWalk ? ` · ₱${seg.fare}` : ""}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
