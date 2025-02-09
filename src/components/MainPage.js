// MainPage.js
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "./Header";
import CountrySelector from "./CountrySelector";
import StartButton from "./StartButton";
import { FaExclamationTriangle } from "react-icons/fa";

export default function MainPage() {
  const [myCode, setMyCode] = useState("");         // <--- Geolocated country code (USER’s code)
  const [partnerCode, setPartnerCode] = useState(""); 
  const [selectedPartner, setSelectedPartner] = useState(""); // For display in the dropdown
  const [error, setError] = useState(false);
  const navigate = useNavigate();

  // 1) On mount, fetch user’s location based on IP
  useEffect(() => {
    async function fetchMyLocation() {
      try {
        // For example, use ipapi.co (free tier for testing)
        // You could also use ipregistry, ipify, etc.
        const response = await fetch("https://ipapi.co/json/");
        if (!response.ok) {
          throw new Error("Failed to fetch IP-based location");
        }
        const data = await response.json();
        // data.country_code typically returns "US", "ET", "RW", etc.
        setMyCode(data.country_code || "");
      } catch (err) {
        console.error("Geolocation fetch error:", err);
        // fallback or keep myCode as empty
      }
    }
    fetchMyLocation();
  }, []);

  // 2) When the user picks a partner’s country from the dropdown
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
    // This is the code for the PARTNER they want to talk to
    setPartnerCode(countryMap[countryName] || "");
  };

  // 3) On Start, navigate to /webviewer, passing both myCode + partnerCode
  const handleStart = () => {
    if (!selectedPartner) {
      setError(true);
      return;
    }
    navigate("/webviewer", {
      state: {
        myCode: myCode,             // user’s own country (auto-detected)
        partnerCode: partnerCode,   // the partner’s country
      },
    });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen pt-[80px] space-y-6 bg-gray-100">
      {/* Header at top (already fixed in your code) */}
      <Header />

      {/* Content below header */}
      <div className="flex flex-col items-center justify-center space-y-6 w-full">
        <CountrySelector onSelect={handleCountrySelect} />

        {/* Error Message if user hasn’t chosen partner’s country */}
        {error && (
          <div className="flex items-center text-red-500 text-sm">
            <FaExclamationTriangle className="mr-2" />
            Please select a partner’s country before starting.
          </div>
        )}

        {/* Start Button */}
        <StartButton onClick={handleStart} disabled={!selectedPartner} />
      </div>

      {/* Debug info (optional) */}
      {myCode ? (
        <p className="text-gray-600 text-sm mt-4">
          Your location (based on IP) is: <strong>{myCode}</strong>
        </p>
      ) : (
        <p className="text-gray-600 text-sm mt-4">
          Attempting to detect your location...
        </p>
      )}
    </div>
  );
}
