/**
 * TripSummaryCard.jsx — Route cards with dual-tone left edge, score-based styling.
 */
export default function TripSummaryCard({ routeData, isRecommended = false, rank = 0 }) {
  if (!routeData) return null;
  const { segments = [], total_fare, total_time_min, biyahe_score } = routeData;
  const score = typeof biyahe_score === "object" ? biyahe_score.biyahe_score : biyahe_score;
  const bg = isRecommended ? "bg-[#7A4BC81A]" : "bg-white";
  const edge = isRecommended ? "bg-[#7A4BC8]" : "bg-[#D1B6FC]";
  const innerEdge = isRecommended ? "bg-[#D1B6FC]" : "bg-[#E6D6FF]";

  return (
    <div className={`${bg} rounded-2xl overflow-hidden border border-gray-100`}>
      <div className="flex">
        {/* Dual-tone left edge pill */}
        <div className="flex shrink-0">
          <div className={`w-[4px] ${edge} rounded-l-xl`} />
          <div className={`w-[7px] ${innerEdge}`} />
        </div>
        
        <div className="flex-1 px-3 py-2.5 space-y-2">
          {/* Segment cards */}
          {segments.map((seg, i) => {
            const isWalk = seg.is_transfer || seg.type === "walk";
            const emoji = isWalk ? "🚶" : seg.type === "train" || seg.type === "lrt" || seg.type === "mrt" ? "🚆" : "🚌";
            const dist = seg.distance_display || (seg.distance_m >= 1000 ? (seg.distance_m/1000).toFixed(1) + " km" : seg.distance_m + "m");
            return (
              <div key={i} className="flex items-center gap-2">
                <span className="text-sm shrink-0">{emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[#381D65] text-[11px] font-bold leading-tight">
                    {isWalk ? `Walk ${seg.time_min} min` : `${seg.route || "Transit"} (${seg.time_min} min)`}
                  </p>
                  <p className="text-[#381D65] text-[10px] leading-tight">
                    {dist}{!isWalk ? ` · ₱${seg.fare}` : ""}
                  </p>
                </div>
                <span className="text-[#7A4BC8] text-[10px] font-bold shrink-0">{seg.time_min}min</span>
              </div>
            );
          })}

          {/* Bottom bar with inline emojis */}
          <div className="flex items-center justify-between pt-1 border-t border-gray-100">
            <div className="flex gap-2 text-[10px] text-[#381D65]">
              <span>💰 ₱{total_fare}</span>
              <span>⏱ {total_time_min} min</span>
              {score != null && <span>⭐ {Math.round(score * 100)}%</span>}
            </div>
            {isRecommended && (
              <span className="text-[10px] font-bold text-[#7A4BC8] bg-[#7A4BC81A] px-2 py-0.5 rounded-full">Best</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}