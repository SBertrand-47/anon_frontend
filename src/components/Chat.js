import { useState, useRef, useEffect, useContext } from "react";
import { SessionContext } from "../SessionContext";
import { FaPaperPlane, FaSpinner } from "react-icons/fa";

export default function Chat({ partnerCode, myCode, clientId }) {
  const { chatMatched, setChatMatched } = useContext(SessionContext);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const websocketRef = useRef(null);
  const chatEndRef = useRef(null);
  const [wsError, setWsError] = useState(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!partnerCode) {
      setWsError("No partner code provided!");
      return;
    }
    const wsProtocol = window.location.protocol === "https:" ? "wss" : "ws";
    let wsUrl = `${wsProtocol}://anonafrica.fly.dev/ws/${partnerCode}`;
    // For diaspora matching, add myCode.
    if (partnerCode === "globe" && myCode) {
      wsUrl += `?myCountry=${myCode}`;
    }
    // Append clientId (if not already in URL).
    wsUrl += wsUrl.includes('?') ? `&clientId=${clientId}` : `?clientId=${clientId}`;
    const ws = new WebSocket(wsUrl);
    websocketRef.current = ws;

    ws.onopen = () => {
      console.log("Chat WebSocket connected");
      setWsError(null);
    };

    ws.onmessage = (event) => {
      console.log("Received from server (chat):", event.data);
      if (
        event.data.includes("Matched with a stranger") ||
        event.data.includes("Connecting now")
      ) {
        setChatMatched(true);
        setMessages((prev) => [...prev, { text: event.data, sender: "system" }]);
      } else if (event.data.includes("partner disconnected")) {
        setChatMatched(false);
        setMessages((prev) => [...prev, { text: event.data, sender: "system" }]);
      } else if (event.data.includes("partner_skipped")) {
        setMessages((prev) => [
          ...prev,
          {
            text: "Your partner skipped the session. Searching for a new partner...",
            sender: "system",
          },
        ]);
      } else {
        setMessages((prev) => [...prev, { text: event.data, sender: "other" }]);
      }
    };

    ws.onerror = (error) => {
      console.error("Chat WebSocket error:", error);
      setWsError("WebSocket encountered an error.");
    };

    ws.onclose = () => {
      console.log("Chat WebSocket closed");
    };

    return () => {
      ws.close();
    };
  }, [partnerCode, myCode, clientId, setChatMatched]);

  const sendMessage = () => {
    if (!input.trim()) return;
    if (!websocketRef.current || websocketRef.current.readyState !== WebSocket.OPEN) {
      console.error("WebSocket is not open. Cannot send message.");
      return;
    }
    setMessages((prev) => [...prev, { text: input, sender: "user" }]);
    websocketRef.current.send(input);
    setInput("");
    setIsTyping(false);
  };

  return (
    <div className="flex flex-col h-96 w-full max-w-md bg-white border border-gray-300 rounded-lg shadow-lg p-4 space-y-4">
      <div className="text-center text-lg font-semibold text-gray-700 pb-3 border-b">Chat Room</div>
      {wsError && <div className="text-red-500 text-center mb-2">{wsError}</div>}
      {(!chatMatched && !wsError) && (
        <div className="flex items-center justify-center text-blue-500 mb-2 space-x-2">
          <FaSpinner className="animate-spin" />
          <span>Waiting for chat partner...</span>
        </div>
      )}
      <div className="flex-1 overflow-y-auto space-y-2 p-2">
        {messages.length === 0 ? (
          <p className="text-gray-500 text-center">Start a conversation...</p>
        ) : (
          messages.map((msg, index) => (
            <div key={index} className={`p-3 rounded-2xl max-w-[75%] ${
              msg.sender === "user"
                ? "bg-blue-500 text-white self-end"
                : msg.sender === "system"
                ? "bg-green-300 text-gray-800 self-center"
                : "bg-gray-300 text-gray-800 self-start"
            }`}>
              {msg.text}
            </div>
          ))
        )}
        <div ref={chatEndRef} />
      </div>
      {isTyping && (
        <div className="text-gray-400 text-sm italic text-center">Typing...</div>
      )}
      <div className="flex items-center border-t border-gray-200 p-2">
        <input
          type="text"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setIsTyping(e.target.value.length > 0);
          }}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Type a message..."
          className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={!chatMatched}
        />
        <button
          onClick={sendMessage}
          disabled={!chatMatched}
          className="ml-2 p-3 bg-blue-500 hover:bg-blue-600 text-white rounded-full"
        >
          <FaPaperPlane className="text-lg" />
        </button>
      </div>
    </div>
  );
}
