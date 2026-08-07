import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";

import Home from "./pages/Home";
import HomeNew from "./pages/HomeNew";
import SearchResults from "./pages/SearchResults";
import RoutesExplorer from "./pages/RoutesExplorer";
import Community from "./pages/Community";
import AdminDashboard from "./pages/AdminDashboard";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import About from "./pages/About";
import GasPrices from "./pages/GasPrices";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<HomeNew />} />
        <Route path="/explore" element={<RoutesExplorer />} />
        <Route path="/community" element={<Community />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/about" element={<About />} />
        <Route path="/gas-prices" element={<GasPrices />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
