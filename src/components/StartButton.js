//StartButton.js
import { FaPlay } from "react-icons/fa";

export default function StartButton({ onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center space-x-2 px-6 py-3 font-semibold rounded-xl shadow-md transition duration-300 ${
        disabled
          ? "bg-gray-400 cursor-not-allowed text-gray-200"
          : "bg-blue-600 hover:bg-blue-700 text-white"
      }`}
    >
      <FaPlay />
      <span>Start</span>
    </button>
  );
}
