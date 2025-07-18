import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import CheckinForm from "./pages/CheckinForm"; // ⬅️ NUEVO: checkin
import InstructorDashboard from "./pages/InstructorDashboard";
import { ProtectedRoute } from "./components/ProtectedRoute";

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
      </Routes>
    </BrowserRouter>
  );
}

export default App;
