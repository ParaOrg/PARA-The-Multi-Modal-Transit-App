/**
 * TripSummaryCard.jsx — Figma-perfect route cards with dual-tone left pill,
 * inline Byahe Score badge, and proper alternative route hierarchy.
 */

export default function TripSummaryCard({ routeData, isRecommended = false, rank = 0 }) {
  if (!routeData) return null;
  const { segments = [], total_fare, total_time_min, biyahe_score } = routeData;
  
  // Extract numeric score
  const score = typeof biyahe_score === "object" ? biyahe_score?.biyahe_score : biyahe_score;
  const scorePercent = score != null ? Math.round(score * 100) : null;

  // Card background
  const cardBg = isRecommended ? "bg-[#7A4BC81A]" : "bg-white";
  const cardShadow = isRecommended ? "" : "shadow-[0px_4px_6px_rgba(0,0,0,0.05)]";
  
  // Left pill — dual-tone gradient for recommended, solid for alternatives
  const pillGradient = isRecommended
    ? "linear-gradient(to right, #4B2885 50%, #7A4BC8 50%)"
    : "#7A4BC8";

  return (
    <div className={`${cardBg} ${cardShadow} rounded-2xl overflow-hidden border border-gray-100`}>
      <div className="flex" style={{ gap: "12px" }}>
        {/* Left pill bar */}
        <div
          className="shrink-0 rounded-l-2xl"
          style={{
            width: "6px",
            background: pillGradient,
            minHeight: "100%",
          }}
        />

        {/* Content */}
        <div className="flex-1 py-3 pr-3 space-y-2">
          {/* Title row with Byahe Score badge */}
          <div className="flex items-center justify-between">
            <p className="text-[#381D65] text-xs font-bold">
              {isRecommended ? "Recommended" : `Alternative ${rank}`}
            </p>
            {scorePercent != null && (
              <span
                className="shrink-0 text-[11px] font-bold"
                style={{
                  backgroundColor: "#F3E8FF",
                  color: "#7A4BC8",
                  padding: "4px 8px",
                  borderRadius: "12px",
                  fontSize: "0.7rem",
                }}
              >
                ⚡ {scorePercent}%
              </span>
            )}
          </div>

          {/* Transit icons row */}
          <div className="flex items-center gap-1">
            {segments.filter(seg => seg.distance_m > 0 || !seg.is_transfer).map((seg, i) => {
              const isWalk = seg.is_transfer || seg.type === "walk";
              const emoji = isWalk ? "🚶" : seg.type === "train" || seg.type === "lrt" || seg.type === "mrt" ? "🚆" : "🚌";
              return (
                <div key={i} className="flex items-center">
                  <span className="text-sm">{emoji}</span>
                  {i < segments.length - 1 && (
                    <div className="w-3 h-[1px] bg-[#D1B6FC] mx-0.5" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Route title */}
          <p className="text-[#381D65] text-sm font-bold">
            {segments.map((seg) => {
              const isWalk = seg.is_transfer || seg.type === "walk";
              return isWalk ? "Walk" : (seg.route || "Transit");
            }).join(" + ")} ({total_time_min} min total)
          </p>

          {/* Step-by-step breakdown — skip zero walks */}
          <div className="text-[#381D65] text-[11px] leading-relaxed space-y-0.5">
            {segments.filter(seg => seg.distance_m > 0 || !seg.is_transfer).map((seg, i) => {
              const isWalk = seg.is_transfer || seg.type === "walk";
              const dist = seg.distance_display || (seg.distance_m >= 1000
                ? (seg.distance_m / 1000).toFixed(1) + " km"
                : seg.distance_m + "m");
              return (
                <p key={i}>
                  {isWalk
                    ? `Walk ${seg.time_min} min (${dist})`
                    : `${seg.route || "Transit"} ${seg.time_min} min`}
                </p>
              );
            })}
          </div>

          {/* Inline footer emojis */}
          <div className="flex items-center gap-3 text-[11px] text-[#381D65] pt-1 border-t border-gray-100">
            <span>💰 ₱{total_fare}</span>
            <span>⏱ {total_time_min} min</span>
            <span>🌤️ Mostly sheltered</span>
          </div>
        </div>
      </div>
    </div>
  );
}


/**
 * RouteCardList.jsx — Renders primary + alternative routes in a stack.
 */
export function RouteCardList({ routeData, alternatives = [] }) {
  if (!routeData) return null;

  return (
    <div className="flex flex-col" style={{ gap: "12px" }}>
      {/* Primary route — recommended, highest score */}
      <TripSummaryCard routeData={routeData} isRecommended />

      {/* Alternative routes */}
      {alternatives.map((alt, i) => (
        <TripSummaryCard key={i} routeData={alt} rank={i + 1} />
      ))}
    </div>
  );
}
