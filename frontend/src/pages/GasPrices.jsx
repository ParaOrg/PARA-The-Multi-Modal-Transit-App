import Navbar from "../components/Navbar";

export default function GasPrices() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <span className="text-6xl">⛽</span>
        <h1 className="text-3xl font-black text-gray-900 mt-4 mb-2">Gas Prices</h1>
        <p className="text-gray-500 text-lg mb-8">
          Real-time fuel price monitoring across Metro Manila.
        </p>
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 inline-block">
          <span className="text-2xl">🚧</span>
          <p className="text-yellow-800 font-bold mt-2">Under Construction</p>
          <p className="text-yellow-600 text-sm mt-1">Gas price tracking is coming soon. Stay tuned!</p>
        </div>
      </div>
    </div>
  );
}
