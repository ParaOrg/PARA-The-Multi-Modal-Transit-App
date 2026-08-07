import loopGif from "../assets/images/loop.gif";

export default function GasPricePage() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${loopGif})` }}>
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative z-10 text-center px-6">
        <div className="bg-white/95 backdrop-blur-md rounded-3xl p-8 shadow-2xl max-w-md">
          <span className="text-5xl">⛽</span>
          <h1 className="text-2xl font-extrabold text-gray-800 mt-4">Gas Prices</h1>
          <p className="text-gray-500 mt-2 text-sm">Crowdsourced fuel prices across the Philippines.</p>
          <div className="mt-6 inline-block bg-purple-100 text-purple-800 px-4 py-2 rounded-full text-sm font-bold">
            🚧 Under Construction
          </div>
          <p className="text-xs text-gray-400 mt-4">Community price reporting coming soon.</p>
        </div>
      </div>
    </div>
  );
}