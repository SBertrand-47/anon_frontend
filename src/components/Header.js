//Header.js
import { FaGlobeAfrica } from "react-icons/fa";

export default function Header() {
  return (
    <header className="fixed top-0 left-0 w-full bg-gradient-to-r from-blue-700 via-purple-600 to-blue-900 shadow-lg py-5 z-50 backdrop-blur-md bg-opacity-80 border-b border-blue-400/30">
      <div className="max-w-5xl mx-auto flex items-center justify-center space-x-3">
        {/* Logo Icon */}
        <FaGlobeAfrica className="text-white text-4xl animate-pulse" />

        {/* Title */}
        <h1 className="text-white text-4xl font-extrabold tracking-wide drop-shadow-lg">
          Anon<span className="text-yellow-300">Africa</span>
        </h1>
      </div>
    </header>
  );
}
