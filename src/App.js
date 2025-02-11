import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { SessionProvider } from "./SessionContext";
import MainPage from "./components/MainPage";
import WebViewer from "./components/WebViewer";
import ChatRouteWrapper from "./components/ChatRouteWrapper";
import Header from "./components/Header";

function App() {
  return (
    <SessionProvider>
      <Router>
        <Header />
        <div className="min-h-screen flex pt-[80px]">
          <div className="flex-1">
            <Routes>
              <Route path="/" element={<MainPage />} />
              <Route path="/webviewer" element={<WebViewer />} />
            </Routes>
          </div>
          <Routes>
            <Route
              path="/webviewer"
              element={
                <div className="w-full md:w-96 border-l border-gray-200 p-4">
                  <ChatRouteWrapper />
                </div>
              }
            />
          </Routes>
        </div>
      </Router>
    </SessionProvider>
  );
}

export default App;
