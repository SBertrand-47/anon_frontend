//CountrySelector.js
import { useState } from "react";
import * as AllCountries from "country-flag-icons/react/3x2";
import { US } from "country-flag-icons/react/3x2";
import { FaGlobe, FaQuestionCircle, FaFlag } from "react-icons/fa";

const countries = [
  { name: "Ethiopia", code: "ET" },
  { name: "Rwanda", code: "RW" },
  { name: "Diaspora", code: "globe" },
  { name: "Random", code: "random" },
  { name: "United States", code: "US" },
];

export default function CountrySelector({ onSelect }) {
  const [selected, setSelected] = useState("");

  const handleChange = (event) => {
    const value = event.target.value;
    setSelected(value);
    onSelect(value); // Notify parent
  };

  const getFlagComponent = (countryCode) => {
    if (countryCode === "globe") return <FaGlobe className="text-3xl text-blue-500" />;
    if (countryCode === "random") return <FaQuestionCircle className="text-3xl text-yellow-500" />;
    if (countryCode === "US") return <US title="United States" width="48" height="32" />;

    const CountryFlag = AllCountries[countryCode];
    return CountryFlag ? <CountryFlag title={countryCode} width="48" height="32" /> : <FaFlag className="text-3xl text-gray-400" />;
  };

  const selectedCountryObj = countries.find((c) => c.name === selected);

  return (
    <div className="flex flex-col items-center space-y-6 p-4 bg-white shadow-lg rounded-xl border border-gray-200 max-w-md">
      <label className="text-lg font-semibold text-gray-700">🌍 Select a Country</label>

      {/* Dropdown */}
      <div className="relative w-full">
        <select
          value={selected}
          onChange={handleChange}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 font-medium"
          aria-label="Select a country"
        >
          <option value="" disabled>
            Select a country...
          </option>
          {countries.map((country) => (
            <option key={country.code} value={country.name}>
              {country.name}
            </option>
          ))}
        </select>
      </div>

      {/* Selected Country Display */}
      {selected && selectedCountryObj && (
        <div className="flex items-center space-x-3 bg-gray-100 p-3 rounded-lg shadow-sm border border-gray-300">
          {getFlagComponent(selectedCountryObj.code)}
          <span className="text-lg font-semibold text-gray-700">{selected}</span>
        </div>
      )}
    </div>
  );
}
