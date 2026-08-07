import { useEffect, useRef, useState } from "react";

export default function SearchInput({
  value,
  onChange,
  onSubmit,
  onFocus,
  apiKey
}) {
  const inputRef = useRef(null);
  const autocompleteRef = useRef(null);
  const [predictions, setPredictions] = useState([]);
  const [showPredictions, setShowPredictions] = useState(false);
  const autocompleteServiceRef = useRef(null);
  const [isApiLoaded, setIsApiLoaded] = useState(false);

  useEffect(() => {
    // Check if Google Maps API is loaded
    const checkGoogleMaps = () => {
      if (window.google && window.google.maps && window.google.maps.places) {
        autocompleteServiceRef.current = new window.google.maps.places.AutocompleteService();
        setIsApiLoaded(true);
        console.log("[SearchInput] Google Places Autocomplete initialized");
      } else {
        // Retry after a short delay if not loaded yet
        setTimeout(checkGoogleMaps, 500);
      }
    };

    checkGoogleMaps();
  }, []);

  // Handle input change and fetch predictions
  const handleInputChange = (e) => {
    const newValue = e.target.value;
    onChange(e);

    if (newValue.trim() === "") {
      setPredictions([]);
      setShowPredictions(false);
      return;
    }

    // Fetch autocomplete predictions
    if (autocompleteServiceRef.current) {
      autocompleteServiceRef.current.getPlacePredictions(
        {
          input: newValue,
          // Optional: Add bias towards Philippines if needed
          componentRestrictions: { country: "ph" }
        },
        (predictions, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
            setPredictions(predictions);
            setShowPredictions(true);
          } else {
            setPredictions([]);
            setShowPredictions(false);
          }
        }
      );
    }
  };

  // Handle prediction selection
  const handlePredictionSelect = (prediction) => {
    const selectedValue = prediction.description;

    // Update the input value
    onChange({ target: { value: selectedValue } });
    setPredictions([]);
    setShowPredictions(false);

    // Auto-submit with the selected value directly
    // Use a longer timeout to ensure state updates
    if (onSubmit) {
      setTimeout(() => {
        // Create a custom event with the selected value
        const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
        submitEvent.searchValue = selectedValue;
        onSubmit(submitEvent);
      }, 200);
    }
  };

  // Handle input focus
  const handleFocus = (e) => {
    if (onFocus) {
      onFocus(e);
    }
    if (value.trim() !== "" && predictions.length > 0) {
      setShowPredictions(true);
    }
  };

  // Close predictions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (autocompleteRef.current && !autocompleteRef.current.contains(e.target)) {
        setShowPredictions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={autocompleteRef}>
      <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleInputChange}
        onFocus={handleFocus}
        placeholder="Where do you want to go?"
        className="w-full pl-12 pr-12 py-3 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 text-gray-800"
        autoComplete="off"
      />
      <button
        type="button"
        className="absolute right-4 top-1/2 -translate-y-1/2 z-10"
      >
        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
        </svg>
      </button>

      {/* Autocomplete Predictions Dropdown */}
      {showPredictions && predictions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-100 max-h-64 overflow-y-auto z-50">
          {predictions.map((prediction, idx) => (
            <button
              key={prediction.place_id}
              type="button"
              onClick={() => handlePredictionSelect(prediction)}
              className="flex items-start gap-3 w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-b-0"
            >
              <svg className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800">
                  {prediction.structured_formatting.main_text}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {prediction.structured_formatting.secondary_text}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
