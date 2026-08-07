import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./index.css";
// Simple GPS tracking - no map dependency
if (navigator.geolocation) {
  navigator.geolocation.watchPosition(
    (pos) => {
      window.__userLocation = [pos.coords.latitude, pos.coords.longitude];
    },
    () => {},
    { enableHighAccuracy: true, maximumAge: 5000 }
  );
}


ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
