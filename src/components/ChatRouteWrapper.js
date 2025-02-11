import { useLocation } from "react-router-dom";
import Chat from "../components/Chat";

export default function ChatRouteWrapper() {
  const location = useLocation();
  const { partnerCode, myCode, clientId } = location.state || {};
  return <Chat partnerCode={partnerCode} myCode={myCode} clientId={clientId} />;
}
