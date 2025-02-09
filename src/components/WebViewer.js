//WebViewer.js
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import * as AllCountries from "country-flag-icons/react/3x2";
import { US } from "country-flag-icons/react/3x2";
import { FaVideo, FaStepForward, FaStopCircle } from "react-icons/fa";


export default function WebViewer() {
  const location = useLocation();
  const navigate = useNavigate();

  // Read your auto-detected code + chosen partner code from MainPage
  const { myCode, partnerCode } = location.state || {};

  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  console.log("User’s own country code:", myCode);
  console.log("Partner’s code for matching:", partnerCode);

  // Helper to get the correct flag icon
  const getFlagComponent = (countryCode) => {
    if (countryCode === "globe") return <span>🌐</span>;
    if (countryCode === "random") return <span>❓</span>;
    if (countryCode === "US") {
      return <US title="United States" width="48" height="32" />;
    }
    const CountryFlag = AllCountries[countryCode];
    return CountryFlag ? (
      <CountryFlag title={countryCode} width="48" height="32" />
    ) : (
      <span>Flag not found</span>
    );
  };

  // Start camera + mic
  const startStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setError(null);
    } catch (err) {
      console.error("Error accessing media devices:", err);
      if (retryCount < maxRetries) {
        setError(
          `We had an error. Retrying... (attempt ${retryCount + 2} of ${maxRetries})`
        );
        setRetryCount(retryCount + 1);
      } else {
        setError("We tried several times but could not access the camera/mic.");
      }
    }
  };

  // Start on mount
  useEffect(() => {
    startStream();
    return () => {
      // Cleanup on unmount
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  // Retry logic
  useEffect(() => {
    if (retryCount > 0 && retryCount <= maxRetries) {
      const timer = setTimeout(() => {
        startStream();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [retryCount]);

  // Clear error once video starts
  useEffect(() => {
    const videoElem = videoRef.current;
    if (videoElem) {
      const handlePlaying = () => setError(null);
      videoElem.addEventListener("playing", handlePlaying);
      return () => {
        videoElem.removeEventListener("playing", handlePlaying);
      };
    }
  }, []);

  // Stop stream
  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    navigate("/");
  };

  const handleSkip = () => {
    console.log("Skipping to the next person…");
    // You’d close WebSocket + re-initialize if you want a brand new match
  };

  return (
    <div className="flex w-full max-w-7xl mx-auto">
      {/* LEFT SECTION: video + partner placeholder */}
      <div className="flex-1 p-6 bg-white shadow-lg rounded-2xl border border-gray-200 m-2">
        {/* Heading */}
        <h2 className="text-xl font-bold text-gray-700 flex items-center space-x-2 mb-4">
          <FaVideo />
          <span>Live Video</span>
        </h2>

        {/* Error message (if any) */}
        {error && (
          <div className="text-red-500 text-center px-4 mb-2">
            {error}
          </div>
        )}

        {/* Two-column layout: left column is the Video, right column is the spinner */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
          {/* Video Column */}
          <div className="bg-gray-300 flex items-center justify-center rounded-lg overflow-hidden shadow-md">
            <video ref={videoRef} autoPlay playsInline className="w-full h-full" />
          </div>

          {/* Partner Placeholder Column */}
          <div className="bg-gray-200 flex flex-col items-center justify-center rounded-lg shadow-md text-gray-600 text-lg font-medium p-4">
            {partnerCode ? (
              <div className="flex flex-col items-center space-y-3">
                <span>
                  We are finding someone from {getFlagComponent(partnerCode)}
                </span>
                <div className="flex items-center space-x-2">
                  {/* Spinner */}
                  <svg
                    className="animate-spin h-5 w-5 text-gray-600"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4l3-3-3-3v4
                         a8 8 0 000 16v-4l-3 3 3 3v-4
                         a8 8 0 01-8-8z"
                    />
                  </svg>
                  <span>Loading…</span>
                </div>
              </div>
            ) : (
              <div>No partner country selected</div>
            )}
          </div>
        </div>

        {/* Skip / Stop Buttons */}
        <div className="flex space-x-3 mt-4">
          <button
            onClick={handleSkip}
            className="px-6 py-3 text-white font-semibold bg-yellow-500 hover:bg-yellow-600 rounded-xl shadow-md transition duration-300 flex items-center space-x-2"
          >
            <FaStepForward />
            <span>Skip</span>
          </button>
          <button
            onClick={stopStream}
            className="px-6 py-3 text-white font-semibold bg-red-600 hover:bg-red-700 rounded-xl shadow-md transition duration-300 flex items-center space-x-2"
          >
            <FaStopCircle />
            <span>Stop</span>
          </button>
        </div>
      </div>
    </div>
  );
}
