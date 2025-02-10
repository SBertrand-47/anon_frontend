// Chat.js
import { useState, useRef, useEffect } from "react";
import { FaPaperPlane } from "react-icons/fa";

export default function Chat({ countryCode }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [matched, setMatched] = useState(false);
  const [wsError, setWsError] = useState(null);
  const websocketRef = useRef(null);
  const chatEndRef = useRef(null);

  // Auto-scroll on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Open WebSocket connection
  useEffect(() => {
    if (!countryCode) {
      setWsError("No country code provided!");
      return;
    }

    const wsProtocol = window.location.protocol === "https:" ? "wss" : "ws";
    const ws = new WebSocket(`${wsProtocol}://anonafrica.fly.dev/ws/${countryCode}`);
    websocketRef.current = ws;

    ws.onopen = () => {
      console.log("WebSocket connected");
      setWsError(null);
    };

    ws.onmessage = (event) => {
      console.log("Received from server:", event.data);
      // When a new match is made, clear previous messages and notify.
      if (event.data.includes("Matched with a stranger!")) {
        setMatched(true);
        setMessages([{ text: event.data, sender: "system" }]); // Clear previous chat history.
      }
      // When partner disconnects, clear chat history and show disconnect message.
      else if (event.data.includes("Your partner disconnected")) {
        setMatched(false);
        setMessages([{ text: event.data, sender: "system" }]); // Clear previous chat history.
      } else {
        setMessages((prev) => [
          ...prev,
          { text: event.data, sender: "other" }
        ]);
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      setWsError("WebSocket encountered an error.");
    };

    ws.onclose = () => {
      console.log("WebSocket closed");
    };

    return () => {
      ws.close();
    };
  }, [countryCode]);

  // Send a chat message
  const sendMessage = () => {
    if (!input.trim()) return;
    if (
      !websocketRef.current ||
      websocketRef.current.readyState !== WebSocket.OPEN
    ) {
      console.error("WebSocket is not open. Cannot send message.");
      return;
    }
    // Add to local chat immediately.
    setMessages((prev) => [...prev, { text: input, sender: "user" }]);
    websocketRef.current.send(input);
    setInput("");
    setIsTyping(false);
  };

  return (
    <div className="flex flex-col h-96 w-full max-w-md bg-white border border-gray-300 rounded-lg shadow-lg p-4">
      {/* Header */}
      <div className="text-center text-lg font-semibold text-gray-700 pb-3 border-b">
        Chat Room
      </div>

      {/* Error Display */}
      {wsError && (
        <div className="text-red-500 text-center mb-2">{wsError}</div>
      )}
      {!matched && !wsError && (
        <div className="text-blue-500 text-center mb-2">
          Waiting to be matched...
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-2 p-2 custom-scrollbar">
        {messages.length === 0 ? (
          <p className="text-gray-500 text-center">
            Start a conversation...
          </p>
        ) : (
          messages.map((msg, index) => (
            <div
              key={index}
              className={`p-3 rounded-2xl max-w-[75%] transition-opacity duration-300 ${
                msg.sender === "user"
                  ? "bg-blue-500 text-white self-end shadow-md"
                  : msg.sender === "system"
                  ? "bg-green-300 text-gray-800 self-center shadow-md"
                  : "bg-gray-300 text-gray-800 self-start shadow-md"
              }`}
            >
              {msg.text}
            </div>
          ))
        )}
        <div ref={chatEndRef} />
      </div>

      {/* "Typing" Indicator */}
      {isTyping && (
        <div className="text-gray-400 text-sm italic text-center">
          Typing...
        </div>
      )}

      {/* Input Box */}
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
          className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
        />
        <button
          onClick={sendMessage}
          className="ml-2 p-3 bg-blue-500 hover:bg-blue-600 text-white rounded-full transition duration-300 shadow-md"
        >
          <FaPaperPlane className="text-lg" />
        </button>
      </div>
    </div>
  );
}
