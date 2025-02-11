import { createContext, useState } from "react";

export const SessionContext = createContext();

export function SessionProvider({ children }) {
  const [chatMatched, setChatMatched] = useState(false);
  const [videoMatched, setVideoMatched] = useState(false);

  return (
    <SessionContext.Provider value={{ chatMatched, setChatMatched, videoMatched, setVideoMatched }}>
      {children}
    </SessionContext.Provider>
  );
}
