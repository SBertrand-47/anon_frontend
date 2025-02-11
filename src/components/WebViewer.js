import { useEffect, useRef, useState, useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import * as AllCountries from "country-flag-icons/react/3x2";
import { US } from "country-flag-icons/react/3x2";
import { FaVideo, FaStepForward, FaStopCircle, FaSpinner } from "react-icons/fa";
import { SessionContext } from "../SessionContext";

export default function WebViewer() {
  const location = useLocation();
  const navigate = useNavigate();
  // Retrieve myCode, partnerCode, and clientId from navigation state.
  const { myCode, partnerCode, clientId } = location.state || {};
  const { videoMatched, setVideoMatched } = useContext(SessionContext);

  // Refs for local and remote video, stream, RTCPeerConnection, and signaling socket.
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const pcRef = useRef(null);
  const signalingSocketRef = useRef(null);

  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [waitingMessage, setWaitingMessage] = useState("Searching for a partner...");
  const maxRetries = 3;

  const getFlagComponent = (countryCode) => {
    if (countryCode === "globe") return <span>🌐</span>;
    if (countryCode === "random") return <span>❓</span>;
    if (countryCode === "US") return <US title="United States" width="48" height="32" />;
    const CountryFlag = AllCountries[countryCode];
    return CountryFlag ? <CountryFlag title={countryCode} width="48" height="32" /> : <span>Flag not found</span>;
  };

  const startLocalStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      setError(null);
    } catch (err) {
      console.error("Error accessing media devices:", err);
      if (retryCount < maxRetries) {
        setError(`Retrying access to camera/mic... (attempt ${retryCount + 2} of ${maxRetries})`);
        setRetryCount(retryCount + 1);
      } else {
        setError("Could not access camera/mic after several attempts.");
      }
    }
  };

  const initWebRTC = async () => {
    const configuration = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };
    const pc = new RTCPeerConnection(configuration);
    pcRef.current = pc;

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current);
      });
    }

    pc.ontrack = (event) => {
      console.log("Received remote track");
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        const message = JSON.stringify({
          type: "candidate",
          candidate: event.candidate.toJSON(),
        });
        if (signalingSocketRef.current && signalingSocketRef.current.readyState === WebSocket.OPEN) {
          signalingSocketRef.current.send(message);
        }
      }
    };

    pc.onnegotiationneeded = async () => {
      console.log("Negotiation needed (handled by the designated initiator).");
    };
  };

  const initSignaling = () => {
    const signalingProtocol = window.location.protocol === "https:" ? "wss" : "ws";
    let wsUrl = `${signalingProtocol}://anonafrica.fly.dev/ws/video/${partnerCode}`;
    if (partnerCode === "globe" && myCode) {
      wsUrl += `?myCountry=${myCode}`;
    }
    wsUrl += wsUrl.includes('?') ? `&clientId=${clientId}` : `?clientId=${clientId}`;
    const socket = new WebSocket(wsUrl);
    signalingSocketRef.current = socket;

    socket.onopen = () => {
      console.log("Video signaling WebSocket connected");
      setError(null);
    };

    socket.onmessage = async (event) => {
      console.log("Received signaling message (video):", event.data);
      let data;
      try {
        data = JSON.parse(event.data);
      } catch (err) {
        console.error("Error parsing signaling message:", err);
        return;
      }
      const pc = pcRef.current;
      if (!pc) {
        console.error("RTCPeerConnection not initialized");
        return;
      }
      switch (data.type) {
        case "matched":
          console.log("Signaling: matched");
          setVideoMatched(true);
          setWaitingMessage("Matched! Connecting now...");
          if (data.initiator) {
            setTimeout(async () => {
              try {
                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);
                const message = JSON.stringify({
                  type: "offer",
                  sdp: pc.localDescription,
                });
                socket.send(message);
              } catch (err) {
                console.error("Error creating offer:", err);
              }
            }, 2000);
          }
          break;
        case "offer":
          console.log("Signaling: received offer");
          try {
            await pc.setRemoteDescription(data.sdp);
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            const message = JSON.stringify({
              type: "answer",
              sdp: pc.localDescription,
            });
            socket.send(message);
          } catch (err) {
            console.error("Error handling offer:", err);
          }
          break;
        case "answer":
          console.log("Signaling: received answer");
          try {
            await pc.setRemoteDescription(data.sdp);
          } catch (err) {
            console.error("Error setting remote description:", err);
          }
          break;
        case "candidate":
          console.log("Signaling: received candidate");
          try {
            await pc.addIceCandidate(data.candidate);
          } catch (err) {
            console.error("Error adding received ICE candidate:", err);
          }
          break;
        case "partner_disconnected":
          console.log("Signaling: partner disconnected");
          setVideoMatched(false);
          setWaitingMessage("Your partner left. Finding a new match...");
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = null;
          }
          if (pcRef.current) {
            pcRef.current.close();
            pcRef.current = null;
          }
          break;
        case "partner_skipped":
          console.log("Signaling: partner skipped");
          setVideoMatched(false);
          setWaitingMessage("Your partner skipped. Searching for a new match...");
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = null;
          }
          if (pcRef.current) {
            pcRef.current.close();
            pcRef.current = null;
          }
          break;
        default:
          console.warn("Unknown signaling message type:", data.type);
      }
    };

    socket.onerror = (error) => {
      console.error("Signaling WebSocket error:", error);
      setError("Signaling WebSocket encountered an error.");
    };

    socket.onclose = () => {
      console.log("Signaling WebSocket closed");
    };
  };

  const handleSkip = () => {
    console.log("Skipping to the next partner...");
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    if (signalingSocketRef.current) {
      signalingSocketRef.current.close();
      signalingSocketRef.current = null;
    }
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
    setVideoMatched(false);
    setWaitingMessage("Searching for a new partner...");
    setTimeout(() => {
      startLocalStream().then(() => {
        initWebRTC();
        initSignaling();
      });
    }, 1000);
  };

  const handleStop = () => {
    console.log("Stopping the call...");
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    if (signalingSocketRef.current) {
      signalingSocketRef.current.close();
      signalingSocketRef.current = null;
    }
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    navigate("/");
  };

  useEffect(() => {
    startLocalStream().then(() => {
      initWebRTC();
      initSignaling();
    });
    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
        localStreamRef.current = null;
      }
      if (signalingSocketRef.current) {
        signalingSocketRef.current.close();
      }
      if (pcRef.current) {
        pcRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    if (retryCount > 0 && retryCount <= maxRetries) {
      const timer = setTimeout(() => { startLocalStream(); }, 1000);
      return () => clearTimeout(timer);
    }
  }, [retryCount]);

  return (
    <div className="flex flex-col w-full max-w-7xl mx-auto space-y-8 p-4">
      <h2 className="text-xl font-bold text-gray-700 flex items-center space-x-2">
        <FaVideo />
        <span>Live Video</span>
      </h2>
      {error && <div className="text-red-500 text-center px-4 mb-2">{error}</div>}
      {(!videoMatched) && (
        <div className="flex items-center justify-center space-x-2 text-blue-500 mb-2">
          <FaSpinner className="animate-spin text-2xl" />
          <span>{waitingMessage}</span>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
        {/* Local Video */}
        <div className="bg-gray-300 flex flex-col items-center justify-center rounded-lg overflow-hidden shadow-md">
          <video ref={localVideoRef} autoPlay playsInline className="w-full h-full" />
          <span className="text-sm text-gray-700 mt-2">Local Video</span>
        </div>
        {/* Remote Video */}
        <div className="bg-gray-300 flex flex-col items-center justify-center rounded-lg overflow-hidden shadow-md">
          {videoMatched ? (
            <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full" />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 space-y-2">
              <FaSpinner className="animate-spin text-3xl" />
              <span>{waitingMessage}</span>
            </div>
          )}
          <span className="text-sm text-gray-700 mt-2">Remote Video</span>
        </div>
      </div>
      <div className="flex space-x-3 mt-4">
        <button
          onClick={handleSkip}
          className="px-6 py-3 text-white font-semibold bg-yellow-500 hover:bg-yellow-600 rounded-xl shadow-md transition duration-300 flex items-center space-x-2"
        >
          <FaStepForward />
          <span>Skip</span>
        </button>
        <button
          onClick={handleStop}
          className="px-6 py-3 text-white font-semibold bg-red-600 hover:bg-red-700 rounded-xl shadow-md transition duration-300 flex items-center space-x-2"
        >
          <FaStopCircle />
          <span>Stop</span>
        </button>
      </div>
    </div>
  );
}
