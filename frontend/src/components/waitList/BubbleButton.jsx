// Main bubble button component
export function BubbleButton({ onClick, isOpen }) {
  return (
    <button
        onClick={onClick}
        className={`mx-auto inline-flex min-w-[11.5rem] h-12 px-5 sm:min-w-[12.5rem] sm:h-14 sm:px-6 rounded-full shadow-lg items-center justify-center text-center transition-all duration-300 hover:scale-105 ${
          isOpen
            ? 'bg-gray-600 hover:bg-gray-700'
            : 'bg-purple-900 hover:bg-pink-700'
        }`}
      >
        {isOpen ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 sm:h-6 sm:w-6 text-white"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        ) : (
          <span className="text-white text-sm sm:text-base font-semibold tracking-wide leading-none whitespace-nowrap">
            Join the Waitlist!
          </span>
        )}
      </button>
  );
}
