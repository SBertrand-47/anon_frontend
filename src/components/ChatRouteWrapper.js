// ChatRouteWrapper.js (example)
import { useLocation } from "react-router-dom";
import Chat from "./Chat";

export default function ChatRouteWrapper() {
  const location = useLocation();
  // Suppose you stored partnerCode in location.state
  const { partnerCode } = location.state || {};

  // Pass partnerCode as the "countryCode" prop to Chat
  return <Chat countryCode={partnerCode} />;
}
