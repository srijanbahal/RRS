// src/App.tsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";

// Soon you can add more pages here
// import LoginPage from "./pages/LoginPage";
// import DashboardPage from "./pages/DashboardPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* The default route "/" now shows your LandingPage */}
        <Route path="/" element={<LandingPage />} />

        {/* This is where you'll add your auth pages:
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
        */}
      </Routes>
    </BrowserRouter>
  );
}

