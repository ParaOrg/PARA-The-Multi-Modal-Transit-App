/**
 * RouteSteps - Display detailed step-by-step route instructions
 * Matches Figma "Route Overview" design
 */
import { useState } from "react";

export default function RouteSteps({ markers, lines, response, onBack }) {
  const [showCommuterTips, setShowCommuterTips] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  if (!lines || lines.length === 0) {
    return null;
  }

  // Get destination info
  const destination = markers && markers.length > 1 ? markers[markers.length - 1] : null;
  const origin = markers && markers.length > 0 ? markers[0] : null;

  // Group consecutive lines of the same type into steps
  const steps = [];
  let currentStep = null;

  lines.forEach((line) => {
    if (!currentStep || currentStep.type !== line.type) {
      // Start new step
      if (currentStep) {
        steps.push(currentStep);
      }
      currentStep = {
        type: line.type,
        name: line.name || `${line.type} Route`,
        color: line.color,
        points: [...line.points],
        stepNumber: steps.length + 1
      };
    } else {
      // Extend current step
      currentStep.points.push(...line.points);
    }
  });

  if (currentStep) {
    steps.push(currentStep);
  }

  // Calculate total fare
  const totalFare = steps.reduce((sum, step) => {
    return sum + estimateFare(step.type);
  }, 0);

  // Minimized view
  if (isMinimized) {
    return (
      <div className="absolute left-0 right-0 bottom-0 bg-white z-30 rounded-t-3xl shadow-2xl">
        <div
          className="p-4 cursor-pointer"
          onClick={() => setIsMinimized(false)}
        >
          {/* Drag Handle */}
          <div className="flex justify-center mb-3">
            <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-800 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-800">{destination?.name || "Destination"}</h3>
                <p className="text-xs text-gray-500">{steps.length} steps • ₱{totalFare}</p>
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onBack) onBack();
              }}
              className="p-2 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Full view
  return (
    <>
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/20 z-25"
        onClick={() => setIsMinimized(true)}
      />

      {/* Bottom Sheet */}
      <div className="absolute left-0 right-0 bottom-0 bg-white z-30 rounded-t-3xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Drag Handle */}
        <div
          className="flex justify-center pt-3 pb-2 cursor-pointer"
          onClick={() => setIsMinimized(true)}
        >
          <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
        </div>

        {/* Header */}
        <div className="flex items-center gap-3 px-4 pb-3 border-b border-gray-100">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (onBack) {
                onBack();
              } else {
                setIsMinimized(true);
              }
            }}
            className="p-2 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="text-base font-medium text-gray-800 flex-1">Route Details</h2>
          <button className="p-2 hover:bg-gray-50 rounded-lg transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </button>
          <button className="p-2 hover:bg-gray-50 rounded-lg transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-4 pb-24">
        {/* Destination Section */}
        {destination && (
          <div className="py-4 border-b border-gray-100">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-purple-800 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-800">{destination.name}</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Estimated arrival time: {Math.ceil(steps.length * 15)}-{Math.ceil(steps.length * 20)} minutes
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Nearby Landmark (if available) */}
        {response && (
          <div className="py-3 border-b border-gray-100">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-600">{response}</p>
              </div>
            </div>
          </div>
        )}

        {/* Route Outline */}
        <div className="py-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-base font-semibold text-gray-800">Route Outline</h4>
            <button className="text-sm text-purple-600 hover:text-purple-700">
              See Weather Analysis
            </button>
          </div>

          {/* Start */}
          <div className="relative pb-6">
            <div className="absolute left-4 top-10 bottom-0 w-0.5 bg-gray-200" />
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 z-10">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <circle cx="10" cy="10" r="3" />
                </svg>
              </div>
              <div className="flex-1 pt-1">
                <p className="text-sm font-semibold text-gray-800">Start</p>
                <p className="text-xs text-gray-500 mt-1">
                  {origin?.name || "Current location"}
                </p>
              </div>
            </div>
          </div>

          {/* Transport Steps */}
          {steps.map((step, index) => (
            <div key={index} className="relative pb-6">
              {index < steps.length - 1 && (
                <div className="absolute left-4 top-12 bottom-0 w-0.5 bg-gray-200" />
              )}
              <div className="flex items-start gap-3">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white text-lg z-10"
                  style={{ backgroundColor: step.color }}
                >
                  {getTransportIcon(step.type)}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-800">{step.type}</p>
                  <p className="text-xs text-gray-600 mt-1">{step.name}</p>
                  <div className="mt-2 bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                      <p className="text-xs text-gray-700">
                        {getOnInstruction(step.type, step.name)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                      <p className="text-xs text-gray-700">
                        {getOffInstruction(step.type)}
                      </p>
                    </div>
                  </div>
                  {step.type === "Walk" && (
                    <div className="mt-2 flex gap-2">
                      <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">Vande Road</span>
                      <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">Walkable</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Destination */}
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-400 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="flex-1 pt-1">
              <p className="text-sm font-semibold text-gray-800">Destination</p>
              <p className="text-xs text-gray-500 mt-1">
                Arrived at final destination {destination?.name || ""}
              </p>
            </div>
          </div>
        </div>

        {/* Fare Breakdown */}
        <div className="py-4 border-t border-gray-100">
          <h4 className="text-base font-semibold text-gray-800 mb-4">Fare Breakdown</h4>
          <div className="space-y-3">
            {steps.map((step, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: step.color }}
                  />
                  <span className="text-sm text-gray-700">
                    {step.type} to {index < steps.length - 1 ? "Location " + (index + 2) : "Destination"}
                  </span>
                </div>
                <span className="text-sm font-medium text-gray-800">₱{estimateFare(step.type)}</span>
              </div>
            ))}
            <div className="flex items-center justify-between pt-3 border-t border-gray-200">
              <span className="text-sm font-semibold text-gray-800">Total</span>
              <span className="text-base font-bold text-gray-800">₱{totalFare}</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Actual fare may vary. ₱10 depending on exact boarding points and weather via borderless waits
            </p>
          </div>
        </div>

        {/* Commuter Tips */}
        <div className="py-4 border-t border-gray-100">
          <button
            onClick={() => setShowCommuterTips(!showCommuterTips)}
            className="flex items-center justify-between w-full text-purple-600 hover:text-purple-700"
          >
            <span className="text-sm font-medium">See Commuter Tips</span>
            <svg
              className={`w-5 h-5 transition-transform ${showCommuterTips ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {showCommuterTips && (
            <div className="mt-3 space-y-2 text-sm text-gray-600">
              <p>• Bring exact change for faster boarding</p>
              <p>• Keep valuables secure and close to your body</p>
              <p>• Arrive at stops 5-10 minutes early during peak hours</p>
              <p>• Download offline maps in case of connectivity issues</p>
            </div>
          )}
        </div>
        </div>

        {/* Start Commute Button */}
        <div className="border-t border-gray-100 p-4 bg-white">
          <button className="w-full bg-purple-600 text-white py-4 rounded-xl font-semibold text-base hover:bg-purple-700 transition-colors shadow-lg">
            Start Commute
          </button>
        </div>
      </div>
    </>
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

function getOnInstruction(type, name) {
  const instructions = {
    Jeepney: `Board ${name || "jeepney"} at the stop`,
    Bus: `Get on ${name || "bus"} at the stop`,
    Train: `Board ${name || "train"} at the station`,
    UV: `Ride UV Express at the terminal`,
    Walk: `Start walking`,
    Transit: `Board transit vehicle`
  };
  return instructions[type] || `Get on ${type}`;
}

function getOffInstruction(type) {
  const instructions = {
    Jeepney: "Alight when you reach the next transfer point",
    Bus: "Get off at the next stop",
    Train: "Exit at the next station",
    UV: "Alight at the drop-off point",
    Walk: "Continue walking to your destination",
    Transit: "Get off at the next stop"
  };
  return instructions[type] || "Get off at the next stop";
}

function estimateFare(type) {
  const fares = {
    Jeepney: 15,
    Bus: 20,
    Train: 20,
    UV: 25,
    Walk: 0,
    Transit: 20
  };
  return fares[type] || 15;
}
