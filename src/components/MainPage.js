import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import CountrySelector from "../components/CountrySelector";
import StartButton from "../components/StartButton";
import { FaExclamationTriangle, FaSpinner } from "react-icons/fa";

export default function MainPage() {
  const [myCode, setMyCode] = useState(""); // User's auto-detected country code
  const [partnerCode, setPartnerCode] = useState("");
  const [selectedPartner, setSelectedPartner] = useState(""); // Display name from dropdown
  const [error, setError] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(true);
  const navigate = useNavigate();

  // Auto-detect location on mount.
  useEffect(() => {
    async function fetchMyLocation() {
      try {
        const response = await fetch("https://ipapi.co/json/");
        if (!response.ok) throw new Error("Failed to fetch IP-based location");
        const data = await response.json();
        setMyCode(data.country_code || "");
      } catch (err) {
        console.error("Geolocation fetch error:", err);
      } finally {
        setLoadingLocation(false);
      }
    }
    fetchMyLocation();
  }, []);

  const handleCountrySelect = (countryName) => {
    setSelectedPartner(countryName);
    setError(false);
    const countryMap = {
      Ethiopia: "ET",
      Rwanda: "RW",
      Diaspora: "globe",
      Random: "random",
      "United States": "US",
    };
    setPartnerCode(countryMap[countryName] || "");
  };

  const handleStart = () => {
    if (!selectedPartner || !myCode) {
      setError(true);
      return;
    }
    // Generate a unique clientId using the browser's crypto API.
    const clientId = crypto.randomUUID();
    navigate("/webviewer", {
      state: { myCode, partnerCode, clientId },
    });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen pt-[80px] space-y-6 bg-gray-100">
      <Header />
      <div className="flex flex-col items-center justify-center space-y-6 w-full">
        <CountrySelector onSelect={handleCountrySelect} />
        {error && (
          <div className="flex items-center text-red-500 text-sm">
            <FaExclamationTriangle className="mr-2" />
            Please select a partner’s country before starting.
          </div>
        )}
        <StartButton onClick={handleStart} disabled={!selectedPartner || !myCode} />
      </div>
      <div className="mt-4">
        {loadingLocation ? (
          <div className="flex items-center space-x-2 text-gray-600">
            <FaSpinner className="animate-spin" />
            <span>Detecting your location...</span>
          </div>
        ) : myCode ? (
          <p className="text-gray-600 text-sm">
            Your location (based on IP) is: <strong>{myCode}</strong>
          </p>
        ) : (
          <p className="text-gray-600 text-sm">Could not detect your location.</p>
        )}
      </div>
    </div>
  );
}
