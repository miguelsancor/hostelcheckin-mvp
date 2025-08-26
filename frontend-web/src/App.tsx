// src/App.tsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import CheckinForm from "./pages/CheckinForm";
import InstructorDashboard from "./pages/InstructorDashboard";
import { ProtectedRoute } from "./components/ProtectedRoute";
import TestMCP from "./pages/TestMCP"; // ⬅️ NUEVO

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />

        <Route
          path="/checkin"
          element={
            <ProtectedRoute>
              <CheckinForm />
            </ProtectedRoute>
          }
        />

        <Route
          path="/instructor-dashboard"
          element={
            <ProtectedRoute>
              <InstructorDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/mcp-test" // ⬅️ NUEVO: sandbox MCP
          element={
            <ProtectedRoute>
              <TestMCP />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
